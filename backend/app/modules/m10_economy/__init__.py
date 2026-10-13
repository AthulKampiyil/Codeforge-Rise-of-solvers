"""Server-authoritative wallet and solve-reward economy."""


def __getattr__(name: str):
    if name == "economy_router":
        from app.modules.m10_economy.router import router

        return router
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["economy_router"]
