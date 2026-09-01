"""CSRF middleware stub (to be implemented in Sprint 2)."""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware.
    
    TODO (Sprint 2): Implement proper CSRF token validation.
    For Sprint 1, this is a pass-through stub.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        return response
