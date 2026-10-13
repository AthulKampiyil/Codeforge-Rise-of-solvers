"""M2 Platform Sync module."""
__all__ = ["sync_router"]


def __getattr__(name):
    if name == "sync_router":
        from app.modules.m2_platform_sync.router import router
        return router
    raise AttributeError(name)
