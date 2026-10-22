"""Authentication & Account Linking module package.

`auth_router` is exposed lazily (PEP 562 module __getattr__) instead of
via an eager top-level import. Eagerly importing `router` here means
importing *any* submodule of this package (e.g. `app.core.dependencies`
importing `app.modules.m1_auth.models.User`) also runs `router.py`,
which itself imports `app.core.dependencies` — a circular import that
only trips depending on which module happens to get imported first
(e.g. pytest collecting a test file that reaches `core.dependencies`
via a different module before `app.main` establishes the safe order).
Deferring the router import until `auth_router` is actually accessed
(as `app.main` does) breaks that ordering dependency entirely.
"""


def __getattr__(name: str):
    if name == "auth_router":
        from app.modules.m1_auth.router import router

        return router
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["auth_router"]
