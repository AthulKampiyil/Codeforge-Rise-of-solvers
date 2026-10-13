# CodeForge local development

This guide runs the CodeForge backend dependencies in Docker and the web-coc Vite frontend on the host. It does not replace or modify the existing web-coc scripts or assets. No environment file or secret needs to be copied into this checkout.

The CP-only Vite build serves and packages the curated `cp-public/` directory, not the full upstream `public/` asset collection. It includes the eight building sprites referenced by the CP village presentation and the favicon, manifest, and install icons used by `index.html`. Keep `public/` intact for existing tests and upstream assets; add any new CP static-file dependency explicitly to `cp-public/`.

## Requirements

- Docker with the Compose plugin
- Node.js version supported by this project (see `package.json`)
- npm

## Start the backend services

From the web-coc repository root:

```sh
docker compose -p webcoc-codeforge -f docker-compose.codeforge.yml up --build -d
```

This checkout uses distinct host ports so it can run alongside the existing CodeForge stack: PostgreSQL (`localhost:5433`), Redis (`localhost:6380`), and FastAPI (`localhost:8001`). Inside Compose, the API and worker still use `postgres:5432` and `redis:6379`. The Vite frontend uses port 5174 by default. The API waits for Postgres and Redis health, then runs `alembic upgrade head` from its container entrypoint before serving requests. The worker starts after the API is healthy. The development database uses disposable local defaults and a named volume (`codeforge-pgdata`); do not use these settings for a deployed environment.

The API readiness endpoint is <http://localhost:8001/ready>. To follow startup logs:

```sh
docker compose -p webcoc-codeforge -f docker-compose.codeforge.yml logs -f api worker
```

## Check migration 007–009 compatibility before upgrading

Migrations 007 and 008 create new economy tables. Migration 009 changes verified judge-account uniqueness; it deliberately aborts if verified accounts have case-insensitive collisions. Before upgrading an existing database, check for those rows first:

```sh
docker compose -p webcoc-codeforge -f docker-compose.codeforge.yml exec -T postgres \
  psql -U codeforge -d codeforge -c '
    SELECT judge_type, lower(handle) AS normalized_handle,
           array_agg(handle ORDER BY id) AS handles,
           array_agg(id ORDER BY id) AS account_ids
    FROM judge_accounts
    WHERE verified_flag IS TRUE
    GROUP BY judge_type, lower(handle)
    HAVING count(*) > 1
    ORDER BY judge_type, normalized_handle;
  '
```

An empty result means this collision check is clear. If collisions are returned, resolve them deliberately before migration; migration 009 also repeats this precheck transactionally and reports the collision details rather than selecting a row silently. The startup upgrade command applies all pending migrations, including 007, 008, and 009.

For an existing CodeForge database, do not use this standalone compose file's fresh PostgreSQL volume as a substitute. Point a locally run API at the intended database using environment variables, run the collision query against that database, then run `cd backend && alembic upgrade head`.

## Run the frontend

In a second terminal, from the web-coc repository root:

```sh
npm install
npm run dev
```

Open <http://localhost:5174>. Vite forwards `/api/...` to FastAPI at `localhost:8001` after removing the `/api` prefix, and proxies `/ws/events` as a WebSocket connection. For example, a frontend request to `/api/health` reaches FastAPI `/health`.

The compose host ports can be changed with `CODEFORGE_API_PORT`, `CODEFORGE_POSTGRES_PORT`, `CODEFORGE_REDIS_PORT`, and `CODEFORGE_FRONTEND_PORT` (defaults `8001`, `5433`, `6380`, and `5174`). Vite's port can be changed with `VITE_PORT`, and its proxy destination with `VITE_API_TARGET` (default `http://localhost:8001`); set these before `npm run dev`. The frontend port setting passed to Compose controls backend CORS, while `VITE_PORT` controls Vite itself, so keep them aligned if customizing.

## Stop services

```sh
docker compose -p webcoc-codeforge -f docker-compose.codeforge.yml down
```

This command targets only this checkout's compose project. Do not run `docker compose down` from the existing CodeForge repository or stop its services to start this stack.

To also remove the local database volume and its data, explicitly run:

```sh
docker compose -p webcoc-codeforge -f docker-compose.codeforge.yml down -v
```
