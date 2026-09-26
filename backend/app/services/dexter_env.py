"""Minimal Gymnasium environment for Dexter DQN policy loading.

Matches the DexterLinkedInEnv used during training so that
stable-baselines3 can reconstruct the policy's observation and action spaces.
This file does NOT run training — it only provides space definitions.
"""

import math
import numpy as np
import gymnasium as gym
from gymnasium import spaces


class DexterLinkedInEnv(gym.Env):
    """Discrete MDP environment for LinkedIn post scheduling.

    Observation (8-dim continuous):
        0: sin(hour / 24 * 2π)   — cyclical hour encoding
        1: cos(hour / 24 * 2π)
        2: sin(day  /  7 * 2π)   — cyclical day-of-week encoding
        3: cos(day  /  7 * 2π)
        4: posts_last_24h         — count of posts in rolling 24h window
        5: hours_since_last_post  — hours since most recent post (capped at 48)
        6: deficit_ratio          — (target - current) / target, clamped [-1, 1]
        7: fatigue_score           — audience fatigue penalty [0, 1]

    Actions (4 discrete):
        0: WAIT — do not post
        1: POST_THOUGHT_LEADERSHIP — hook + long-form insight
        2: POST_CASE_STUDY — customer story / metrics deep-dive
        3: POST_CONTRARIAN — bold contrarian take for engagement
    """

    metadata = {"render_modes": []}

    def __init__(self, **kwargs):
        super().__init__()
        self.observation_space = spaces.Box(
            low=np.array([-1, -1, -1, -1, 0, 0, -1, 0], dtype=np.float32),
            high=np.array([1, 1, 1, 1, 10, 48, 1, 1], dtype=np.float32),
        )
        self.action_space = spaces.Discrete(4)
        self._step_count = 0
        self._max_steps = 720  # 30 days * 24 hours
        self._state = self._initial_state()

    def _initial_state(self) -> np.ndarray:
        return np.zeros(8, dtype=np.float32)

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        self._step_count = 0
        self._state = self._initial_state()
        return self._state, {}

    def step(self, action):
        self._step_count += 1
        reward = 0.0
        terminated = self._step_count >= self._max_steps
        return self._state, reward, terminated, False, {}
