"""Business router."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.business import Business
from app.schemas.business import BusinessCreate, BusinessUpdate, BusinessResponse
from app.core.exceptions import DexterNotFoundError

router = APIRouter()

@router.post("/", response_model=BusinessResponse, status_code=201)
async def create_business(
    data: BusinessCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Business:
    """Create a business owned by the current user."""
    business = Business(
        user_id=current_user.id,
        name=data.name,
        industry=data.industry,
        description=data.description,
        website=data.website,
        is_active=True,
    )
    db.add(business)
    await db.commit()
    await db.refresh(business)
    return business

@router.get("/", response_model=list[BusinessResponse])
async def list_businesses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Business]:
    """List the current user's businesses (most recent first)."""
    result = await db.execute(
        select(Business)
        .where(Business.user_id == current_user.id)
        .order_by(Business.created_at.desc())
    )
    return list(result.scalars().all())

@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Business:
    """Get a single business owned by the current user."""
    result = await db.execute(
        select(Business).where(
            Business.id == business_id,
            Business.user_id == current_user.id,
        )
    )
    business = result.scalar_one_or_none()
    if not business:
        raise DexterNotFoundError(detail="Business not found")
    return business

@router.patch("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: uuid.UUID,
    data: BusinessUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Business:
    """Update a business owned by the current user."""
    result = await db.execute(
        select(Business).where(
            Business.id == business_id,
            Business.user_id == current_user.id,
        )
    )
    business = result.scalar_one_or_none()
    if not business:
        raise DexterNotFoundError(detail="Business not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(business, field, value)
    await db.commit()
    await db.refresh(business)
    return business