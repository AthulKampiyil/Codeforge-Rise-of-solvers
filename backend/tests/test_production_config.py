import pytest
from pydantic import ValidationError
from alembic.config import Config
from sqlalchemy.engine import make_url

from app.core.config import Settings


def _production_settings(**overrides):
    values = {
        "APP_ENV": "production",
        "SECRET_KEY": "s" * 48,
        "POSTGRES_PASSWORD": "p" * 24,
        "JUDGE_MODE": "real",
        "ONDEMAND_SYNC_COOLDOWN_SECONDS": 300,
        "PUBLIC_HOST": "codeforge.example.net",
        "FRONTEND_URL": "https://codeforge.example.net",
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_development_defaults_preserve_demo_configuration():
    settings = Settings(_env_file=None)
    assert settings.APP_ENV == "development"
    assert settings.JUDGE_MODE == "mock"
    assert settings.ONDEMAND_SYNC_COOLDOWN_SECONDS == 300


def test_valid_production_settings_are_accepted():
    assert _production_settings().APP_ENV == "production"


def test_database_url_preserves_special_characters_in_password():
    password = "special@:/%characters"
    settings = Settings(_env_file=None, POSTGRES_PASSWORD=password)

    assert make_url(settings.DATABASE_URL).password == password


def test_alembic_config_round_trips_encoded_special_character_password():
    password = "special@:/%characters"
    database_url = Settings(_env_file=None, POSTGRES_PASSWORD=password).DATABASE_URL
    alembic_config = Config()

    alembic_config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))

    stored_url = alembic_config.get_main_option("sqlalchemy.url")
    assert make_url(stored_url).password == password


@pytest.mark.parametrize(
    "override",
    [
        {"SECRET_KEY": "dev-secret-key-change-in-production"},
        {"SECRET_KEY": "too-short"},
        {"SECRET_KEY": "generate_a_secure_random_string_here"},
        {"POSTGRES_PASSWORD": "codeforge"},
        {"POSTGRES_PASSWORD": "short"},
        {"POSTGRES_PASSWORD": "generate_a_secure_password_here"},
        {"JUDGE_MODE": "mock"},
        {"ALGORITHM": "HS512"},
        {"PUBLIC_HOST": ""},
        {"PUBLIC_HOST": "codeforge.example.com"},
        {"PUBLIC_HOST": "codeforge.example.com:443"},
        {"PUBLIC_HOST": "service.example"},
        {"PUBLIC_HOST": "service.invalid"},
        {"PUBLIC_HOST": "service.test"},
        {"FRONTEND_URL": ""},
        {"FRONTEND_URL": "http://codeforge.example.com"},
        {"ONDEMAND_SYNC_COOLDOWN_SECONDS": 0},
        {"ONDEMAND_SYNC_COOLDOWN_SECONDS": 1},
        {"ONDEMAND_SYNC_COOLDOWN_SECONDS": 299},
    ],
)
def test_unsafe_production_settings_are_rejected(override):
    with pytest.raises(ValidationError):
        _production_settings(**override)
