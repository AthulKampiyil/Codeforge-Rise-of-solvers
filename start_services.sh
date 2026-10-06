#!/bin/bash
set -e

echo "Starting persistent databases and backend services..."

# Create persistent data directories in the project root
mkdir -p .data/postgres
mkdir -p .data/redis
mkdir -p .logs

# 1. Setup Backend Environment
if [ ! -d "backend/venv312" ]; then
    echo "Creating Python virtual environment..."
    (cd backend && mise exec python@3.12 -- python -m venv venv312 && source venv312/bin/activate && pip install -r requirements.txt)
else
    # Always try to install missing requirements just in case
    (cd backend && source venv312/bin/activate && pip install -r requirements.txt > /dev/null 2>&1)
fi

# Create default .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating default backend/.env..."
    cat << 'ENVEOF' > backend/.env
POSTGRES_USER=codeforge
POSTGRES_PASSWORD=codeforge
POSTGRES_DB=codeforge
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REFRESH_TOKEN_EXPIRE_DAYS=30
FRONTEND_URL=http://localhost:5173
JUDGE_MODE=mock
CODEFORCES_API_BASE=https://codeforces.com/api
CODEFORCES_RATE_LIMIT_PER_SEC=0.5
SYNC_POLL_INTERVAL_MINUTES=360
ONDEMAND_SYNC_COOLDOWN_SECONDS=0
DLQ_SWEEP_MINUTES=15
WORKER_TICK_SECONDS=30
ENVEOF
fi

# 2. Setup Frontend Environment
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd frontend && mise exec node@26.10.0 -- npm install)
fi

# Create frontend .env if missing
if [ ! -f "frontend/.env" ]; then
    echo "VITE_API_BASE_URL=http://localhost:8000" > frontend/.env
fi

# 3. Start PostgreSQL and Redis via mise, using the persistent directories
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
if [ -f "fix_attacks.py" ]; then
    (cd backend && source venv312/bin/activate && PYTHONPATH=. python ../fix_attacks.py)
fi

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
