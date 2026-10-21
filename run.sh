#!/bin/bash
set -e

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "${CYAN}========================================================${NC}"
echo -e "${CYAN}         CodeForge: Rise of Solvers - Runner            ${NC}"
echo -e "${CYAN}========================================================${NC}"

# Stop any dangling previous dev server processes to prevent port conflicts
echo -e "${BLUE}▶ Checking existing processes...${NC}"
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "python -m worker.main" 2>/dev/null || true
pkill -f "vite --port 5173" 2>/dev/null || true

# Create persistent data & log directories
mkdir -p .data/postgres
mkdir -p .data/redis
mkdir -p .logs

# 1. Environment & Config setup
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating default backend/.env...${NC}"
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

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}Creating default frontend/.env...${NC}"
    echo "VITE_API_BASE_URL=http://localhost:8000" > frontend/.env
fi

# 2. Setup Backend Python Virtual Environment
if [ ! -d "backend/venv312" ]; then
    echo -e "${YELLOW}Creating Python virtual environment (backend/venv312)...${NC}"
    (cd backend && mise exec python@3.12 -- python -m venv venv312 && source venv312/bin/activate && pip install -r requirements.txt)
else
    # Install any missing requirements quietly
    (cd backend && source venv312/bin/activate && pip install -r requirements.txt > /dev/null 2>&1 || true)
fi

# 3. Setup Frontend Node Dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend node_modules...${NC}"
    (cd frontend && mise exec node@26.10.0 -- npm install)
fi

# 4. Start Persistent PostgreSQL and Redis Databases
echo -e "${BLUE}▶ Starting persistent databases (PostgreSQL & Redis)...${NC}"
mise exec postgres@18.6 redis@8.10.1 -- bash -c '
    # Initialize DB if not present
    if [ ! -f .data/postgres/PG_VERSION ]; then
        initdb -D .data/postgres
        pg_ctl -D .data/postgres -l .logs/postgres.log start
        sleep 2
        createdb codeforge_test 2>/dev/null || true
        createdb codeforge 2>/dev/null || true
        psql -c "CREATE USER codeforge WITH PASSWORD '\''codeforge'\'' SUPERUSER;" postgres 2>/dev/null || true
    else
        pg_ctl -D .data/postgres -l .logs/postgres.log start 2>/dev/null || true
    fi

    # Start Redis with local persistence
    redis-server --daemonize yes --dir .data/redis --dbfilename dump.rdb 2>/dev/null || true
'

# 5. Database Migrations
echo -e "${BLUE}▶ Running database migrations...${NC}"
(cd backend && source venv312/bin/activate && alembic upgrade head > /dev/null 2>&1 || alembic upgrade head)

# 6. Apply game balance configurations (disable cooldowns for demo)
if [ -f "fix_attacks.py" ]; then
    (cd backend && source venv312/bin/activate && PYTHONPATH=. python ../fix_attacks.py > /dev/null 2>&1 || true)
fi

# 7. Start Services (Backend API, Worker, Frontend)
echo -e "${BLUE}▶ Starting Backend API server (port 8000)...${NC}"
(cd backend && source venv312/bin/activate && nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload > ../.logs/api.log 2>&1 & disown)

echo -e "${BLUE}▶ Starting Background Worker...${NC}"
(cd backend && source venv312/bin/activate && nohup python -m worker.main > ../.logs/worker.log 2>&1 & disown)

echo -e "${BLUE}▶ Starting Frontend Vite Server (port 5173)...${NC}"
(cd frontend && nohup mise exec node@26.10.0 -- npm run dev -- --port 5173 > ../.logs/frontend.log 2>&1 & disown)

# Wait a moment for startup
sleep 2

# Verify health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/docs || echo "down")
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 || echo "down")

echo ""
echo -e "${GREEN}✔ All CodeForge services are running!${NC}"
echo -e "${CYAN}--------------------------------------------------------${NC}"
echo -e "  🌐 Frontend App:    ${GREEN}http://localhost:5173${NC} (Status: $FE_STATUS)"
echo -e "  ⚙️ Backend API:     ${GREEN}http://127.0.0.1:8000${NC} (Status: $API_STATUS)"
echo -e "  📚 API Docs:        ${GREEN}http://127.0.0.1:8000/docs${NC}"
echo -e "  📁 Service Logs:    ${YELLOW}.logs/api.log, .logs/worker.log, .logs/frontend.log${NC}"
echo -e "${CYAN}--------------------------------------------------------${NC}"
echo -e "To stop all services anytime, run: ${YELLOW}./stop.sh${NC}"
echo ""
