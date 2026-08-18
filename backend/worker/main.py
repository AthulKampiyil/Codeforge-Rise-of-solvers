"""Background Worker entrypoint (SADD 11.2).

Runs judge polling (M2), matchmaking recalculation (M4), territory
recalculation (M5), and trophy/league recalculation (M7) OFF the
request-serving path, so a slow judge call never blocks a FastAPI
worker thread (NFR-1.1, NFR-1.3).

Imports service-layer functions from app.modules.* — never duplicates
their logic.
"""
