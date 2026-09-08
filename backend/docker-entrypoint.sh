#!/bin/sh
# Apply migrations before the application node is brought into service
# (SADD 11.5). Fails fast if the DB isn't reachable/migratable yet.
set -e
echo "Running alembic upgrade head..."
alembic upgrade head
echo "Migrations applied. Starting: $@"
exec "$@"
