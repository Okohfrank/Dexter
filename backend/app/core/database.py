"""Database configuration and session management."""

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import get_settings

settings = get_settings()

engine = None
session_factory = None

async def init_db() -> None:
    """Initialize the database engine and session factory."""
    global engine, session_factory
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        echo=settings.DEBUG,
    )
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

async def close_db() -> None:
    """Dispose of the database engine."""
    global engine
    if engine is not None:
        await engine.dispose()
        engine = None

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to provide a database session for a request."""
    if session_factory is None:
        raise RuntimeError("Database not initialized")
    
    async with session_factory() as session:
        yield session

__all__ = ["init_db", "close_db", "get_db"]
