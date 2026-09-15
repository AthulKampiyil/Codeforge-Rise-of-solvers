# CodeForge: Rise of Solvers — Project Status & Setup Guide

**Group 7, IIIT Kottayam** · Last updated: 2026-09-08

This document explains **where the project stands today**, **how to install and run
it**, and **how the work was divided across the four team members**. It is written so
it can be read straight through when presenting progress to the course instructor.

---

## 1. What CodeForge is

CodeForge is a gamified competitive-programming platform. A player links their
Codeforces account; the problems they solve are synced and mapped to topics, which
level up "structures" in a personal **Code Village**. Players run **async attacks** on
each other's villages, form **guilds** that fight for **territory**, and climb a
**league / trophy** ladder. A **realtime gateway** pushes attack, territory and
war-room events to the browser live.

The build is specified by two approved documents kept in `plan/`:

- **SRS v1.0** — `plan/Group7_CodeForge_SRS (1)-1.pdf` (what the system must do)
- **SADD v1.1** — `plan/Group_7_CodeForge_SADD(3).docx` (how it is architected)

Every backend module folder maps 1:1 to a module ID in the SADD (see the table in
the root `README.md`).

---

## 2. Current state of the project

### 2.1 One-line summary

The **backend is a working modular monolith**: 7 of 9 feature modules are
implemented with real business logic, database schema, and a realtime gateway.
The **frontend has not been started** (only placeholder files exist). This is the
end of **Sprint 1 + early Sprint 2 backend hardening**; `plan.md` is the roadmap for
finishing Sprint 2.

### 2.2 Backend — module by module

| Module | Feature | State | Evidence |
|---|---|---|---|
| **M1** | Authentication & account linking | ✅ **Implemented** | Register, login, JWT access + refresh tokens, logout, `/me`, link/verify/list/unlink Codeforces judge accounts. ~550 lines. Has tests. |
| **M2** | Coding-platform sync | ✅ **Implemented** | Codeforces API adapter, topic tagger (CF tags → 6 fixed topics), sync scheduler, sync-status endpoint, dead-letter-queue model for failed syncs. ~630 lines. |
| **M3** | Personal Code Village | ✅ **Implemented** | Per-topic progress, level = `floor(sqrt(solved_count))`, aggregated village profile endpoint. ~260 lines. |
| **M4** | Async village attacks | ✅ **Implemented** | Start attack, cooldown enforcement backed by a Redis read-through cache, cooldown-status endpoint, attack target list. ~310 lines. |
| **M5** | Guild & territory control | ✅ **Implemented** | Guild create/list/detail, join-request workflow (request → approve/reject), member kick/leave, territory-zone listing. ~590 lines. |
| **M6** | Guild war room | 🟡 **Stub only** | Single placeholder route returning `"coming in Sprint 2"`. ~30 lines. |
| **M7** | League & trophy progression | ✅ **Implemented** | Trophy record, six league tiers (bronze→legend) with point thresholds, promote/demote on threshold crossing, league profile endpoint. ~230 lines. |
| **M8** | Notification & realtime gateway | ✅ **Implemented** | Redis pub/sub fan-out, WebSocket endpoint, per-process connection registry, notification list / unread-count / mark-read endpoints, background subscriber task started on app boot. ~420 lines. |
| **M9** | Admin & game-balance config | 🟡 **Stub only** | Placeholder route; empty service file. ~80 lines. |

### 2.3 Shared backend infrastructure — implemented

- **`app/core/config.py`** — all infra config from environment variables (DB URL,
  Redis URL, JWT secret, Codeforces settings, sync intervals). Game-balance numbers
  are deliberately **not** here — they belong in the M9 config table.
- **`app/core/security.py`** — bcrypt password hashing, HS256 JWT create/verify.
- **`app/core/redis.py`** — async + sync Redis clients and **Redlock** helpers
  (used only for job-scheduling deduplication, never for gameplay correctness).
- **`app/core/rate_limit.py`, `errors.py`, `logging.py`** — rate limiting,
  centralised exception handlers, structured logging with correlation IDs.
- **`app/middleware/request_context.py`** — attaches a request ID to every request.
- **`app/db/`** — `base_class.py` (declarative `Base`), `base.py` (Alembic model
  aggregator), `types.py` (`GUID` type so UUID columns work on Postgres and SQLite),
  `session.py` (engine + `get_db` dependency).
- **`app/main.py`** — FastAPI app, CORS, mounts all nine module routers + the
  WebSocket router, starts the realtime subscriber loop, exposes `/health`.

### 2.4 Database

- **`alembic/versions/001_baseline.py`** — one clean baseline migration creating the
  full schema (all SADD entities, explicit named enum types).
- **`alembic/versions/002_seed.py`** — seed data: topics (Arrays, Strings, Math,
  Graph, DP, Greedy, Trees…), territory zones, and game-balance defaults.

### 2.5 Not yet done

- **Frontend** — `frontend/src/` contains only comment placeholders and empty
  `.gitkeep` folders. There is no `index.html` or `App.jsx`; `npm run build`
  currently produces nothing meaningful. The stack is chosen and declared in
  `frontend/package.json`: React 18 + Vite + Tailwind + TanStack Query +
  React Router + Phaser 3.
- **Background worker** — `backend/worker/main.py` is a docstring with no executable
  code. Recurring judge polling, attack resolution, territory recalculation and
  trophy recalculation still run only on demand, not on a schedule.
- **M6 war room** and **M9 admin config** — stubs.
- **Tests** — only M1 (auth) and M8 (realtime) have test files. M2–M7 are untested.
- **CI** — `.github/workflows/ci.yml` runs `pytest || true`, so the backend job
  cannot currently fail the build.

### 2.6 Uncommitted work in progress

The working tree has fixes that make migrations and tests actually run:
splitting `Base` into `base_class.py` to break a circular import, pinning
`bcrypt==4.0.1` (newer bcrypt breaks passlib), and adding `create_type=False` to the
migration's enum definitions to stop duplicate `CREATE TYPE` errors.

---

## 3. How to install dependencies and run the project

### 3.1 Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| Docker + Docker Compose | recent | The one-command path (recommended) |
| Python | **3.12** | Running the backend without Docker |
| Node.js | **20** | Frontend tooling (once the frontend exists) |
| PostgreSQL | **16** | Backend database (provided by Docker) |
| Redis | **7** | Cooldowns, pub/sub, rate limiting (provided by Docker) |

### 3.2 Option A — Docker (recommended, runs everything)

```bash
cp .env.example .env          # then edit SECRET_KEY etc. if you like
docker compose up --build
```

This starts five services:

| Service | URL / port | Notes |
|---|---|---|
| `api` | http://localhost:8000 | FastAPI; docs at http://localhost:8000/docs |
| `frontend` | http://localhost:5173 | Vite dev server (placeholder until the frontend is built) |
| `postgres` | localhost:5432 | db `codeforge`, user/pass `codeforge` |
| `redis` | localhost:6379 | no persistence by design |
| `worker` | — | background worker container (currently idle) |

Apply the database schema and seed data (first run, from another terminal):

```bash
docker compose exec api alembic upgrade head
```

Health check: `curl http://localhost:8000/health` → `{"status":"ok",...}`

### 3.3 Option B — Backend only, without Docker

```bash
# 1. Start Postgres 16 and Redis 7 locally (or: docker compose up postgres redis)

# 2. Python environment
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Point the app at your local services.
#    config.py reads these env vars (defaults assume the Docker hostnames
#    "postgres" / "redis", so override the hosts for a local run):
export POSTGRES_HOST=localhost
export REDIS_HOST=localhost
export SECRET_KEY=dev-secret
export FRONTEND_URL=http://localhost:5173
export JUDGE_MODE=mock

# 4. Create the schema + seed data
alembic upgrade head

# 5. Run the API
uvicorn app.main:app --reload --port 8000
```

Key dependencies pulled in by `requirements.txt`: **FastAPI** + **Uvicorn** (web),
**SQLAlchemy 2** + **Alembic** + **psycopg2** (database), **redis** (cache / pub-sub),
**python-jose** + **passlib** + **bcrypt 4.0.1** (auth), **httpx** (Codeforces calls),
**pydantic-settings** (config), **structlog** (logging), **tenacity** (retry/backoff),
**pytest** + **pytest-asyncio** + **respx** (tests).

### 3.4 Running the backend tests

Tests run against **real Postgres + Redis** (the schema uses Postgres-only column
types), not SQLite:

```bash
# create a dedicated test database
createdb -U codeforge codeforge_test        # or: docker compose exec postgres createdb -U codeforge codeforge_test

cd backend
export TEST_DATABASE_URL=postgresql://codeforge:codeforge@localhost:5432/codeforge_test
export TEST_REDIS_URL=redis://localhost:6379/15
pytest -v
```

`conftest.py` runs `alembic upgrade head` against the test DB once per session and
wraps each test in a rolled-back transaction.

### 3.5 Frontend (once implemented)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm test           # vitest
```

### 3.6 Environment variables reference

All in `.env` (copy from `.env.example`):

| Variable | Purpose |
|---|---|
| `POSTGRES_USER/PASSWORD/DB/HOST/PORT` | Database connection |
| `REDIS_HOST/PORT/DB` | Redis connection |
| `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | JWT auth |
| `FRONTEND_URL` | CORS allow-origin |
| `JUDGE_MODE` | `mock` for dev, `real` to hit the live Codeforces API |
| `CODEFORCES_API_BASE`, `CODEFORCES_RATE_LIMIT_PER_SEC` | Codeforces adapter |
| `SYNC_POLL_INTERVAL_MINUTES`, `ONDEMAND_SYNC_COOLDOWN_SECONDS`, `DLQ_SWEEP_MINUTES` | Sync scheduling |
| `WORKER_TICK_SECONDS` | Background worker loop interval |

Game-balance numbers (attack cooldown, trophy K-factors, league thresholds,
territory hysteresis) are **not** env vars — by design they live in the
`game_balance_config` table so an admin can tune them live.

---

## 4. Work division — four contributors

The nine SADD modules plus infrastructure were split into four lanes so that the
backend and any future frontend work for one feature stays with one person and pull
requests do not collide.

### Section A — Identity & Platform Integration (M1, M2)

**Owner: Contributor A**

- **M1 Authentication:** user model, registration with email/username uniqueness,
  bcrypt hashing, JWT access + refresh token issue/verify, logout, `/auth/me`,
  and the full Codeforces judge-account link → verify → list → unlink flow.
- **M2 Platform Sync:** the `JudgeAdapter` abstraction and the concrete
  **Codeforces adapter** (fetches accepted submissions, dedupes by problem),
  the **topic tagger** that maps Codeforces problem tags onto the six fixed
  village topics, the **sync scheduler** that orchestrates fetch → tag → update,
  the sync-status endpoint, and the **dead-letter-queue** model for failed syncs.
- Delivered docs: `docs/auth-contract.md`, `docs/village-data-contract.md` (sync half).
- Tests: `backend/tests/test_m1_auth.py`.

### Section B — Core Gameplay Loop (M3, M4)

**Owner: Contributor B**

- **M3 Personal Code Village:** topic-progress model, the level formula
  `level = floor(sqrt(solved_count))`, and the aggregated `/village/me` profile
  (total solved, average level, per-topic breakdown, defense rating).
- **M4 Async Village Attacks:** attack model and status lifecycle, **cooldown
  enforcement** with a Redis read-through / write-through cache (returns HTTP 429
  when a player is still cooling down), the cooldown-status endpoint, and the
  attack-target listing.
- Delivered docs: `docs/village-data-contract.md` (village half),
  `docs/attacks-league-contract.md` (attacks half).

### Section C — Social & Competitive Systems (M5, M6, M7)

**Owner: Contributor C**

- **M5 Guild & Territory Control:** guild create / list / detail, the
  **join-request workflow** (request → officer approve/reject), member kick and
  self-leave, and territory-zone listing — the largest single module (~590 lines).
- **M7 League & Trophy Progression:** trophy record, the six-tier ladder
  (bronze → silver → gold → platinum → diamond → legend) with point thresholds,
  automatic **promotion/demotion** when a threshold is crossed, and the
  `/league/me` profile.
- **M6 Guild War Room:** scaffolded router (Sprint 2 completion item).
- Delivered docs: `docs/attacks-league-contract.md` (league half).

### Section D — Platform, Realtime & DevOps (M8, M9, infra, DB, CI)

**Owner: Contributor D**

- **M8 Notification & Realtime Gateway:** the Sprint-1 in-process socket dict was
  replaced with a **Redis pub/sub** design — every event is published to a Redis
  channel, each API process subscribes and forwards to the sockets it locally
  holds, which is what lets the API tier scale horizontally. Includes the
  WebSocket endpoint, the connection registry, notification list / unread-count /
  mark-read endpoints, and the subscriber task wired into app startup.
- **M9 Admin & Game-Balance Config:** scaffolded router + service (Sprint 2
  completion item), plus the design decision that all tunable numbers live in a DB
  table rather than env vars.
- **Shared infrastructure:** `app/core/` (config, security, Redis + Redlock
  helpers, rate limiting, error handlers, structured logging), the request-context
  middleware, the cross-dialect `GUID` column type, the `base_class.py` /
  circular-import fix, and the FastAPI app wiring in `app/main.py`.
- **Database & DevOps:** the single clean **`001_baseline`** migration, the
  **`002_seed`** data migration, `docker-compose.yml` (api, worker, frontend,
  postgres, redis with health checks), the Dockerfiles, `conftest.py` (real
  Postgres + Redis test harness), `test_m8_realtime.py`, and the GitHub Actions
  CI workflow.

### At a glance

| Section | Modules | Backend lines (approx.) | Status |
|---|---|---|---|
| A — Identity & Platform Integration | M1, M2 | ~1,180 | ✅ Implemented + tested (M1) |
| B — Core Gameplay Loop | M3, M4 | ~575 | ✅ Implemented |
| C — Social & Competitive Systems | M5, M6, M7 | ~845 | ✅ M5/M7 implemented, M6 stub |
| D — Platform, Realtime & DevOps | M8, M9, infra, DB, CI | ~1,100+ | ✅ M8 + infra implemented, M9 stub |

---

## 5. How to present this to the instructor

A suggested talking track:

1. **Frame it against the documents.** "Our repository structure is derived
   directly from the approved SRS and SADD — every backend module folder maps to a
   SADD module ID, and the folder rules (a module may only call another module's
   `service.py`) come from SADD §4.1." Point at the table in `README.md`.

2. **Show the running system.** `docker compose up --build`, then open
   `http://localhost:8000/docs` — the FastAPI interactive docs list **every
   implemented endpoint** grouped by module. This is the fastest way to show
   breadth: auth, judge linking, sync status, village profile, attacks + cooldown,
   guilds + join requests + territory, league, notifications, WebSocket.

3. **Walk one feature end to end.** Register → login → link a Codeforces handle →
   run a sync (mock mode) → `GET /village/me` shows topics levelling up →
   `POST /attacks` → second attack returns HTTP 429 because the Redis-backed
   cooldown is active. This demonstrates the database, the Codeforces adapter, the
   topic tagger, the level formula, and the Redis integration in one story.

4. **Be honest about scope.** "Backend is ~80% of Sprint 1 + Sprint 2 hardening:
   7 of 9 modules have real logic, the schema is one clean migration, and the
   realtime gateway is Redis-backed so it scales. **Remaining work** is the React +
   Phaser frontend, the background worker's scheduled jobs, the M6 war-room and M9
   admin modules, and test coverage for M2–M7 — all tracked in `plan.md`."

5. **Show the division of labour.** Use Section 4 above: four contributors, each
   owning a coherent slice (identity, gameplay loop, social systems, platform), so
   the work is traceable and PRs don't collide.

6. **Point to the design rationale.** `plan.md` records the decisions taken
   (Codeforces-only, schema realigned to the SADD ER diagram, full resilience
   fidelity: circuit breaker + dead-letter queue + Redlock-deduplicated sweeps),
   and `docs/` holds the per-feature API contracts. This shows the work is
   specified before it is coded, not improvised.

---

## 6. File index for the reviewer

| Path | What it shows |
|---|---|
| `README.md` | Module ↔ owner map, SADD coupling rules, quick start |
| `plan.md` | Sprint 2 implementation plan + decision record |
| `docs/auth-contract.md` | M1 API contract with JSON examples |
| `docs/village-data-contract.md` | M2 + M3 models and sync flow |
| `docs/attacks-league-contract.md` | M4 + M7 API contract |
| `docs/security-notes.md` | Security posture notes |
| `docs/IMPLEMENTATION_PROGRESS.md` | Sprint 1 completion log (predates the M5/M8 work) |
| `backend/app/main.py` | Every router that is mounted = every feature that exists |
| `backend/app/modules/*/` | One folder per module: `models`, `schemas`, `repository`, `service`, `router` |
| `backend/alembic/versions/` | `001_baseline` (schema) + `002_seed` (data) |
| `docker-compose.yml` | The full local stack |
