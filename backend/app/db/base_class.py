"""Declarative Base — deliberately imports no models.

Model modules import `Base` from here. The aggregator module
`app.db.base` imports this Base *and* every model (for Alembic
autogenerate / metadata), so models must never import `app.db.base`
directly or they create an import cycle.
"""
from sqlalchemy.orm import declarative_base

Base = declarative_base()
