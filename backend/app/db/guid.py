import uuid
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Uses PostgreSQL's native UUID type, otherwise uses CHAR(36).
    Handles both string UUIDs and uuid.UUID objects seamlessly across DB dialects.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            val_uuid = value
        else:
            try:
                val_uuid = uuid.UUID(str(value))
            except (ValueError, TypeError):
                return str(value)

        if dialect.name == 'postgresql':
            return val_uuid
        else:
            return str(val_uuid)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            try:
                return uuid.UUID(str(value))
            except (ValueError, TypeError):
                return value
        return value
