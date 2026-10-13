"""M7 League & Trophy module."""


def __getattr__(name: str):
    if name == "league_router":
        from app.modules.m7_league_trophy.router import router
        return router
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["league_router"]
