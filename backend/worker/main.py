"""Background Worker entrypoint (SADD 11.2).

Runs judge polling (M2), attack resolution (M4), territory recalculation
(M5), and league reconciliation (M7) OFF the request-serving path, so a
slow judge call never blocks a FastAPI worker thread (NFR-1.1, NFR-1.3).

Imports service-layer functions from app.modules.* — never duplicates
their logic (SADD §4.1 coupling rule). Each module owns its own "what's
due" query behind its service.py; the loop below only schedules when to
ask.

Loop shape:
- One `WORKER_TICK_SECONDS` sleep drives every job.
- Each job declares its own interval, so cadence lives with the schedule
  table rather than as scattered `if tick % N` branches.
- Jobs run sequentially. PostgreSQL row locks in M4/M5 are correctness
  mechanisms, not throughput targets, and one job at a time keeps them
  honest on a single-connection dev box.
- A failing job is logged and retried on the next tick; it never kills
  the loop, and it never leaves its session open.
- SIGTERM/SIGINT set a stop flag so an in-flight judge call finishes
  before the process exits.
"""
import asyncio
import signal
import time
from dataclasses import dataclass
from typing import Awaitable, Callable, List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.session import SessionLocal

logger = get_logger(__name__)

JobFn = Callable[[Session], Awaitable[dict]]


@dataclass(frozen=True)
class Job:
    name: str
    interval_seconds: int
    run: JobFn
    run_immediately: bool = True


# ── M2: judge polling ──────────────────────────────────────────────────


async def job_sync_due_accounts(db: Session) -> dict:
    """Sync verified Codeforces accounts whose recurring sync is due (REQ-2.1)."""
    from app.modules.m2_platform_sync.service import PlatformSyncService
    from app.modules.m2_platform_sync.sync_scheduler import SyncScheduler

    sync_service = PlatformSyncService()
    accounts = sync_service.get_due_sync_accounts(db)
    scheduler = SyncScheduler(db)

    succeeded = failed = 0
    for account in accounts:
        if await scheduler.sync_judge_account(str(account.id)):
            succeeded += 1
        else:
            failed += 1

    return {"due": len(accounts), "succeeded": succeeded, "failed": failed}


async def job_retry_dlq(db: Session) -> dict:
    """Retry accounts parked in the dead-letter queue once backoff elapses (SADD 4.4)."""
    from app.modules.m2_platform_sync.service import PlatformSyncService
    from app.modules.m2_platform_sync.sync_scheduler import SyncScheduler

    sync_service = PlatformSyncService()
    entries = sync_service.get_due_dlq_retries(db)
    scheduler = SyncScheduler(db)

    succeeded = failed = 0
    for entry in entries:
        # sync_judge_account clears the DLQ row on success and re-parks it
        # with an escalated backoff on failure, so we never delete here.
        if await scheduler.sync_judge_account(str(entry.judge_account_id)):
            succeeded += 1
        else:
            failed += 1

    return {"retried": len(entries), "succeeded": succeeded, "failed": failed}


# ── M4: attack resolution ──────────────────────────────────────────────


async def job_resolve_expired_attacks(db: Session) -> dict:
    """Resolve attacks whose window has elapsed (SADD §7.6).

    resolve_attack() is idempotent on already-resolved attacks, so a
    repeated pass over the same batch is safe.
    """
    from app.modules.m4_attacks.service import AttackService

    attack_service = AttackService(db)
    due_ids = attack_service.get_due_attack_ids(limit=settings.ATTACK_RESOLUTION_BATCH_SIZE)

    resolved = 0
    for attack_id in due_ids:
        try:
            attack_service.resolve_attack(attack_id, is_abandoned=True)
            resolved += 1
        except Exception as exc:  # noqa: BLE001 — one bad attack must not stall the batch
            db.rollback()
            logger.warning(
                "attack_resolution_failed",
                attack_id=attack_id,
                error=str(exc),
            )

    return {"due": len(due_ids), "resolved": resolved}


# ── M5: territory ──────────────────────────────────────────────────────


async def job_recalculate_territory(db: Session) -> dict:
    """Rescore stale guild zone contributions and reconcile ownership (REQ-5.x)."""
    from app.modules.m5_guild_territory.service import GuildService

    guild_service = GuildService(db)
    due_guild_ids = guild_service.get_due_guild_ids(limit=settings.TERRITORY_RECALC_BATCH_SIZE)

    rescored = 0
    for guild_id in due_guild_ids:
        try:
            guild_service.recalculate_guild_zone_scores(guild_id)
            rescored += 1
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            logger.warning(
                "territory_rescore_failed",
                guild_id=str(guild_id),
                error=str(exc),
            )

    return {"due": len(due_guild_ids), "rescored": rescored}


# ── M7: league reconciliation ──────────────────────────────────────────


async def job_reconcile_league(db: Session) -> dict:
    """Repair league-profile drift. Trophy movement itself is event-driven."""
    from app.modules.m7_league_trophy.service import LeagueService

    league_service = LeagueService(db)
    repaired = league_service.reconcile_profiles(limit=settings.LEAGUE_RECONCILE_BATCH_SIZE)
    return {"repaired": repaired}


JOBS: List[Job] = [
    Job(
        name="sync_due_accounts",
        interval_seconds=settings.SYNC_POLL_INTERVAL_MINUTES * 60,
        run=job_sync_due_accounts,
    ),
    Job(
        name="retry_dlq",
        interval_seconds=settings.DLQ_SWEEP_MINUTES * 60,
        run=job_retry_dlq,
    ),
    Job(
        name="resolve_expired_attacks",
        interval_seconds=settings.WORKER_TICK_SECONDS,
        run=job_resolve_expired_attacks,
    ),
    Job(
        name="recalculate_territory",
        interval_seconds=settings.TERRITORY_RECALC_INTERVAL_MINUTES * 60,
        run=job_recalculate_territory,
    ),
    Job(
        name="reconcile_league",
        interval_seconds=settings.WORKER_TICK_SECONDS * 20,
        run=job_reconcile_league,
    ),
]


class Worker:
    """Sequential job scheduler with per-job intervals and graceful shutdown."""

    def __init__(self, jobs: Optional[List[Job]] = None, tick_seconds: Optional[int] = None):
        self.jobs = jobs if jobs is not None else JOBS
        self.tick_seconds = tick_seconds or settings.WORKER_TICK_SECONDS
        self._stop_requested = False
        # Run each job on its first tick, then only once its interval elapses.
        self._next_run_at: dict[str, float] = {
            job.name: (0.0 if job.run_immediately else time.monotonic() + job.interval_seconds)
            for job in self.jobs
        }

    def request_stop(self, *_: object) -> None:
        self._stop_requested = True
        logger.info("worker_stop_requested")

    def install_signal_handlers(self) -> None:
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, self.request_stop)

    async def run_job(self, job: Job) -> dict:
        db = SessionLocal()
        try:
            result = await job.run(db)
        except Exception as exc:  # noqa: BLE001 — a failed job must not kill the loop
            db.rollback()
            logger.error("job_failed", job=job.name, error=str(exc), exc_info=True)
            return {}
        finally:
            db.close()

        logger.info("job_completed", job=job.name, **result)
        return result

    async def tick(self) -> None:
        now = time.monotonic()
        for job in self.jobs:
            if now < self._next_run_at[job.name]:
                continue
            # Next slot is claimed before the job runs, so a slow job cannot
            # be re-entered by a later tick.
            self._next_run_at[job.name] = now + job.interval_seconds
            await self.run_job(job)

    async def run_forever(self) -> None:
        logger.info(
            "worker_started",
            tick_seconds=self.tick_seconds,
            jobs=[{"name": j.name, "interval_seconds": j.interval_seconds} for j in self.jobs],
        )
        while not self._stop_requested:
            await self.tick()
            if self._stop_requested:
                break
            # Sleep in slices so a stop signal is noticed promptly.
            slept = 0.0
            while slept < self.tick_seconds and not self._stop_requested:
                slice_seconds = min(1.0, self.tick_seconds - slept)
                await asyncio.sleep(slice_seconds)
                slept += slice_seconds

        logger.info("worker_stopped")


async def main() -> None:
    configure_logging()
    worker = Worker()
    worker.install_signal_handlers()
    await worker.run_forever()


if __name__ == "__main__":
    asyncio.run(main())
