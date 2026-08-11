"""Health check router."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.deps import get_db

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check() -> dict:
    return {"status": "healthy", "service": "dexter", "version": "0.1.0"}

@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        await db.execute(text("SELECT 1"))
        db_status = "up"
    except Exception:
        db_status = "down"
        
    return {
        "status": "ready" if db_status == "up" else "not_ready",
        "database": db_status
    }
