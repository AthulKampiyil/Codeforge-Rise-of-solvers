"""FastAPI app entrypoint — mounts each module's router.

Run: uvicorn app.main:app --reload
"""
from fastapi import FastAPI

app = FastAPI(title="CodeForge: Rise of Solvers API")

# TODO: from app.modules.m1_auth.router import router as auth_router
# app.include_router(auth_router)
# ... repeat for m2 through m9
