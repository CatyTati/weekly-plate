"""Weekly dinner planner.

Scores every recipe for every day by what matters in the user's home
(picky kids, tight budget, cook once a week, 20 minutes a night) and picks
the best one that is not already in the week. A little randomness keeps
weeks from repeating.
"""
from __future__ import annotations

import random
from typing import Any, Iterable, Sequence

DAYS = 7
WEEKNIGHTS = range(0, 5)        # Sunday to Thursday
CHEAP_PER_SERVING = 12.0        # ₪


def score(recipe: dict[str, Any], day: int, modes: Iterable[str], rng: random.Random) -> float:
    modes = set(modes)
    tags = set(recipe.get("tags") or [])
    minutes = recipe["prep_minutes"]
    s = rng.random() * 1.5
    if "kids" in modes and "kids" in tags:
        s += 2
    cost = recipe.get("cost_per_serving")
    if "budget" in modes and cost is not None and cost <= CHEAP_PER_SERVING:
        s += 2
    if "quick" in modes and day in WEEKNIGHTS:
        if minutes <= 20:
            s += 2.5
        elif minutes <= 30:
            s += 1
        else:
            s -= 1.5
    if "prep" in modes and "prep" in tags:
        s += 2 if day <= 3 else 1
    return s


def _best(recipes: Sequence[dict[str, Any]], day: int, modes, used: set[str], rng) -> str | None:
    best_id, best_score = None, float("-inf")
    for r in recipes:
        if r["id"] in used:
            continue
        sc = score(r, day, modes, rng)
        if sc > best_score:
            best_id, best_score = r["id"], sc
    return best_id


def plan_week(recipes: Sequence[dict[str, Any]], modes: Iterable[str],
              rng: random.Random | None = None) -> list[str | None]:
    """Return 7 recipe ids (Sunday first). A day is None when recipes run out."""
    rng = rng or random.Random()
    modes = list(modes)
    used: set[str] = set()
    plan: list[str | None] = []
    for day in range(DAYS):
        rid = _best(recipes, day, modes, used, rng)
        plan.append(rid)
        if rid:
            used.add(rid)
    return plan


def swap_day(plan: list[str | None], day: int, recipes: Sequence[dict[str, Any]],
             modes: Iterable[str], rng: random.Random | None = None) -> list[str | None]:
    rng = rng or random.Random()
    used = {r for r in plan if r}
    new = list(plan)
    replacement = _best(recipes, day, list(modes), used, rng)
    if replacement:
        new[day] = replacement
    return new
