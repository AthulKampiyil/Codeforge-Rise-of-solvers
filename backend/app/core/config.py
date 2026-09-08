"""Environment-driven settings (Pydantic BaseSettings).

Per SADD 11.5: all environment-specific config (DB/Redis URLs, judge
API credentials, cooldown/league defaults) comes from env vars —
never hard-coded.

NOTE: game-balance values (attack cooldown, matchmaking tolerances,
trophy K-factors, league thresholds, territory hysteresis, circuit
breaker thresholds) are deliberately NOT here — they live in the
`game_balance_config` table (M9, UC-12) so an Admin can tune them at
runtime without a redeploy. This module holds only infrastructure
config: things that genuinely can't change without restarting the
process.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Project-wide environment configuration."""

    # Project
    PROJECT_NAME: str = "CodeForge: Rise of Solvers"
    DEBUG: bool = False

    # Database (PostgreSQL)
    POSTGRES_USER: str = "codeforge"
    POSTGRES_PASSWORD: str = "codeforge"
    POSTGRES_DB: str = "codeforge"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis (SADD 2.4 — matchmaking, cooldowns, caching, pub/sub, Redlock)
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Security & Tokens (NFR-3.2, REQ-1.6)
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 7 * 24 * 60  # 7 days idle (REQ-1.6)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Judge Adapters — Codeforces only (see plan.md decisions record)
    JUDGE_MODE: str = "mock"  # "mock" or "real" per SADD 11.1
    CODEFORCES_API_BASE: str = "https://codeforces.com/api"
    CODEFORCES_RATE_LIMIT_PER_SEC: float = 0.5  # CF allows ~1 request / 2s

    # Sync scheduling (resolves SRS Appendix C TBD-7)
    SYNC_POLL_INTERVAL_MINUTES: int = 360
    ONDEMAND_SYNC_COOLDOWN_SECONDS: int = 300  # REQ-2.2: once per 5 min
    DLQ_SWEEP_MINUTES: int = 15

    # Worker
    WORKER_TICK_SECONDS: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
