"""M3 Village module."""

__all__ = ["village_router"]


def __getattr__(name):
    if name == "village_router":
        from app.modules.m3_village.router import router
        return router
    raise AttributeError(name)
