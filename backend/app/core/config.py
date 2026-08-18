"""Environment-driven settings (Pydantic BaseSettings).

Per SADD 11.5: all environment-specific config (DB/Redis URLs, judge
API credentials, cooldown/league defaults) comes from env vars —
never hard-coded.
"""
