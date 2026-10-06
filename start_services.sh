#!/bin/bash
set -e

echo "Starting persistent databases and backend services..."

# Create persistent data directories in the project root
mkdir -p .data/postgres
mkdir -p .data/redis
mkdir -p .logs

# Start PostgreSQL and Redis via mise, using the persistent directories
mise exec postgres@18.6 redis@8.10.1 -- bash -c '
    # Initialize DB if it does not exist
    if [ ! -f .data/postgres/PG_VERSION ]; then
        initdb -D .data/postgres
        echo "Database initialized."
        
        # Start DB to create databases and users
        pg_ctl -D .data/postgres -l .logs/postgres.log start
        sleep 2
        
        createdb codeforge_test || true
        createdb codeforge || true
        psql -c "CREATE USER codeforge WITH PASSWORD '\''codeforge'\'' SUPERUSER;" postgres || true
        
        # Stop it so we can start it normally or just leave it running
    else
        # Just start if already initialized
        pg_ctl -D .data/postgres -l .logs/postgres.log start || true
    fi
    
    # Start Redis with a custom dir for persistence
    redis-server --daemonize yes --dir .data/redis --dbfilename dump.rdb
'

echo "Databases started."

# Ensure DB is migrated and seeded
(cd backend && source venv312/bin/activate && alembic upgrade head)

# Automatically apply the game balance hacks (disable cooldowns) for anyone running this script
echo "Applying game balance configurations (disabling cooldowns)..."
(cd backend && source venv312/bin/activate && PYTHONPATH=. python ../fix_attacks.py)

# Restart API, Worker, and Frontend if needed (or tell the user they are running)
echo "Starting backend API (port 8000)..."
(cd backend && source venv312/bin/activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload > ../.logs/api.log 2>&1 &)

echo "Starting backend Worker..."
(cd backend && source venv312/bin/activate && python -m worker.main > ../.logs/worker.log 2>&1 &)

echo "Starting frontend dev server (port 5173)..."
(cd frontend && mise exec node@26.10.0 -- npm run dev -- --port 5173 > ../.logs/frontend.log 2>&1 &)

echo "All services started!"
echo "- API: http://127.0.0.1:8000"
echo "- Frontend: http://localhost:5173"
echo "Logs are available in the .logs/ directory."
