__all__ = ["auth_router"]


def __getattr__(name):
    if name == "auth_router":
        from app.modules.m1_auth.router import router
        return router
    raise AttributeError(name)
