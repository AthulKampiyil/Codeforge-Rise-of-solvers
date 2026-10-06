# CodeForge: Rise of Solvers - Running Locally

This guide explains how to properly run the CodeForge platform locally. We have stabilized the environment to be **persistent** (your accounts, guilds, and attack data won't be deleted when you restart) and **consistent** (everyone running this will have the exact same environment).

## Prerequisites
Ensure you have pulled the latest changes from the `athul_integration` branch, which includes all the critical bug fixes for Codeforces syncing, Guild joining, and Database persistence.

```bash
git fetch origin
git checkout athul_integration
git pull origin athul_integration
```

## How to Run the Platform

We have created a unified, robust startup script that handles literally everything. If you are cloning this repository for the very first time on a new machine, this script will automatically create the python virtual environment, install the backend python dependencies, install the frontend node modules, auto-generate `.env` files with working local defaults, and start the databases!

1. Open your terminal in the root of the project (the `Codeforge-Rise-of-solvers` folder).
2. Run the startup script:

```bash
./start_services.sh
```

### What this script does automatically:
1. **Dependencies:** Auto-creates `venv312`, runs `pip install -r requirements.txt`, and runs `npm install`.
2. **Environment config:** Auto-generates `backend/.env` and `frontend/.env` with local defaults.
3. **Persistent Databases:** Starts PostgreSQL and Redis. The data is saved safely in a hidden `.data/` folder inside the project. It will *not* wipe your database between restarts!
4. **Migrations & Config:** Automatically updates the database schema and injects the configurations that disable attack cooldowns for testing.
5. **API Backend:** Starts the FastAPI server on `http://127.0.0.1:8000`.
6. **Worker:** Starts the background worker (which processes Codeforces syncs and attacks).
7. **Frontend:** Starts the React application on `http://localhost:5173`.

## Viewing Logs
Because the services run in the background, their output is saved to log files so it doesn't clutter your terminal. If you need to debug or see what's happening, check the `.logs/` folder:

- API logs: `cat .logs/api.log` (or `tail -f .logs/api.log` to watch live)
- Worker logs: `cat .logs/worker.log`
- Frontend logs: `cat .logs/frontend.log`

## How to Stop the Services
To stop the services, you can find the running processes and kill them.

To stop the API, Worker, and Frontend:
```bash
pkill -f uvicorn
pkill -f worker.main
pkill -f vite
```

To stop the Databases:
```bash
pg_ctl -D .data/postgres stop
pkill -f redis-server
```

## Summary of Applied Fixes in this Branch
If anyone asks why this branch is necessary, it includes the following critical fixes:
1. **Persistent Data:** Moved database storage out of `/tmp` to prevent random data wiping.
2. **Codeforces Sync Patch:** Fixed the CF API adapter so it no longer ignores previously solved problems during attacks.
3. **Guild Invitation Fix:** Fixed a silent backend crash (UUID vs text comparison) that prevented Leaders from approving join requests.
4. **Guild Dashboard Crash:** Fixed a Pydantic schema validation error where members with decimal "average levels" crashed the guild UI.
