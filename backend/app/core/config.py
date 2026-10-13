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
from pydantic import model_validator
from pydantic_settings import BaseSettings
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    """Project-wide environment configuration."""

    # Project
    PROJECT_NAME: str = "CodeForge: Rise of Solvers"
    DEBUG: bool = False
    APP_ENV: str = "development"

    # Database (PostgreSQL)
    POSTGRES_USER: str = "codeforge"
    POSTGRES_PASSWORD: str = "codeforge"
    POSTGRES_DB: str = "codeforge"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return URL.create(
            "postgresql",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB,
        ).render_as_string(hide_password=False)

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
    ONDEMAND_SYNC_COOLDOWN_SECONDS: int = 300  # REQ-2.2: minimum manual-sync interval
    CODEFORCES_IMPORT_PAGE_SIZE: int = 100
    CODEFORCES_IMPORT_ACCOUNTS_PER_TICK: int = 10
    DLQ_SWEEP_MINUTES: int = 15

    # Worker
    WORKER_TICK_SECONDS: int = 30
    TERRITORY_RECALC_INTERVAL_MINUTES: int = 60
    TERRITORY_RECALC_BATCH_SIZE: int = 25
    LEAGUE_RECONCILE_BATCH_SIZE: int = 200

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    @model_validator(mode="after")
    def validate_production_settings(self):
        """Reject demo credentials and incomplete public config in production."""
        if self.APP_ENV.strip().lower() != "production":
            return self

        problems = []
        if self.ALGORITHM != "HS256":
            problems.append("ALGORITHM must be HS256 in production")
        if (
            len(self.SECRET_KEY.strip()) < 32
            or self.SECRET_KEY == "dev-secret-key-change-in-production"
            or "generate_a_secure" in self.SECRET_KEY.lower()
        ):
            problems.append("SECRET_KEY must be a non-default value of at least 32 characters")
        if (
            len(self.POSTGRES_PASSWORD.strip()) < 16
            or self.POSTGRES_PASSWORD == "codeforge"
            or "generate_a_secure" in self.POSTGRES_PASSWORD.lower()
        ):
            problems.append("POSTGRES_PASSWORD must be a non-default value of at least 16 characters")
        if self.JUDGE_MODE.strip().lower() != "real":
            problems.append("JUDGE_MODE must be real")
        if self.ONDEMAND_SYNC_COOLDOWN_SECONDS < 300:
            problems.append("ONDEMAND_SYNC_COOLDOWN_SECONDS must be at least 300 seconds")
        public_host = self.PUBLIC_HOST.strip().lower().rstrip(".").split(":", 1)[0]
        reserved_domain_suffixes = (".example.com", ".example", ".invalid", ".test")
        if (
            not public_host
            or public_host in {"localhost", "127.0.0.1", "example.com", "example", "invalid", "test"}
            or any(public_host.endswith(suffix) for suffix in reserved_domain_suffixes)
        ):
            problems.append("PUBLIC_HOST must be configured with the public hostname")
        origin = self.FRONTEND_URL.strip()
        if not origin.startswith("https://") or origin.removeprefix("https://").strip("/") in {"", "localhost", "127.0.0.1"}:
            problems.append("FRONTEND_URL must be a configured HTTPS origin")
        if problems:
            raise ValueError("Invalid production settings: " + "; ".join(problems))
        return self

    PUBLIC_HOST: str = ""


settings = Settings()
