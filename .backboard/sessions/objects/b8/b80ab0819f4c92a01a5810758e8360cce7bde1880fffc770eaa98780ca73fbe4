"""Domain-level exception hierarchy (SADD 10.1).

Services raise these instead of fastapi.HTTPException directly, so the
domain layer stays free of HTTP concerns (SADD 4.1 separation of
concerns) and every error is translated to a specific, user-facing
message at one place: the exception handler registered in main.py.
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """Base class for all domain-level errors."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "domain_error"

    def __init__(self, message: str, **extra):
        self.message = message
        self.extra = extra
        super().__init__(message)


class NotFoundError(DomainError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class ConflictError(DomainError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


class ForbiddenError(DomainError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"


class UnauthorizedError(DomainError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"


class ValidationDomainError(DomainError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "validation_error"


# --- M1 Auth ---------------------------------------------------------------
class EmailAlreadyRegistered(ConflictError):
    code = "email_already_registered"


class UsernameAlreadyTaken(ConflictError):
    code = "username_already_taken"


class InvalidCredentials(UnauthorizedError):
    code = "invalid_credentials"


class AccountSuspended(ForbiddenError):
    code = "account_suspended"


class AlreadyLinked(ConflictError):
    code = "already_linked"


class VerificationTokenNotFound(NotFoundError):
    code = "verification_token_not_found"


class VerificationFailed(ValidationDomainError):
    code = "verification_failed"


class UserNotFound(NotFoundError):
    code = "user_not_found"


# --- M2 Sync -----------------------------------------------------------
class JudgeUnavailable(DomainError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    code = "judge_unavailable"


class CircuitOpenError(JudgeUnavailable):
    code = "circuit_open"


# --- M4 Attacks --------------------------------------------------------
class CooldownActive(DomainError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "cooldown_active"


class InvalidAttackTarget(ValidationDomainError):
    code = "invalid_attack_target"


class AttackNotFound(NotFoundError):
    code = "attack_not_found"


# --- M5 Guild ------------------------------------------------------------
class GuildNameTaken(ConflictError):
    code = "guild_name_taken"


class AlreadyInGuild(ConflictError):
    code = "already_in_guild"


class NotGuildLeader(ForbiddenError):
    code = "not_guild_leader"


class NotGuildMember(ForbiddenError):
    code = "not_guild_member"


# --- M9 Admin & Config ---------------------------------------------------
class ConfigKeyNotFound(NotFoundError):
    code = "config_key_not_found"


class ConfigTypeMismatch(ValidationDomainError):
    code = "config_type_mismatch"


def register_exception_handlers(app: FastAPI) -> None:
    """Register the single translation point from DomainError -> HTTP response."""

    @app.exception_handler(DomainError)
    async def _handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code, **exc.extra},
        )
