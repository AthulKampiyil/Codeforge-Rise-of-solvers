# CodeForge: Rise of Solvers — Sprint 2 Implementation Plan

## Context

CodeForge is a gamified competitive-programming platform (Group 7, IIIT Kottayam) specified by
**SRS v1.0** (`plan/Group7_CodeForge_SRS (1)-1.pdf`) and **SADD v1.1**
(`plan/Group_7_CodeForge_SADD(3).docx`). Sprint 1 delivered a well-organised **skeleton**: the
nine-module folder structure, working registration/login, a Codeforces submission fetcher, a topic
tagger, and thin CRUD services for village/attacks/guild/league.

What Sprint 1 did *not* deliver is the system the documents describe. Concretely:

| Area | Sprint 1 reality |
|---|---|
| Database | 7 of the 13 SADD entities are missing; 4 more are renamed |
| Game logic | None of SADD §7.3.1 exists (Elo trophies, matchmaking band, territory scoring) |
| Redis | Imported nowhere in the repo, despite being fixed by SRS §2.7 |
| Worker | `backend/worker/main.py` is a docstring with zero executable lines |
| Realtime | In-process dict registry; event names don't match SADD Appendix B.1 |
| M6, M9 | One-line stub routers returning `"coming in Sprint 2"` |
| Frontend | Empty. No `index.html`, no `App.jsx` — `npm run build` fails today |
| Tests | 3 files, no `conftest.py`, and `postgresql.UUID` columns can't build on SQLite |
| CI | `pytest \|\| true` — the backend job cannot fail |

**Goal of this plan:** take the repository from skeleton to a working, demonstrable v1.0 that an
evaluator can trace line-by-line against the SRS traceability matrix (SADD §12.1) — every REQ-x.y
implemented, every SADD §7.3.1 formula present with its documented constants, and a React + Phaser
frontend matching the SRS Figures 3.1–3.4 aesthetic.

### Decisions taken (confirmed with the user)

1. **Schema realigns to the SADD ER diagram (Fig 6.1)**; migrations 001–004 are replaced by one
   clean baseline. No production data exists, so this is safe.
2. **Full SADD v1.1 fidelity** on resilience: CircuitBreaker, PostgreSQL Dead-Letter Queue +
   sweeper, Redis read-through cooldown cache, Redlock-deduplicated territory sweep, atomic
   `UPDATE`/`UPSERT`/`FOR UPDATE` write patterns, and rate limiting.
3. **Codeforces is the only judge.** The `JudgeAdapter` abstraction stays (SRS 5.4 Extensibility)
   but LeetCode/CodeChef adapters are dropped and the deferral recorded in the SADD.
4. **REQ-backed screens only**, styled to match the dark "CODEVILLE" mockups. Seasons, Stars,
   Influence, Supply Lines, Tech, Diplomacy and World Events are *not* built as mechanics; the
   mockups' vocabulary is mapped onto real concepts (see §Frontend).
5. **Attack scoring is verified by sync** — the attacker solves real Codeforces problems, and
   `solved_problems` is matched against `attack_problem_sets`.
6. **Sequential phases, one implementer** (me), in dependency order.
7. **Frontend stack:** plain JSX + Tailwind CSS + TanStack Query + React Router + Phaser 3.

### Consequences to record in the documents

Two small SADD amendments fall out of the above and must be written into `docs/` as part of
Phase 14 so the documents and the code do not diverge again:

- **`village_profiles` is a new table** not on the ER diagram. SADD §7.3.1.1 matchmaking runs
  `SELECT villages WHERE defense_rating BETWEEN :min AND :max`, which needs an indexed per-user
  summary row. It is a materialised projection of `village_topic_progress`, exactly the pattern
  SADD §6.6 already permits for `league_profiles.trophy_count` and
  `zone_contributions.aggregated_score`.
- **`ProxyRotator` is out of scope.** SADD §4.4 introduces it solely to survive WAF blocks on
  *scraped* judges. With Codeforces only (official REST API), it has no failure mode to defend
  against. CircuitBreaker, RetryPolicy and the DLQ *are* still built — Codeforces rate-limits at
  ~1 request / 2 s and returns 5xx under load.

---

## Target architecture at a glance

```
backend/app/
  core/        config.py  security.py  dependencies.py  redis.py(NEW)  rate_limit.py(NEW)
               errors.py(NEW)  logging.py(NEW)
  db/          base.py  session.py
  middleware/  request_context.py(NEW — correlation id)   [csrf.py deleted]
  modules/     m1_auth .. m9_admin_config   (models/schemas/repository/service/router each)
backend/worker/
  main.py      job loop + registry            jobs/sync.py  jobs/dlq_sweeper.py
  jobs/attack_resolution.py  jobs/territory_sweep.py  jobs/village_recompute.py
frontend/src/
  features/<module>/{api,hooks,components}    game/scenes/{VillageScene,WarMapScene}.js
  shared/{api,websocket,ui,theme}             routes/
```

**Module coupling rule (SADD §4.1), enforced by a test in Phase 14:** a module may import another
module's `service.py` only — never its `repository.py` or `models.py`.

---

## Phase 0 — Foundations & environment

**Why first:** nothing below can be verified until the stack runs and tests can execute.

### 0.1 Repo hygiene
- Delete `backend/check_import.py` (leftover debug scratch) and the empty `opens/` directory.
- Add `plan/` to `.gitignore`? **No** — keep the source documents in the repo; they are the
  contract. Instead move them to `docs/` alongside the contracts and update `docs/README.md`,
  which already claims `docs/SRS.pdf` and `docs/SADD.docx` exist but they do not.

### 0.2 Dependencies
`backend/requirements.txt` — pin versions (currently unpinned, so CI is not reproducible) and add:

```
redis[hiredis]        # SADD 2.4 — cooldown cache, rate limits, pub/sub, Redlock
tenacity              # RetryPolicy: exponential backoff + jitter (SADD 4.4)
structlog             # correlation-id logging (SADD 10.1)
pytest-asyncio        # async service tests
pytest-cov
respx                 # httpx mocking for CodeforcesAdapter tests
alembic, psycopg2-binary, sqlalchemy, fastapi, uvicorn, ... (pin existing)
```

`frontend/package.json` — add `@tanstack/react-query`, `tailwindcss`, `postcss`, `autoprefixer`,
`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.

### 0.3 Local stack
`docker compose` is not installed on this machine (`docker: unknown command: docker compose`).
First step of the run book is `sudo apt install docker-compose-plugin`. Fallback documented in the
README: raw `docker run` for `postgres:16-alpine` and `redis:7-alpine` plus a local venv.

Fix `docker-compose.yml`:
- Drop the obsolete `version: "3.9"` key (emits a warning today).
- The `frontend` service builds a **production nginx image** but compose publishes `5173:5173`;
  nginx listens on 80, so the port mapping is dead. Split into `Dockerfile` (nginx, prod) and
  `Dockerfile.dev` (`vite --host`), and point compose at the dev one.
- `backend/Dockerfile` copies only `app/` — `alembic/` and `alembic.ini` never reach the image, so
  `alembic upgrade head` cannot run in a container. Copy them.
- Add an `api` entrypoint that runs `alembic upgrade head` before `uvicorn`
  (SADD §11.5: "migrations applied before an application node is brought into service").
- Add healthchecks on postgres/redis and `depends_on: condition: service_healthy`.

### 0.4 Config
Extend `app/core/config.py`. Note `.env.example` and `config.py` currently disagree —
`.env.example` defines `DATABASE_URL`/`SESSION_SECRET`/`ATTACK_COOLDOWN_MINUTES`, none of which
`Settings` reads. Reconcile both to one list:

```
POSTGRES_* / REDIS_*            (existing, keep)
SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
FRONTEND_URL, JUDGE_MODE, CODEFORCES_API_BASE
CODEFORCES_RATE_LIMIT_PER_SEC=0.5     # CF allows ~1 req / 2 s
SYNC_POLL_INTERVAL_MINUTES=360        # TBD-7, resolved
ONDEMAND_SYNC_COOLDOWN_SECONDS=300    # REQ-2.2, once per 5 min
WORKER_TICK_SECONDS=30
DLQ_SWEEP_MINUTES=15
```

Game-balance values (cooldown, tolerances, K-factors, thresholds, hysteresis) do **not** live here
— they live in the `game_balance_config` table so M9 can change them at runtime (UC-12).
`app/core/config.py` holds only infrastructure config.

### 0.5 Shared infrastructure (new files)
- **`app/core/redis.py`** — a single `redis.asyncio` client + sync client, `get_redis()` FastAPI
  dependency, and `redlock_acquire(key, ttl)` / `redlock_release(key, token)` helpers using
  `SET NX PX` with a random token and a Lua compare-and-delete release.
- **`app/core/rate_limit.py`** — a Redis token-bucket / fixed-window limiter used by REQ-2.2
  (on-demand sync), NFR-3.4 (attack initiation, guild actions), and the global Codeforces API
  budget. Exposed as a FastAPI dependency factory `rate_limit(key_fn, limit, window)` returning
  HTTP 429 with a `Retry-After` header.
- **`app/core/errors.py`** — a `DomainError` hierarchy (`CooldownActive`, `NotGuildLeader`,
  `JudgeUnavailable`, `AlreadyLinked`, …) and a FastAPI exception handler mapping each to a
  specific status + machine-readable `code`, satisfying SADD §10.1 ("domain-level exceptions
  caught at the service layer and translated into specific, user-facing error messages"). Today
  services raise `HTTPException` directly from the service layer, which leaks HTTP into the domain.
- **`app/core/logging.py` + `app/middleware/request_context.py`** — structlog with a per-request
  correlation id (SADD §10.1: "module, operation, correlation id").
- **Delete `app/middleware/csrf.py`.** It is a no-op pass-through, and with `Authorization: Bearer`
  (not cookies) there is no CSRF surface. Record the reasoning in `docs/security-notes.md` rather
  than shipping security theatre.

### 0.6 Test harness
`backend/tests/conftest.py` (new). The existing tests use in-memory SQLite, but M1/M2/M3/M4/M7
models use `postgresql.UUID` and the new schema needs `JSONB` and `TEXT[]` — none compile on
SQLite. **Tests run against real PostgreSQL + Redis.**

```python
# conftest.py provides:
#   session-scoped engine bound to TEST_DATABASE_URL (default: ..._test on the dev postgres)
#   alembic upgrade head once per session
#   function-scoped `db` in a transaction rolled back after each test (fast, isolated)
#   `redis_client` flushing a dedicated test DB index
#   `client` TestClient with get_db/get_redis overridden
#   `auth_client` factory -> registered+logged-in user with a Bearer header
#   `seed_topics`, `seed_zones` fixtures
```

Rewrite the three existing test files against these fixtures.

**Verify Phase 0:** `docker compose up --build` brings up postgres, redis, api, worker, frontend;
`curl localhost:8000/health` returns 200; `pytest` collects and runs (green on the rewritten
Sprint-1 tests).

---

## Phase 1 — Database baseline

One migration, `001_baseline.py`, replacing `001`–`004`. Delete the old four.

### Entities (SADD §6.3/§6.4 names, verbatim where the doc gives them)

| Table | Key columns | Source |
|---|---|---|
| `users` | `user_id` PK, `username`/`email` UNIQUE, `password_hash`, `is_admin`, `is_suspended`, **`attack_cooldown_expires_at`**, `created_at` | §6.4, §7.2.1 |
| `judge_accounts` | `judge_account_id` PK, `user_id` FK, `judge_type` ENUM, `handle`, `verified_flag`, `verification_token`, `last_sync_at`; **UNIQUE(judge_type, handle)** | §6.4, §6.5.3 |
| `solved_problems` | `solved_id` PK, `judge_account_id` FK, `problem_ext_id`, `topic_tags TEXT[]`, `rating`, `solved_at`; **UNIQUE(judge_account_id, problem_ext_id)** | §6.4, §6.5.3 |
| `topics` | `topic_id` PK, `name` UNIQUE, `base_threshold`, `display_name`, `structure_key` | §6.4 |
| `village_topic_progress` | PK `(user_id, topic_id)`, `level`, `progress_points`, `updated_at` | §6.4 |
| `village_profiles` *(new, see Context)* | `user_id` PK, `defense_rating`, `total_solved`, `average_level`, `last_recomputed_at`; **INDEX on `defense_rating`** | matchmaking §7.3.1.1 |
| `attacks` | `attack_id` PK, `attacker_user_id`, `target_user_id`, `status` ENUM(Created, InProgress, Completed, Abandoned, Resolved), `score`, `solved_fraction`, `started_at`, `window_expires_at`, `resolved_at` | §6.4, App. B.1 |
| `attack_problem_sets` | `attack_problem_id` PK, `attack_id` FK, `problem_ext_id`, `problem_name`, `problem_url`, `topic_id`, `rating`, `solved_flag`, `solved_at` | §6.4 |
| `guilds` | `guild_id` PK, `name` UNIQUE, `description`, `created_at` | §6.4 |
| `guild_memberships` | PK `(guild_id, user_id)`, `role` ENUM(Leader, Officer, Member), `joined_at`; **partial unique index on `user_id` for active rows** (one guild per solver, §6.5.3) | §6.4 |
| `guild_join_requests` *(implied by REQ-5.2 / `approveJoin(id)`)* | `request_id` PK, `guild_id`, `user_id`, `status` ENUM(Pending, Approved, Rejected), `decided_by`, `decided_at` | §5.2 |
| `territory_zones` | `zone_id` PK, `name` UNIQUE, `topic_affinity JSONB`, `owning_guild_id` FK NULL, `map_polygon JSONB`, `updated_at` | §6.4 |
| `zone_contributions` | PK `(zone_id, guild_id)`, `aggregated_score NUMERIC`, `updated_at` | §6.4 |
| `league_profiles` | `user_id` PK, `trophy_count`, `league_tier` ENUM, `updated_at` | §6.4 |
| `trophy_ledger` | `ledger_id` PK, `user_id` FK, `event_type` ENUM, `delta`, `source_ref_id`, `created_at` | §6.4 |
| `sync_logs` | `user_id`, `judge_account_id`, `status` ENUM(up_to_date, in_progress, failed, degraded), `last_synced_at`, `last_error` | REQ-2.4 + §10.1 "degraded" |
| `sync_dead_letter` | `dlq_id` PK, `judge_account_id` FK, `failure_reason` ENUM(rate_limited, circuit_open, parse_error, auth_expired, unknown), `attempt_count`, `last_attempted_at`, `next_retry_at`, `payload_snapshot JSONB` | §4.4 verbatim |
| `notifications` | `notification_id` PK, `user_id`, `event_type`, `payload JSONB`, `is_read`, `created_at` | M8 |
| `game_balance_config` | `key` PK, `value JSONB`, `value_type`, `description`, `updated_by`, `updated_at` | UC-12 |
| `admin_audit_log` | `audit_id` PK, `admin_user_id`, `action`, `target_type`, `target_id`, `details JSONB`, `created_at` | NFR-3.5 |

Also drop `websocket_connections` — SADD §4.4 makes M8 a *stateless* gateway over Redis pub/sub;
persisting socket rows to Postgres on every connect is both wrong and a write-amplification
problem. Connection state lives in Redis (`ws:online:{user_id}` sets with TTL).

### Constraints (SADD §6.5.3)
All FKs `NOT NULL` and `ON DELETE RESTRICT` except where the doc says otherwise
(`territory_zones.owning_guild_id` is nullable). Composite indexes on
`village_topic_progress(user_id, topic_id)` and `zone_contributions(zone_id, guild_id)` for the
NFR-1.1 2-second load target, plus `attacks(target_user_id, started_at)` for the defense-grace
lookup and `league_profiles(trophy_count DESC)` for leaderboards.

### Portability
Add `app/db/types.py` with a `GUID` `TypeDecorator` (PG `UUID`, else `CHAR(32)`) so models are not
welded to one dialect. Tests still run on Postgres because of `JSONB`/`TEXT[]`, but this removes
the gratuitous coupling flagged in SADD §5.4 Maintainability.

### Seed data (`backend/app/db/seed.py`, invoked by an `alembic` data migration `002_seed.py`)

**Topics** — chosen to match the mockup sidebar (Graph, DP, Trees, Greedy, Math, Strings) and the
village wireframe (Arrays Hut, Graph Tower, DP Fortress, Greedy Mill):

| name | display | structure_key | base_threshold |
|---|---|---|---|
| `arrays` | Arrays | hut | 10 |
| `strings` | Strings | library | 10 |
| `math` | Math | observatory | 10 |
| `greedy` | Greedy | mill | 10 |
| `graphs` | Graphs | tower | 12 |
| `trees` | Trees | grove | 12 |
| `dynamic-programming` | DP | fortress | 14 |
| `data-structures` | Data Structures | vault | 12 |

**Territory zones** — 8 zones named after the mockup map (Northmere Capital, Frozen Archives,
Iron Peaks, Thornvale, The Nexus, Rivergate, Sunken Library, Codewall), each with a
`topic_affinity` map over the topics above summing to 1.0, and a `map_polygon` for the Phaser
War Map.

**Game balance defaults** — every constant from SADD §7.3.1, seeded so M9 can tune them live:

```
attack.cooldown_minutes            = 60
attack.window_hours                = 24
attack.problem_set_size            = 3
attack.defense_grace_minutes       = 15
matchmaking.base_tolerance         = 0.12
matchmaking.tier_adjustment        = {bronze:0.08, silver:0.05, gold:0.02,
                                      platinum:0.0, diamond:-0.02, legend:-0.08}
matchmaking.min_candidates         = 3
matchmaking.widen_step             = 0.05
matchmaking.max_tolerance          = 0.30
matchmaking.recent_attack_window_h = 24
trophy.k_factor                    = {bronze:32, silver:32, gold:32,
                                      platinum:24, diamond:24, legend:16}
trophy.defense_threshold           = 0.34
trophy.abandon_penalty             = 5
trophy.elo_divisor                 = 400
league.thresholds                  = {bronze:0, silver:400, gold:800,
                                      platinum:1300, diamond:1900, legend:2600}
league.starting_trophies           = 300
territory.hysteresis_margin        = 0.05
territory.decay_per_day            = 0.02
territory.decay_floor              = 0.50
village.defense_base               = 100
village.defense_level_weight       = 10
village.defense_solved_weight      = 0.25
sync.circuit_failure_threshold     = 5
sync.circuit_window_seconds        = 120
sync.circuit_cooldown_seconds      = 600
sync.circuit_cooldown_max_seconds  = 7200
sync.max_inline_retries            = 2
sync.dlq_backoff_cap_hours         = 6
```

**Verify Phase 1:** `alembic upgrade head` then `alembic downgrade base` then up again, clean;
`alembic check` reports no drift between models and migration; seed rows present.

---

## Phase 2 — M1 Authentication & Account Linking

Files: `backend/app/modules/m1_auth/{models,schemas,repository,service,router}.py`,
`app/core/{security,dependencies}.py`.

### 2.1 Rename to SADD vocabulary
`LinkedJudgeProfile` → `JudgeAccount`, `hashed_password` → `password_hash`,
`judge_name` → `judge_type`, `verified` → `verified_flag`. Sprint 1's
`docs/auth-contract.md` must be regenerated to match.

### 2.2 Real Codeforces ownership verification (REQ-1.4, NFR-3.1) — **currently a stub that
always approves**

Two-step flow using Codeforces' own profile fields — no credentials ever touch CodeForge (NFR-3.2):

```
POST /judge-accounts            {judge_type, handle}
  -> creates judge_accounts row, verified_flag = false
  -> returns verification_token = "codeforge-" + secrets.token_urlsafe(16)
  -> instructions: "Set your Codeforces profile First Name to this token, then click Verify."

POST /judge-accounts/{id}/verify
  -> M2 service call: CodeforcesAdapter.get_user_info(handle)   [GET /api/user.info?handles=]
  -> if response.firstName == verification_token:
         verified_flag = true; verification_token = NULL
         enqueue an initial full sync for this account
     else: 400 VERIFICATION_TOKEN_NOT_FOUND with the token echoed back
  -> rate-limited to 1 attempt / 30 s per account
```

Documented alternative (recorded in `docs/auth-contract.md`, not built): submit a deliberately
compiling-but-failing solution to a fixed problem within N minutes and detect it via
`user.status`. The profile-field method is chosen because it is idempotent and needs no timing
window.

**Cross-module note:** M1 calls `M2SyncService.fetch_user_info()`, i.e. another module's
`service.py` — permitted by SADD §4.1. M1 must not import `judge_adapters` directly.

### 2.3 Session invalidation (REQ-1.6) — **currently `POST /auth/logout` is a no-op**
REQ-1.6 requires logout to *invalidate* the session. Add a `jti` claim to every access token and a
Redis denylist:

```
login   -> jti = uuid4(); token carries {sub, jti, exp}
logout  -> SETEX auth:denylist:{jti} <remaining_ttl> "1"
verify  -> reject if EXISTS auth:denylist:{jti}
```

Also add `POST /auth/refresh` (the refresh token is issued today but there is no endpoint that
consumes it) with refresh-token rotation, and reject `type: "refresh"` tokens at
`get_current_user` — today `verify_token()` accepts either, so a refresh token works as an access
token.

### 2.4 Fix `datetime.utcnow()` throughout
Deprecated in Python 3.12 (the Docker runtime) and produces naive datetimes that will compare
incorrectly against Postgres `timestamptz`. Replace with `datetime.now(timezone.utc)` and make all
`DateTime` columns `timezone=True`. This matters for every cooldown/window comparison downstream.

### 2.5 Role dependencies (NFR-3.3)
`app/core/dependencies.py` gains:
- `get_current_active_user` — 403 if `is_suspended` (UC-11 needs suspension to actually bite).
- `require_admin` — 403 unless `is_admin`.
- `require_guild_role(*roles)` — resolves the caller's `guild_memberships.role`, used by M5/M6.
- `get_optional_user` — for the Guest/Visitor public-leaderboard path (SADD §9.3).

### Endpoints (SADD Appendix B)
`POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` ·
`GET /auth/me` · `POST /judge-accounts` · `POST /judge-accounts/{id}/verify` ·
`GET /judge-accounts` · `DELETE /judge-accounts/{id}`

**Verify Phase 2:** register → login → link handle → verify against a `respx`-mocked
`user.info` → 401 after logout → refresh rotates → suspended user gets 403.

---

## Phase 3 — M8 Notification & Realtime Gateway (built early: M3/M4/M5/M7 all publish through it)

Files: `backend/app/modules/m8_notifications/*`.

### 3.1 Redis pub/sub fan-out — **the current implementation cannot work**
Today `active_connections` is a module-global dict in the API process. The Worker resolves attacks
and recalculates territory in a *different process*, so it can never reach a socket. Replace with:

```
NotificationPublisher.publish(event, user_ids | "broadcast")
  -> persist to `notifications` (audit/history)
  -> redis.publish("codeforge:events", envelope_json)

Each API node runs a lifespan task subscribed to "codeforge:events":
  -> on message, look up locally-held sockets for the target user ids, send_json
  -> a node holding none of the targets simply drops the message
```

This is what lets the stateless API tier scale horizontally (SADD §2.2.1) — the property the
current design silently breaks.

### 3.2 Envelope + event schemas (SADD Appendix B.1, verbatim)
```json
{ "event_type": "...", "event_id": "uuid", "version": "1.0",
  "timestamp": "ISO-8601", "payload": { } }
```
Implemented events, with the exact payload fields the SADD specifies:
- `ATTACK_INCOMING` → target user (REQ-4.5)
- `TERRITORY_ZONE_CHANGED` → broadcast (REQ-5.4)
- `VILLAGE_UPDATED` → owning user, `source: "sync" | "attack_resolution"` (REQ-3.4)

Plus three the flows require but the SADD only implies:
`ATTACK_RESOLVED`, `LEAGUE_TIER_CHANGED` (REQ-7.3 "and notifies them"), `SYNC_STATUS_CHANGED`
(REQ-2.4). These get an Appendix B.1 addendum in Phase 14.

The Sprint-1 enum (`attack_received`, `territory_lost`, …) is deleted — it matches no document.

### 3.3 Endpoint
`WS /ws/events?token=<jwt>` — path per SADD Appendix B (currently `/notifications/ws`).
Authenticates the JWT before `accept()`, registers `ws:online:{user_id}` in Redis with a heartbeat
TTL, handles ping/pong, and unregisters on disconnect in a `finally` block. The current handler
references `service` after an exception path where it may be unbound — rewrite.

REST: `GET /notifications?limit=` · `POST /notifications/{id}/read` · `GET /notifications/unread-count`.

**Verify Phase 3:** two `websockets` clients on two uvicorn workers; publish from a third process;
both receive it. Assert the envelope validates against the SADD schema.

---

## Phase 4 — M2 Coding Platform Sync

Files: `backend/app/modules/m2_platform_sync/*` (note `service.py`, `repository.py`, `schemas.py`
are currently **empty docstring files** — all logic wrongly lives in `sync_scheduler.py`).

### 4.1 `judge_adapters/base.py` — the `JudgeAdapter` ABC
```python
class JudgeAdapter(ABC):
    judge_type: JudgeType
    async def get_user_info(handle) -> JudgeUserInfo          # verification, rating
    async def get_submissions(handle, since) -> list[NormalizedSolve]
    async def get_problemset(tags, rating_range) -> list[NormalizedProblem]
```
`NormalizedSolve`/`NormalizedProblem` are Pydantic models — the "common normalized-activity shape"
of SADD §7.1. Nothing outside this package may see a Codeforces-shaped dict. Today
`sync_scheduler` reads `submission["problem"]["tags"]` directly, which violates that boundary.

Delete `judge_adapters/{leetcode,codechef}.py`; keep the ABC so a future judge is a new file.

### 4.2 `judge_adapters/codeforces.py` — hardened
- `GET /user.info`, `/user.status`, `/problemset.problems` (the last one feeds M4's curator).
- Global Redis token bucket at `CODEFORCES_RATE_LIMIT_PER_SEC` shared across all worker processes.
- `tenacity` retry: exponential backoff + jitter, max `sync.max_inline_retries`, only on
  5xx/timeout/429.
- Classify failures into the DLQ `failure_reason` enum.
- Incremental fetch: `user.status?from=1&count=N` newest-first, stop once older than
  `judge_accounts.last_sync_at`, instead of pulling the entire history every run as today.
- Dedupe accepted verdicts by `contestId-index`, carry `rating` and `tags` through.

### 4.3 `circuit_breaker.py` (SADD §4.4, per judge not per account)
Redis-backed so state is shared across workers:
```
CLOSED --5 failures in 120 s--> OPEN --600 s--> HALF_OPEN --success--> CLOSED
                                                          --failure--> OPEN (600→1200→2400s, cap 7200)
```
While OPEN, sync jobs short-circuit with **no HTTP call** and go straight to the DLQ with
`reason=circuit_open`. `sync_logs.status` becomes `degraded` so the UI can say
"degraded: codeforces" rather than blaming the user's account (SADD §10.1).

### 4.4 `dead_letter.py` + DLQ sweeper (SADD §4.4)
`UPSERT INTO sync_dead_letter` with `next_retry_at = now() + (2^attempt_count) minutes`, capped at
6 h. A **separate** worker job every 15 minutes pulls `next_retry_at <= now()`, retries, and either
clears the row or increments the backoff. The main sync queue is never blocked by one bad account
— exactly the guarantee SADD §4.4 makes for REQ-2.5.

### 4.5 `service.py` — `SyncService`
```
scheduled_sync()                  # worker: every SYNC_POLL_INTERVAL_MINUTES
on_demand_sync(judge_account_id)  # REQ-2.2, rate-limited 1/5 min via app/core/rate_limit
_sync_one(account) ->
    circuit check -> adapter.get_submissions(since=last_sync_at)
    -> validate each solve (NFR-2.2) before persistence
    -> INSERT .. ON CONFLICT (judge_account_id, problem_ext_id) DO NOTHING   # idempotent, REQ-2.5
    -> TopicTagger.map(tags) -> M3VillageService.apply_solved_problems(user, solves)
    -> M4AttackService.mark_attack_problems_solved(user, problem_ext_ids)    # attack scoring
    -> update last_sync_at + sync_logs
    -> on failure: inline retry, then DLQ; previously-synced data untouched (REQ-2.5)
```
Validation before persistence (NFR-2.2) is the step SADD Fig 7.2 calls out explicitly and Sprint 1
skips entirely: reject missing `problem_ext_id`, `solved_at` in the future, tag lists that aren't
strings, ratings outside 0–4000.

### 4.6 `topic_tagger.py` — remap to the Phase 1 topic set
The current map targets `algorithms/optimization/...` which will no longer exist. Codeforces tag →
topic, e.g. `dp → dynamic-programming`; `graphs|dfs and similar|shortest paths|flows → graphs`;
`trees|dsu → trees`; `data structures → data-structures`; `strings|string suffix structures →
strings`; `math|number theory|combinatorics|geometry → math`; `greedy → greedy`;
`implementation|sortings|two pointers|binary search|brute force → arrays`. Unmapped tags are
counted in a `sync.unmapped_tags` metric rather than silently dropped, so the map can be tuned.

### 4.7 Endpoints
`POST /sync/{judge_account_id}` (429 + `Retry-After` when inside the 5-minute window) ·
`GET /sync/status` (per-account `status`, `last_synced_at`, `last_error`, `is_degraded` — REQ-2.4).

**Verify Phase 4:** `respx`-mocked CF returning 3 accepted submissions → `solved_problems` rows,
village progress moves, `VILLAGE_UPDATED` fires. Re-running the same sync inserts nothing new
(idempotency). Mock 5 consecutive 503s → circuit OPEN, next call makes zero HTTP requests and
writes a DLQ row. Second on-demand sync within 5 min → 429.

---

## Phase 5 — M3 Personal Code Village

Files: `backend/app/modules/m3_village/*`.

### 5.1 Levelling (REQ-3.1) — replace `floor(sqrt(solved_count))`
SADD §6.4 defines `TOPIC.base_threshold` ("progress points required per level") and
`VILLAGE_TOPIC_PROGRESS.progress_points`, neither of which Sprint 1 uses.

```
points_for(problem) = 1 + max(0, (rating - 800) // 200)      # unrated -> 1
level(P, B) = max L such that  B * L*(L+1)/2 <= P            # triangular growth
```
A 1600-rated solve is worth 5 points; with `base_threshold=10`, reaching Graphs Lv6 costs 210
points. All three constants are in `game_balance_config`.

`apply_solved_problems()` uses an atomic upsert per the SADD §6.5.1 pattern rather than
read-modify-write:
```sql
INSERT INTO village_topic_progress (user_id, topic_id, progress_points, level)
VALUES (:u, :t, :pts, 0)
ON CONFLICT (user_id, topic_id)
DO UPDATE SET progress_points = village_topic_progress.progress_points + EXCLUDED.progress_points,
              updated_at = now()
RETURNING progress_points;
```
then a single idempotent `UPDATE ... WHERE level != :new_level` — matching the trophy pattern the
SADD spells out, and closing the lost-update race Sprint 1's `progress.solved_count += 1` has.

### 5.2 Defense rating (REQ-3.3) — currently hard-coded `0.0`
```
defense_rating = defense_base
               + Σ_topics (level_t * defense_level_weight)
               + round(total_solved * defense_solved_weight)
```
Equal-weighted per SADD §13.3 (weighting is listed as a *future* enhancement). Persisted to
`village_profiles.defense_rating` so matchmaking can range-scan it. Recomputed on every sync and
by a nightly `village_recompute` worker job that rebuilds from `solved_problems` — the
recomputability SADD §6.1 designs for.

### 5.3 Render state (REQ-3.2, `getRenderState()`)
`GET /village` returns everything the Phaser scene needs in one round trip (NFR-1.1):
```json
{ "user_id", "username", "defense_rating", "total_solved", "average_level",
  "last_sync_at", "sync_status",
  "topics": [{ "topic_id","name","display_name","structure_key","level",
               "progress_points","points_to_next_level","progress_pct" }] }
```
`structure_key` is what maps a topic to a sprite (Arrays→hut, Graphs→tower, DP→fortress …),
keeping the art choice server-driven.

`GET /village/{user_id}` — another solver's public village, used by the Attack screen and by the
War Room's "link through to that member's detailed village view" (REQ-6.3).

### 5.4 Live update (REQ-3.4)
Publish `VILLAGE_UPDATED` with `previous_level`, `new_level`, `new_defense_rating`, `source`,
`source_ref_id` on any level change. Only on *change* — not on every sync — to protect the
NFR-1.4 budget from noise.

**Verify Phase 5:** table-driven tests on `level()` and `points_for()`; feeding 30 solves produces
the expected levels and defense rating; `VILLAGE_UPDATED` fires once per level-up and not otherwise.

---

## Phase 6 — M7 League & Trophy Progression (before M4: attack resolution writes trophies)

Files: `backend/app/modules/m7_league_trophy/*`.

### 6.1 `TrophyLedger` — the only path to mutate `league_profiles` (SADD §7.2 / App. D)
```python
def record(user_id, event_type, delta, source_ref_id) -> LeagueProfile:
    INSERT INTO trophy_ledger (...)                              # append-only audit, REQ-7.1
    UPDATE league_profiles SET trophy_count = trophy_count + :delta, updated_at = now()
      WHERE user_id = :u RETURNING trophy_count                  # atomic, §6.5.1
    new_tier = tier_for(trophy_count)
    UPDATE league_profiles SET league_tier = :new_tier
      WHERE user_id = :u AND league_tier != :new_tier            # idempotent, §6.5.1
    if changed: publish LEAGUE_TIER_CHANGED                      # REQ-7.3
```
Sprint 1's `add_points()` does `trophy.points + points` in Python then writes it back — the exact
lost-update race SADD §6.5.1 was written to prevent. There is no setter on `LeagueProfile`;
`record()` is the only mutator.

### 6.2 Elo trophy calculation (SADD §7.3.1.3, resolves TBD-5)
```
E_attacker = 1 / (1 + 10^((R_target - R_attacker) / 400))
E_target   = 1 - E_attacker

Case 1  scored attack, f = solved / total:
        Δ_attacker = round(K * (f - E_attacker))
        Δ_target   = round(K * ((1 - f) - E_target))
Case 2  successful defense (f < 0.34, or window elapsed): as Case 1 with f = 0
Case 3  abandoned with zero submissions inside the window:
        Δ_attacker = -abandon_penalty (flat 5),  Δ_target = 0
```
K by tier: Bronze–Gold 32, Platinum–Diamond 24, Legend 16. `R` is `village_profiles.defense_rating`.
Implemented in `trophy_calculator.py` with the SADD's worked example
(1200 vs 1200, f=0.667, K=32 → +5/−5) as a literal unit test.

### 6.3 Tiers (REQ-7.2/7.3) — six tiers from `league.thresholds`, evaluated on every ledger write.
New users start at `league.starting_trophies` (300, Bronze) so the Elo maths has a sane baseline.

### 6.4 Leaderboards (REQ-7.5)
`GET /leaderboards?scope=global|guild&limit=&cursor=` — keyset pagination on
`(trophy_count DESC, user_id)`, cached in Redis for 60 s (SADD §3.3 lists leaderboards as the
canonical short-lived cache). Readable by Guests (SADD §9.3) via `get_optional_user`.
`GET /league/profile` returns tier, trophies, `progress_to_next_tier`, rank (REQ-7.4).

**Verify Phase 6:** SADD's worked example passes; concurrent `record()` calls from 20 threads sum
exactly; the ledger sum always equals `league_profiles.trophy_count`; a tier crossing emits exactly
one event.

---

## Phase 7 — M4 Async Village Attacks

Files: `backend/app/modules/m4_attacks/*`.

### 7.1 Cooldown: PostgreSQL source of truth + Redis cache (SADD §7.2.1 verbatim)
Delete the `attack_cooldowns` table; `users.attack_cooldown_expires_at` is authoritative.

```
launch (write-through):
  BEGIN; UPDATE users SET attack_cooldown_expires_at = :exp WHERE user_id = :id;
         INSERT INTO attacks (...); COMMIT;
  SET cooldown:{user_id} = :exp EX :seconds        # cache AFTER the durable commit

check (read-through, hot path):
  v = GET cooldown:{user_id}
  if v: active = v > now()                          # O(1), meets NFR-1.3
  else: read users.attack_cooldown_expires_at; if future, repopulate cache with remaining TTL
```
A Redis restart therefore costs one extra Postgres read, never a lost cooldown.

### 7.2 `matchmaking.py` (SADD §7.3.1.1, resolves TBD-3)
```
tolerance = base_tolerance + tier_adjustment[tier(attacker)]
band      = R_attacker * (1 ∓ tolerance)
candidates = village_profiles
  WHERE defense_rating BETWEEN band                       # indexed range scan
    AND user_id != attacker
    AND user_id NOT IN (targets attacked by attacker in last 24 h)
    AND user_id NOT IN (targets attacked by anyone in last defense_grace_minutes)
    AND user_id NOT IN (users with is_suspended)
if len < 3: widen tolerance by 0.05, retry once, cap total 0.30
return ranked by |R_target - R_attacker| asc
```
`GET /attack/targets` — one query, indexed, well inside the NFR-1.3 3-second budget.
Sprint 1's version `return []`.

### 7.3 `problem_set_curator.py` (REQ-4.2)
```
weak_topics = target's 3 lowest-level topics (ties broken by fewest progress_points)
for each weak topic:
    candidates = CodeforcesAdapter.get_problemset(tag=cf_tag_for(topic),
                                                  rating in [R_att-200, R_att+300])
    exclude anything in attacker's solved_problems       # must be a genuine challenge
    pick one, weighted toward the attacker's rating band
persist to attack_problem_sets with problem_ext_id, name, url, rating, topic_id
```
`problemset.problems` is fetched once and cached in Redis for 24 h — it changes rarely and is a
large payload, so it must never sit on the request path repeatedly.

### 7.4 Attack lifecycle (SADD §7.6 state diagram)
```
Created --curated--> InProgress --all solved / window elapsed--> Completed --scored--> Resolved
                          `--attacker abandons or 0 solved at expiry--> Abandoned --> Resolved
```
- `POST /attack {target_user_id}` → cooldown check → matchmaking validation (the target must be a
  legal candidate; do not trust a client-supplied id) → curate → `InProgress`,
  `window_expires_at = now + 24 h` → write-through cooldown → `ATTACK_INCOMING` to the target.
  Rate-limited per NFR-3.4.
- Attacker solves on codeforces.com. `POST /sync/{id}` (from the Attack screen, or the scheduled
  poll) writes `solved_problems`; `mark_attack_problems_solved()` flips
  `attack_problem_sets.solved_flag` for any match where `solved_at > attacks.started_at`.
- `POST /attack/{id}/submit` marks the attack `Completed` early and enqueues a priority sync.
- **Worker `attack_resolution` job** (every 60 s) resolves `Completed` attacks and `InProgress`
  attacks past `window_expires_at`:
  ```
  f = solved_count / total
  Δ from TrophyCalculator (Case 1/2/3) -> TrophyLedger.record(...) for both users
  attacks.score = round(f * 100); status = Resolved
  if attacker in a guild: M5.apply_attack_contribution(...)
  publish ATTACK_RESOLVED to both users
  ```

### 7.5 Endpoints
`GET /attack/targets` · `POST /attack` · `GET /attack/{id}` · `POST /attack/{id}/submit` ·
`GET /attack/active` · `GET /attack/history` · `GET /attack/cooldown`

**Verify Phase 7:** launch → 429 on a second launch → `FLUSHDB` on Redis → cooldown still enforced
from Postgres. Curated problems are all unsolved-by-attacker and drawn from the target's weakest
topics. A synthetic sync solving 2 of 3 yields the exact Elo deltas from the SADD example.

---

## Phase 8 — M5 Guild Management & Territory Control

Files: `backend/app/modules/m5_guild_territory/*`.

### 8.1 Guild membership (REQ-5.1, REQ-5.2)
Rebuild around join *requests* — Sprint 1 has a leader directly adding arbitrary users, which is
not what REQ-5.2 describes and lets a leader conscript anyone.
```
POST   /guilds                               create; creator becomes Leader (unique name)
POST   /guilds/{id}/join-request             solver requests to join
GET    /guilds/{id}/requests                 Leader/Officer only
POST   /guilds/{id}/requests/{rid}/approve   Leader/Officer only  -> membership + recalc zones
POST   /guilds/{id}/requests/{rid}/reject
DELETE /guilds/{id}/members/{user_id}        Leader/Officer only (business rule 5.5)
POST   /guilds/{id}/leave
GET    /guilds  ·  GET /guilds/{id}  ·  GET /guilds/me
```
The one-guild-per-solver business rule is enforced by the Phase 1 partial unique index *and*
checked in the service for a friendly error. Sprint 1's `get_user_guild()` looks up
`Guild.owner_id`, so a plain member appears guild-less — replaced by a membership lookup.
Role changes (`Member` ↔ `Officer`) are Leader-only. Rate-limited per NFR-3.4.

### 8.2 Territory scoring (SADD §7.3.1.2, resolves TBD-2)
```
member_zone_score(m, Z) = Σ_{t ∈ Z.topic_affinity} (affinity[t] * level(m, t)) * activity_decay(m)
activity_decay(m)       = max(0.50, 1 - 0.02 * days_since_last_sync(m))
guild_zone_score(G, Z)  = Σ_{m ∈ active members} member_zone_score(m, Z)
```
Maintained incrementally with the SADD §6.5.1 upsert:
```sql
INSERT INTO zone_contributions (zone_id, guild_id, aggregated_score)
VALUES (:z, :g, :delta)
ON CONFLICT (zone_id, guild_id)
DO UPDATE SET aggregated_score = zone_contributions.aggregated_score + EXCLUDED.aggregated_score,
              updated_at = now();
```
Deltas arrive from village level-ups (M3) and attack outcomes (M4).

### 8.3 Ownership resolution with hysteresis (REQ-5.4)
```sql
BEGIN;
SELECT guild_id, aggregated_score FROM zone_contributions WHERE zone_id = :z FOR UPDATE;
-- leader = argmax; flip only if leader_score > incumbent_score * 1.05
UPDATE territory_zones SET owning_guild_id = :leader, updated_at = now()
 WHERE zone_id = :z AND owning_guild_id IS DISTINCT FROM :leader;
COMMIT;
```
`FOR UPDATE` is scoped to one zone, so unrelated zones keep taking concurrent increments. On an
actual flip, publish `TERRITORY_ZONE_CHANGED` (broadcast). The 5 % margin is what stops noise-level
flips from spamming the NFR-1.4 budget.

### 8.4 Reconciliation sweep, Redlock-deduplicated (SADD §6.5.2)
Worker job, hourly: `redlock_acquire("territory_sweep_lock", ttl=5min)`; if not acquired, skip.
Recomputes every zone's score **from scratch** (overwrite, not increment — so it is idempotent and
a lost lock costs only wasted CPU, never correctness) and re-resolves ownership. Correctness comes
from Postgres, never from Redlock — the distinction the SADD makes explicitly.

### 8.5 Map (REQ-5.5)
`GET /territory` — all zones with `owning_guild`, per-guild scores, `topic_affinity`, and
`map_polygon`, cached 30 s. Readable by all authenticated users. Feeds `WarMapScene.js`.

**Verify Phase 8:** two guilds contest a zone; a 3 % lead does *not* flip ownership, a 7 % lead
does and emits exactly one event. Two concurrent sweeps produce one run. Decay drops an
inactive member's contribution to the 0.50 floor after 25 days.

---

## Phase 9 — M6 Guild War Room (currently a one-line stub)

Files: `backend/app/modules/m6_war_room/*`. No new tables — M6 is a read-only composition over
M5 and M3, per SADD §4.4.

```
GET /guilds/{id}/war-room        require_guild_role(Leader, Officer)   # NFR-3.3
{
  "guild": {...},
  "contested_zones": [ { zone, our_score, leading_guild, leading_score,
                         gap_pct, top_affinity_topics } ],
  "members": [ { user_id, username, defense_rating, league_tier, last_sync_at,
                 topic_levels: {...},
                 zone_contributions: [ { zone_id, contribution, share_pct } ],   # REQ-6.3
                 aligns_with_contested: [ zone_id, ... ] } ]                     # REQ-6.2
}
```
"Contested" = this guild is within ±20 % of the leader, or owns the zone with a challenger inside
20 %. A member "aligns" with a contested zone when their top-2 topic levels intersect that zone's
two highest-affinity topics. Both thresholds go into `game_balance_config`.

Composed via `M5GuildService` and `M3VillageService` — service-layer calls only (SADD §4.1).
A 403 for a plain Member is a required test (NFR-3.3).

**Verify Phase 9:** Leader gets 200 with populated summaries; Officer 200; Member 403;
non-member 403. Highlighting picks the right members for a seeded contested zone.

---

## Phase 10 — M9 Admin & Game-Balance Configuration (currently a one-line stub)

Files: `backend/app/modules/m9_admin_config/*`. All endpoints behind `require_admin`.

### 10.1 `GameBalanceConfig` service (UC-12)
Typed get/set over `game_balance_config`, cached in Redis with a pub/sub invalidation message so
every API node and the worker pick up a change within seconds — without this, a cooldown change
applies only to whichever process happens to be asked. Every consumer built in Phases 5–8 reads
its constants through this service rather than a module-level `dict`.

```
GET /admin/config                    list all keys with type + description
PUT /admin/config/{key}              validated by value_type + per-key range guard
PUT /admin/config/cooldown           the endpoint named in SADD Appendix B
```

### 10.2 Moderation (UC-11)
```
GET    /admin/users?search=&suspended=
POST   /admin/users/{id}/suspend     {reason}  -> is_suspended = true
POST   /admin/users/{id}/unsuspend
POST   /admin/guilds/{id}/suspend
GET    /admin/sync/dead-letter       operational view of stuck accounts
POST   /admin/sync/dead-letter/{id}/retry
GET    /admin/audit-log?limit=&cursor=
```
Suspension must actually bite: `get_current_active_user` 403s, matchmaking excludes the user, and
their guild contribution stops counting.

### 10.3 Audit log (NFR-3.5)
A service-layer decorator writes `admin_audit_log` for every mutating admin action — admin id,
action, target, before/after values, correlation id. Never bypassable from the router.

**Verify Phase 10:** change `attack.cooldown_minutes` via the API → a new attack uses the new
value in both the API and worker processes without a restart. Non-admin gets 403 on every route.
Each mutation writes exactly one audit row.

---

## Phase 11 — Background Worker (`backend/worker/`)

Today `worker/main.py` is a docstring, so `python -m worker.main` exits immediately and the
`worker` compose service is dead. Build a small job runner (no Celery — SADD fixes the stack at
FastAPI/PG/Redis and a 4-person team does not need a broker):

```python
# worker/main.py — asyncio loop, graceful SIGTERM, per-job try/except so one failure
# never kills the loop; each job wrapped in a Redlock so N worker replicas don't duplicate work.
JOBS = [
  Job("sync_scheduler",     every=SYNC_POLL_INTERVAL_MINUTES * 60, fn=run_scheduled_sync),
  Job("dlq_sweeper",        every=DLQ_SWEEP_MINUTES * 60,          fn=run_dlq_sweep),
  Job("attack_resolution",  every=60,                              fn=resolve_due_attacks),
  Job("territory_sweep",    every=3600,                            fn=run_territory_sweep),
  Job("village_recompute",  every=86400,                           fn=recompute_all_villages),
]
```
Each job imports the corresponding module **service** — never duplicating logic, as
`worker/main.py`'s own docstring already promises. Structured logging with a per-run correlation
id, and a `worker_runs` heartbeat key in Redis surfaced at `GET /admin/worker/status`.

**Verify Phase 11:** `docker compose up worker` → logs show each job firing on schedule; killing
one worker of two shows the other picking up the next tick; a job raising does not stop the loop.

---

## Phase 12 — Frontend foundation

`frontend/` is empty today — this is greenfield.

```
frontend/
  index.html                       # MISSING today; npm run build fails without it
  tailwind.config.js  postcss.config.js
  src/
    main.jsx        App.jsx        routes/index.jsx
    shared/
      api/client.js                # fetch wrapper: base URL, Bearer, 401 -> refresh -> retry
      api/queryClient.js           # TanStack Query defaults
      websocket/client.js          # single /ws/events socket, reconnect w/ backoff, pub/sub
      theme/tokens.css             # CODEVILLE palette as CSS custom properties
      ui/                          # Panel, StatTile, DataTable, Tabs, ProgressBar, Toast,
                                   # Modal, Badge, EmptyState, Skeleton
      auth/AuthContext.jsx         # token storage, current user, route guards
```

**Design system**, read off the SRS mockups (Figures 3.1–3.4): near-black background
`#0d1117`-ish, panel `#141a22` with a 1px `#2a323d` border, gold accent `#c9a227` for headings and
the active nav item, red `#c94a4a` / green `#4ac97f` / blue for guild colours, a serif display face
for headings ("Season III Standings"), and a monospace face for all numerals and log lines. Dark
only — these mockups are not a light theme.

**Vocabulary mapping** (mockup word → real concept, so the UI matches the art without inventing
mechanics): *Influence* → `zone_contributions.aggregated_score`; *Stars* → trophies;
*Level* → village average level; *Topic Influence bars* → per-topic level + progress;
*Battle Log* → recent attacks; *Territories* → zones owned.

**Routing** (`routes/index.jsx`): `/login`, `/register`, `/onboarding` (guarded), `/` village
dashboard, `/attack`, `/attack/:id`, `/guild`, `/guild/browse`, `/war-map`, `/war-room`,
`/standings`, `/admin/*`, plus a public `/leaderboards`.

Add `frontend/Dockerfile.dev` and wire `vite --host` so the compose port mapping works.

**Verify Phase 12:** `npm run dev` serves; `npm run build` succeeds; login persists across reload;
a 401 transparently refreshes and retries.

---

## Phase 13 — Frontend screens

Each screen is a `features/<module>/` folder with `api/` (typed fetchers), `hooks/` (TanStack
Query hooks) and `components/`. All the `.gitkeep` placeholders get filled.

| Screen | Route | Requirements | Notes |
|---|---|---|---|
| Login / Register | `/login`, `/register` | REQ-1.1, 1.2 | Clear non-revealing error copy |
| Onboarding | `/onboarding` | REQ-1.3, 1.4 | ≤5 steps, <5 min (SRS 5.4): account → enter CF handle → copy token → set profile First Name → Verify → first sync |
| **Village Dashboard** | `/` | REQ-3.1–3.4 | SADD Fig 8.1: top banner (defense rating, attacks won, trophies, last sync + Refresh), left sidebar (player summary, topic influence bars), centre **Phaser `VillageScene`** |
| Sync Status | in banner + `/settings/judges` | REQ-2.2, 2.4 | Per-account status pill; `degraded: codeforces` distinguished from an account problem; Refresh disabled with a countdown inside the 5-min window |
| **Attack** | `/attack`, `/attack/:id` | REQ-4.1–4.5 | SADD Fig 8.2: candidate targets w/ strength, curated set with **"Open on Codeforces"** links, live solved x/3, window countdown, cooldown timer, outcome preview |
| Guild | `/guild`, `/guild/browse` | REQ-5.1, 5.2 | Roster table matching Fig 3.2 (#, member, LVL, SOLVED, ATTACKS, ROLE, STATUS); join requests inbox for Leader/Officer |
| **War Map** | `/war-map` | REQ-5.5 | Fig 3.1: **Phaser `WarMapScene`** — zone polygons tinted by owner, click for detail, live re-tint on `TERRITORY_ZONE_CHANGED`. Accessibility: guild name on hover + a legend, never colour alone (SADD §8.1) |
| War Room | `/war-room` | REQ-6.1–6.3 | Leader/Officer only; member × topic strength matrix, contested-zone highlight, contribution column, link to member village |
| Standings | `/standings` | REQ-7.4, 7.5 | Fig 3.3: podium + ranked table; global/guild toggle; own row highlighted |
| Admin | `/admin/*` | UC-11, UC-12 | Config editor, user/guild moderation, DLQ view, audit log |

**Phaser scenes** (`src/game/`):
- `config.js` — shared game config, `Scale.RESIZE` so the canvas tracks the viewport (SADD §8.1).
- `VillageScene.js` — reads `GET /village`, places one structure sprite per topic on an isometric
  grid, chooses the sprite variant from `structure_key` + `level` band (0, 1–2, 3–5, 6–9, 10+),
  click → topic detail panel, and re-renders in place on `VILLAGE_UPDATED` (REQ-3.4: no reload).
- `WarMapScene.js` — draws `map_polygon` per zone with the owning guild's colour, hover tooltip,
  click → zone detail, re-tint on `TERRITORY_ZONE_CHANGED`. Read-only mode reused by the War Room.
- Placeholder art: generated coloured-geometry sprites checked into `src/game/assets/`, so nothing
  blocks on artwork.

**Realtime wiring:** one WebSocket for the app; `useRealtimeEvent(type, handler)` subscribes, and
handlers invalidate the matching TanStack Query keys so the UI stays consistent with REST.

**Verify Phase 13:** full manual walkthrough (below), plus Vitest component tests on the level
bar, cooldown timer and role-gated War Room, and a Playwright smoke test of
register → link → sync → village.

---

## Phase 14 — Tests, CI, documentation, traceability

### 14.1 Test suite, organised by the SADD §12.1 test-case ids
```
tests/unit/          test_trophy_calculator.py   (TC-LEA-01..05, incl. the SADD worked example)
                     test_matchmaking.py         (TC-ATK-01)
                     test_territory_scoring.py   (TC-GLD-03, TC-GLD-04 hysteresis)
                     test_village_levelling.py   (TC-VILL-01, TC-VILL-03)
                     test_topic_tagger.py        (TC-SYNC-03)
                     test_circuit_breaker.py     (TC-SYNC-05)
tests/integration/   test_auth_flow.py           (TC-AUTH-01..06)
                     test_sync_flow.py           (TC-SYNC-01..05, respx-mocked CF)
                     test_attack_flow.py         (TC-ATK-02..05, end-to-end incl. resolution)
                     test_guild_flow.py          (TC-GLD-01..05)
                     test_war_room.py            (TC-WAR-01..03, incl. the 403 cases)
                     test_admin.py               (TC-ADM-01, TC-ADM-02)
                     test_realtime.py            (envelope conformance, cross-process fan-out)
tests/architecture/  test_module_coupling.py     — AST-walks every module and fails the build on
                                                   an import of another module's repository/models
                                                   (SADD §4.1, mechanically enforced)
```
Target ≥80 % coverage on `app/modules/*/service.py` and 100 % on the four game-logic formula
modules — those are the code an evaluator will read against §7.3.1.

### 14.2 CI (`.github/workflows/ci.yml`)
Remove `pytest || true` (the backend job cannot currently fail). Add `postgres:16` and `redis:7`
service containers, run `alembic upgrade head`, then `pytest --cov` with a coverage gate. Add
`ruff` + `black --check` for the backend and `eslint` + `vitest run` + `npm run build` for the
frontend. Keep it on `pull_request` for `main`/`develop`.

### 14.3 Documentation
- Rewrite `docs/auth-contract.md`, `docs/village-data-contract.md`, `docs/attacks-league-contract.md`
  against the shipped API (all three currently document Sprint 1 shapes that this plan changes).
- New: `docs/guild-territory-contract.md`, `docs/realtime-contract.md` (envelope + all six events),
  `docs/admin-contract.md`, `docs/security-notes.md` (why no CSRF middleware; token denylist design).
- Replace `docs/IMPLEMENTATION_PROGRESS.md` with a **traceability matrix** mapping every REQ-x.y and
  NFR to its module, file, endpoint and test id — the artefact SADD §12.1 promises the evaluator.
- Record the two SADD amendments from §Context (`village_profiles`; ProxyRotator deferred with the
  scraped judges) in a SADD v1.2 revision-history row.
- Update `README.md`: real run book, the docker-compose-plugin prerequisite, the Codeforces-only
  decision, and the module→owner table refreshed to the shipped paths.

---

## End-to-end verification

**Automated:** `pytest` green with the coverage gate; `npm run build` and `vitest run` green;
`alembic upgrade head` / `downgrade base` clean; the architecture test proves module isolation.

**Manual walkthrough** against `docker compose up --build` (this is the demo script):

1. Register two solvers, A and B. Link real Codeforces handles; set the profile First Name to the
   token; verify. → `judge_accounts.verified_flag = true`, first sync fires.
2. Watch A's village populate — topic structures appear on the Phaser canvas at their levels,
   defense rating non-zero, "Last sync" timestamp live. Hit Refresh twice → the second is
   rate-limited with a countdown (REQ-2.2).
3. A opens `/attack` → B appears as a candidate inside the tolerance band. Launch. → B's browser
   receives `ATTACK_INCOMING` in under 3 s (NFR-1.4); A's cooldown timer starts.
4. `docker compose restart redis` → A's cooldown is still enforced (SADD §7.2.1 read-through).
5. A solves one of the three curated problems on codeforces.com, hits Refresh → the attack card
   shows 1/3 without a page reload.
6. Force the window closed (or wait) → the worker resolves it; both A and B see `ATTACK_RESOLVED`;
   trophies move by the Elo amount; `trophy_ledger` shows two rows summing to the profile deltas.
7. A creates a guild; B requests to join; A approves. → zone contributions recalculate, War Map
   re-tints for both, `TERRITORY_ZONE_CHANGED` broadcast on an actual flip only.
8. A opens `/war-room` (Leader → 200); B opens it (Member → 403).
9. Admin changes `attack.cooldown_minutes` → A's next attack uses the new value with no restart;
   `admin_audit_log` has the row.
10. Point `CODEFORCES_API_BASE` at a dead host → after 5 failures the circuit opens, sync status
    reads `degraded: codeforces`, DLQ rows appear, and village/attack/guild all keep working
    (SRS 5.4 graceful degradation). Restore it → the DLQ sweeper drains within 15 minutes.

---

## Sequencing summary

```
P0  Foundations, deps, docker, redis, rate limit, errors, test harness
P1  Squashed schema baseline + seed (topics, zones, balance config)
P2  M1 auth: CF ownership verification, logout denylist, refresh, RBAC
P3  M8 realtime: Redis pub/sub gateway, SADD envelope, /ws/events
P4  M2 sync: adapter ABC, hardened CF adapter, circuit breaker, DLQ, solved_problems
P5  M3 village: progress points, levels, defense rating, render state, VILLAGE_UPDATED
P6  M7 league: trophy ledger, Elo calculator, tiers, leaderboards
P7  M4 attacks: PG+Redis cooldown, matchmaking band, curator, resolution
P8  M5 guild: join requests, zone scoring, hysteresis, Redlock sweep
P9  M6 war room (read-only composition, role-gated)
P10 M9 admin: balance config service, moderation, audit log
P11 Worker: job loop + five scheduled jobs
P12 Frontend foundation: Vite, Tailwind theme, router, api + ws clients, auth
P13 Frontend screens + the two Phaser scenes
P14 Tests, CI, contracts, traceability matrix, SADD v1.2 amendments
```

Dependencies are strictly left-to-right: P5 needs P4's `solved_problems`; P7 needs P5's
`defense_rating` and P6's ledger; P8 needs P5 and P7; P9 needs P5 and P8; P13 needs every
backend phase. P0–P2 are the hard prerequisite for everything.
