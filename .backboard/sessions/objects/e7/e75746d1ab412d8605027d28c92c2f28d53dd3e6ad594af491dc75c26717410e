# CodeForge: Rise of Solvers

Monorepo for the CodeForge project (Group 7, IIIT Kottayam). This repo's
layout is derived directly from the approved **SRS v1.0** and **SADD v1.1** —
see `docs/`. If a change to this structure would contradict either
document, update the document first, then the repo.

## Layout

```
backend/
  app/
    modules/          # M1–M9, one folder per SADD module (see table below)
    core/              # config, security, shared dependencies
    db/                # SQLAlchemy base + session
    main.py            # FastAPI app — mounts each module's router
  worker/              # Background Worker process (SADD §11.2)
  alembic/             # DB migrations (single shared history)
  Dockerfile           # API image
  Dockerfile.worker     # Worker image

frontend/
  src/
    features/          # mirrors backend modules 1:1 (see table below)
    game/               # Phaser scenes — Village + War Map (shared across M3/M5)
    shared/             # api client, websocket client, shared UI

infra/                 # reverse proxy / deployment configs (staging, prod)
docs/                   # SRS.pdf, SADD.docx — source of truth
.github/workflows/      # CI: lint/test backend + build frontend on every PR
docker-compose.yml       # local dev stack (mirrors SADD §11.1)
```

## Module ↔ owner map

Assign one module per contributor (or pair) so backend/frontend work for
the same feature stays in one lane and PRs don't collide:

| ID | Module | Backend path | Frontend path |
|---|---|---|---|
| M1 | Authentication & Account Linking | `backend/app/modules/m1_auth` | `frontend/src/features/auth` |
| M2 | Coding Platform Sync | `backend/app/modules/m2_platform_sync` | `frontend/src/features/sync-status` |
| M3 | Personal Code Village | `backend/app/modules/m3_village` | `frontend/src/features/village` + `game/scenes/VillageScene.js` |
| M4 | Async Village Attacks | `backend/app/modules/m4_attacks` | `frontend/src/features/attacks` |
| M5 | Guild & Territory Control | `backend/app/modules/m5_guild_territory` | `frontend/src/features/guild-territory` + `game/scenes/WarMapScene.js` |
| M6 | Guild War Room | `backend/app/modules/m6_war_room` | `frontend/src/features/war-room` |
| M7 | League & Trophy Progression | `backend/app/modules/m7_league_trophy` | `frontend/src/features/league` |
| M8 | Notification & Realtime Gateway | `backend/app/modules/m8_notifications` | `frontend/src/shared/websocket` |
| M9 | Admin & Game-Balance Config | `backend/app/modules/m9_admin_config` | `frontend/src/features/admin` |

## Rules (from SADD §4.1)

1. **A module only imports another module's `service.py`** — never another
   module's `repository.py` or `models.py` directly. This is what keeps
   modules loosely coupled inside the monolith.
2. Judge-specific logic stays inside `m2_platform_sync/judge_adapters/`.
   Nothing outside that folder should know whether a solve came from
   Codeforces, LeetCode, or CodeChef.
3. Any new DB table goes through `alembic revision --autogenerate` —
   one shared migration history, not per-module.
4. Config comes from `.env` (see `.env.example`), never hard-coded.

## Getting started

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:8000
- Frontend: http://localhost:5173
- Postgres: localhost:5432 / Redis: localhost:6379

**`docker compose up` fails with "permission denied while trying to connect to
the Docker daemon socket"?** Your user isn't in the `docker` group yet:

```bash
sudo usermod -aG docker $USER
```

Then fully log out and back in (a new terminal isn't enough — group
membership is read at login) before retrying.

## Why this structure (validate against the docs)

See the design-rationale table in the project chat / PR description that
introduced this scaffold — every folder choice cites a specific SRS
requirement ID or SADD section so the team can check it against the
approved documents rather than take it on faith.
