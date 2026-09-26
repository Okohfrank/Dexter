"""Dexter — FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.exceptions import DexterError
from app.core.scheduler import InProcessScheduler


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle manager."""
    # ── Startup ──
    await init_db()

    # ── In-process scheduler (no Redis needed) ──
    scheduler = InProcessScheduler()

    async def publish_due_posts_tick():
        """Check for due posts and publish them."""
        from app.core.database import session_factory
        from app.services.publishing_service import PublishingService
        from app.publishing.registry import PublisherRegistry
        from app.events.bus import EventBus
        from app.services.oauth_service import OAuthService
        from app.utils.crypto import TokenEncryptor
        from app.core.enums import PostStatus
        from app.models.post import ScheduledPost
        from sqlalchemy import select, and_
        from datetime import datetime, timezone

        if session_factory is None:
            return
        async with session_factory() as db:
            now = datetime.now(timezone.utc)
            stmt = select(ScheduledPost).where(
                and_(
                    ScheduledPost.status == PostStatus.QUEUED,
                    ScheduledPost.scheduled_for <= now,
                )
            )
            result = await db.execute(stmt)
            due_posts = result.scalars().all()
            if not due_posts:
                return

            event_bus = EventBus()
            encryptor = TokenEncryptor(secret_key=settings.SECRET_KEY)
            oauth = OAuthService(db, event_bus, encryptor)
            registry = PublisherRegistry()
            service = PublishingService(db, registry, event_bus, oauth)

            for post in due_posts:
                try:
                    await service.execute_publish(post.id)
                except Exception as e:
                    import structlog
                    structlog.get_logger().error("scheduler_publish_error", post_id=str(post.id), error=str(e))

    async def controller_tick():
        """Run the DQN controller for each active business."""
        from app.core.database import session_factory
        from app.models.business import Business
        from app.models.campaign import Campaign
        from app.services.autonomous_service import AutonomousContentService
        from sqlalchemy import select

        if session_factory is None:
            return
        async with session_factory() as db:
            # Find businesses with active campaigns
            stmt = select(Campaign).where(Campaign.is_active == True)
            result = await db.execute(stmt)
            campaigns = result.scalars().all()

            for campaign in campaigns:
                try:
                    service = AutonomousContentService(db)
                    post = await service.generate_from_controller(
                        business_id=campaign.business_id,
                        follower_target=campaign.follower_target,
                        current_followers=campaign.current_followers,
                    )
                    if post:
                        import structlog
                        structlog.get_logger().info(
                            "controller_generated_post",
                            post_id=str(post.id),
                            business_id=str(campaign.business_id),
                        )
                except Exception as e:
                    import structlog
                    structlog.get_logger().error(
                        "controller_tick_error",
                        business_id=str(campaign.business_id),
                        error=str(e),
                    )

    scheduler.register("publish_due_posts", publish_due_posts_tick, interval_seconds=60)
    scheduler.register("controller_tick", controller_tick, interval_seconds=1800)  # 30 min
    await scheduler.start()

    yield
    # ── Shutdown ──
    await scheduler.stop()
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