#!/bin/bash

# ANSI Color Codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "${YELLOW}Stopping all CodeForge services...${NC}"

# Kill web servers and workers
pkill -f "uvicorn app.main:app" 2>/dev/null && echo -e "  Stopped Backend API" || true
pkill -f "python -m worker.main" 2>/dev/null && echo -e "  Stopped Background Worker" || true
pkill -f "vite --port 5173" 2>/dev/null && echo -e "  Stopped Frontend Vite Server" || true

# Stop databases
if [ -d ".data/postgres" ]; then
    pg_ctl -D .data/postgres stop 2>/dev/null && echo -e "  Stopped PostgreSQL" || true
fi
pkill -f "redis-server" 2>/dev/null && echo -e "  Stopped Redis" || true

echo -e "${GREEN}✔ All CodeForge services have been stopped.${NC}"
