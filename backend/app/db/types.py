"""Portable GUID column type (SADD 5.4 Maintainability).

Sprint 1 models imported sqlalchemy.dialects.postgresql.UUID directly,
which welds every model to PostgreSQL and cannot even be constructed
against SQLite. This TypeDecorator uses the native UUID type on
PostgreSQL and falls back to a CHAR(32) hex string elsewhere, so the
same model classes are portable without changing a single column
definition.
"""
import uuid

from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.types import CHAR, TypeDecorator


class GUID(TypeDecorator):
    """Platform-independent GUID type."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PGUUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value).hex
        return value.hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)
