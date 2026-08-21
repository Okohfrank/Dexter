"""
Media Assets & Visual Generation API Router.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.media_asset import MediaAsset
from app.core.enums import MediaType
from app.services.image_generation_service import ImageGenerationService

router = APIRouter()


class GenerateVisualRequest(BaseModel):
    business_id: uuid.UUID
    quote_text: str
    topic: Optional[str] = "THOUGHT LEADERSHIP"
    author_name: Optional[str] = "Alex Mercer"
    author_headline: Optional[str] = "Founder & CEO"
    brand_name: Optional[str] = "Dexter AI"


class UploadMediaRequest(BaseModel):
    business_id: Optional[uuid.UUID] = None
    file_name: str
    media_type: str = "image"
    url: str
    tags: List[str] = []


@router.get("/")
async def list_media_assets(
    business_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List media assets for a business."""
    stmt = select(MediaAsset).order_by(MediaAsset.created_at.desc())
    if business_id:
        stmt = stmt.where(MediaAsset.business_id == business_id)

    result = await db.execute(stmt)
    assets = result.scalars().all()

    return [
        {
            "id": str(a.id),
            "business_id": str(a.business_id),
            "file_name": a.original_filename or "media.jpg",
            "media_type": a.file_type.value if hasattr(a.file_type, "value") else str(a.file_type),
            "url": a.file_url,
            "tags": (a.metadata_json or {}).get("tags", ["Brand"]),
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in assets
    ]


@router.post("/")
async def create_media_asset(
    payload: UploadMediaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register an uploaded media asset."""
    biz_id = payload.business_id or uuid.uuid4()
    asset = MediaAsset(
        business_id=biz_id,
        file_url=payload.url,
        file_type=MediaType.VIDEO if payload.media_type == "video" else MediaType.IMAGE,
        mime_type="video/mp4" if payload.media_type == "video" else "image/jpeg",
        original_filename=payload.file_name,
        metadata_json={"tags": payload.tags},
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return {
        "id": str(asset.id),
        "business_id": str(asset.business_id),
        "file_name": asset.original_filename,
        "media_type": payload.media_type,
        "url": asset.file_url,
        "tags": payload.tags,
    }


@router.post("/generate-visual")
async def generate_visual_card(
    payload: GenerateVisualRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Autonomously generate a branded graphic card for social posts.
    """
    service = ImageGenerationService(db)
    asset = await service.generate_thought_leadership_card(
        business_id=payload.business_id,
        quote_text=payload.quote_text,
        topic=payload.topic or "THOUGHT LEADERSHIP",
        author_name=payload.author_name or current_user.full_name or "Founder",
        author_headline=payload.author_headline or "Founder & CEO",
        brand_name=payload.brand_name or "Dexter AI",
    )

    return {
        "id": str(asset.id),
        "business_id": str(asset.business_id),
        "file_name": asset.original_filename,
        "media_type": "image",
        "url": asset.file_url,
        "tags": ["AI-Generated", payload.topic or "Thought Leadership"],
    }
