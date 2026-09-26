"""Dexter RL Controller — wraps the trained DQN policy with safety interceptor."""

import math
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import numpy as np
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import PostStatus
from app.core.logging import get_logger
from app.models.post import ScheduledPost


STRATEGY_MAP = {
    0: "wait",
    1: "thought_leadership",
    2: "case_study",
    3: "contrarian_take",
}

PEAK_HOURS = [8, 9, 10, 14, 15, 17]  # Hours with highest LinkedIn engagement


class ControllerDecision:
    """Result of a controller inference tick."""

    def __init__(self, action: int, strategy: str, reason: str,
                 recommended_hour: Optional[int] = None):
        self.action = action
        self.strategy = strategy
        self.reason = reason
        self.recommended_hour = recommended_hour
        self.should_post = action > 0

    def __repr__(self):
        return f"ControllerDecision(action={self.action}, strategy={self.strategy}, reason={self.reason})"


class DexterController:
    """Loads the trained DQN policy and runs inference with safety checks."""

    MAX_POSTS_24H = 2
    MIN_COOLDOWN_HOURS = 4

    def __init__(self):
        self._logger = get_logger(__name__)
        self._model = None
        self._is_ready = False
        self._load_policy()

    @property
    def is_ready(self) -> bool:
        return self._is_ready

    def _load_policy(self):
        """Load the SB3 DQN model from disk. Falls back to heuristic if unavailable."""
        try:
            from stable_baselines3 import DQN
            # Register the custom env so SB3 can reconstruct it
            import gymnasium as gym
            from app.services.dexter_env import DexterLinkedInEnv
            if "DexterLinkedIn-v0" not in gym.envs.registry:
                gym.register(id="DexterLinkedIn-v0", entry_point="app.services.dexter_env:DexterLinkedInEnv")

            policy_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "dexter_dqn_policy",
            )
            if not os.path.isdir(policy_path):
                self._logger.warning("dqn_policy_dir_not_found", path=policy_path)
                return

            self._model = DQN.load(policy_path, env=None)
            self._is_ready = True
            self._logger.info("dqn_policy_loaded", path=policy_path)
        except Exception as e:
            self._logger.warning("dqn_policy_load_failed", error=str(e))

    async def decide(
        self, db: AsyncSession, business_id,
        follower_target: int = 1000, current_followers: int = 0,
    ) -> ControllerDecision:
        """Run one inference tick: build state → predict → intercept → return decision."""
        now = datetime.now(timezone.utc)

        # --- Build state vector from DB ---
        posts_24h = await self._count_recent_posts(db, business_id, hours=24)
        last_post_time = await self._last_post_time(db, business_id)
        hours_since_last = min(
            (now - last_post_time).total_seconds() / 3600 if last_post_time else 48.0,
            48.0,
        )
        deficit_ratio = max(min(
            (follower_target - current_followers) / max(follower_target, 1), 1.0
        ), -1.0)
        fatigue = self._compute_fatigue(posts_24h, hours_since_last)

        hour = now.hour + now.minute / 60.0
        day = now.weekday()
        state = np.array([
            math.sin(hour / 24 * 2 * math.pi),
            math.cos(hour / 24 * 2 * math.pi),
            math.sin(day / 7 * 2 * math.pi),
            math.cos(day / 7 * 2 * math.pi),
            float(posts_24h),
            float(hours_since_last),
            float(deficit_ratio),
            float(fatigue),
        ], dtype=np.float32)

        # --- Run Q-policy inference ---
        if self._is_ready and self._model is not None:
            try:
                action, _ = self._model.predict(state, deterministic=True)
                action = int(action)
            except Exception as e:
                self._logger.warning("dqn_inference_failed", error=str(e))
                action = self._heuristic_action(hour, day, posts_24h, hours_since_last, deficit_ratio)
        else:
            action = self._heuristic_action(hour, day, posts_24h, hours_since_last, deficit_ratio)

        # --- Deterministic Safety Interceptor (NEVER bypassed) ---
        decision = self._safety_intercept(action, posts_24h, hours_since_last, now)

        self._logger.info(
            "controller_decision",
            action=decision.action,
            strategy=decision.strategy,
            reason=decision.reason,
            state=state.tolist(),
        )
        return decision

    def _safety_intercept(
        self, raw_action: int, posts_24h: int,
        hours_since_last: float, now: datetime,
    ) -> ControllerDecision:
        """Hard rules that override the neural network. Never bypassed."""
        # Rule 1: Max 2 posts per 24h
        if posts_24h >= self.MAX_POSTS_24H and raw_action > 0:
            return ControllerDecision(
                action=0, strategy="wait",
                reason=f"BLOCKED: {posts_24h} posts in last 24h (max {self.MAX_POSTS_24H})",
            )
        # Rule 2: Min 4h cooldown
        if hours_since_last < self.MIN_COOLDOWN_HOURS and raw_action > 0:
            return ControllerDecision(
                action=0, strategy="wait",
                reason=f"BLOCKED: only {hours_since_last:.1f}h since last post (min {self.MIN_COOLDOWN_HOURS}h)",
            )
        # Rule 3: Avoid off-peak hours (midnight to 7 AM)
        if now.hour < 7 and raw_action > 0:
            next_peak = 8
            return ControllerDecision(
                action=0, strategy="wait",
                reason=f"BLOCKED: off-peak hour {now.hour}:00, next slot at {next_peak}:00",
                recommended_hour=next_peak,
            )

        strategy = STRATEGY_MAP.get(raw_action, "wait")
        if raw_action > 0:
            rec_hour = self._find_next_peak_hour(now)
            return ControllerDecision(
                action=raw_action, strategy=strategy,
                reason=f"POST approved: strategy={strategy}",
                recommended_hour=rec_hour,
            )
        return ControllerDecision(action=0, strategy="wait", reason="Agent chose WAIT")

    def _heuristic_action(self, hour: float, day: int, posts_24h: int,
                          hours_since_last: float, deficit_ratio: float) -> int:
        """Deterministic fallback when the neural network is unavailable."""
        if posts_24h >= self.MAX_POSTS_24H:
            return 0
        if hours_since_last < self.MIN_COOLDOWN_HOURS:
            return 0
        if deficit_ratio > 0.3 and int(hour) in PEAK_HOURS and day < 5:
            return 1  # thought_leadership during weekday peak
        if deficit_ratio > 0.1 and int(hour) in [9, 14] and day < 6:
            return 2  # case_study
        return 0

    def _compute_fatigue(self, posts_24h: int, hours_since_last: float) -> float:
        """Audience fatigue score in [0, 1]. Higher = more fatigued."""
        freq_factor = min(posts_24h / max(self.MAX_POSTS_24H, 1), 1.0)
        spacing_factor = max(1.0 - hours_since_last / 12.0, 0.0)
        return min((freq_factor + spacing_factor) / 2.0, 1.0)

    def _find_next_peak_hour(self, now: datetime) -> int:
        """Find the next peak engagement hour from now."""
        current_hour = now.hour
        for h in PEAK_HOURS:
            if h > current_hour:
                return h
        return PEAK_HOURS[0]  # wrap to next day

    async def _count_recent_posts(self, db: AsyncSession, business_id, hours: int = 24) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        result = await db.execute(
            select(func.count(ScheduledPost.id)).where(
                and_(
                    ScheduledPost.business_id == business_id,
                    ScheduledPost.status.in_([PostStatus.QUEUED, PostStatus.PUBLISHED, PostStatus.PUBLISHING]),
                    ScheduledPost.created_at >= cutoff,
                )
            )
        )
        return result.scalar() or 0

    async def _last_post_time(self, db: AsyncSession, business_id) -> Optional[datetime]:
        result = await db.execute(
            select(ScheduledPost.created_at)
            .where(ScheduledPost.business_id == business_id)
            .order_by(ScheduledPost.created_at.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        return row if row else None
