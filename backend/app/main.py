"""Main application entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.logging import configure_logging, get_logger
from app.core.exceptions import register_exception_handlers
from app.api.health import router as health_router
from app.api.router import api_router

logger = get_logger(__name__)
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    configure_logging(settings.ENVIRONMENT)
    await init_db()
    # Initialize global event bus, registry, etc.
    logger.info("dexter_started", environment=settings.ENVIRONMENT)
    yield
    # Shutdown
    await close_db()
    logger.info("dexter_stopped")

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="Autonomous AI Social Media Employee",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    register_exception_handlers(app)
    
    app.include_router(health_router)
    app.include_router(api_router)
    
    return app

app = create_app()
