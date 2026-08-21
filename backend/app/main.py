"""Dexter — FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.exceptions import DexterError


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle manager."""
    # ── Startup ──
    await init_db()
    yield
    # ── Shutdown ──
    await close_db()


app = FastAPI(
    title="Dexter — Autonomous AI Social Media Manager",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — allow the Expo app (any origin during dev) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # TODO: lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include ALL API routes ──
app.include_router(api_router)


# ── Global exception handlers ──
@app.exception_handler(DexterError)
async def dexter_error_handler(request: Request, exc: DexterError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# ── Health check ──
@app.get("/")
def root():
    return {"status": "running", "app": "Dexter", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "database": "connected"}