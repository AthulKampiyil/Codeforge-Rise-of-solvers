"""Correlation-id middleware (SADD 10.1).

Binds a per-request correlation id into structlog's contextvars so
every log line emitted while handling this request — across service
calls, repository calls, exception handlers — carries the same id.
Also echoes it back as a response header for client-side correlation.
"""
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

CORRELATION_ID_HEADER = "X-Correlation-ID"


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        correlation_id = request.headers.get(CORRELATION_ID_HEADER, str(uuid.uuid4()))

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            method=request.method,
            path=request.url.path,
        )

        response = await call_next(request)
        response.headers[CORRELATION_ID_HEADER] = correlation_id
        return response
