"""In-memory storage for tests and local development.

It mirrors the database rules that matter to the business logic: private
recipes are only visible to their owner, names are unique per owner, and
photos are limited by position.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any, Sequence

from app.repo.base import cost_per_serving
from app.schemas import RecipeIn


class MemoryRepo:
    def __init__(self) -> None:
        self.profiles: dict[str, dict[str, Any]] = {}
        self.recipes: dict[str, dict[str, Any]] = {}
        self.photos: dict[str, dict[int, str]] = {}
        self.plans: dict[tuple[str, date], dict[str, Any]] = {}
        self.follows: set[tuple[str, str]] = set()

    # helpers for tests / seeding
    def add_user(self, user_id: str, is_premium: bool = False) -> None:
        self.profiles[user_id] = {"id": user_id, "is_premium": is_premium, "lang": "he"}

    def add_builtin(self, recipe: dict[str, Any]) -> None:
        self.recipes[recipe["id"]] = {"owner_id": None, "is_public": True, **recipe}

    def _visible(self, user_id: str, r: dict[str, Any]) -> bool:
        return r["owner_id"] is None or r.get("is_public") or r["owner_id"] == user_id

    def _out(self, r: dict[str, Any]) -> dict[str, Any]:
        ings = r.get("ingredients", [])
        return {**r, "cost_per_serving": cost_per_serving(ings),
                "photos": [{"position": p, "path": path}
                           for p, path in sorted(self.photos.get(r["id"], {}).items())]}

    # Repo protocol
    def get_profile(self, user_id: str):
        return self.profiles.get(user_id)

    def count_own_recipes(self, user_id: str) -> int:
        return sum(1 for r in self.recipes.values() if r["owner_id"] == user_id)

    def recipe_name_exists(self, user_id: str, name: str) -> bool:
        key = name.strip().casefold()
        return any(r["owner_id"] == user_id and r["name"].casefold() == key for r in self.recipes.values())

    def create_recipe(self, user_id: str, data: RecipeIn) -> dict[str, Any]:
        rid = str(uuid.uuid4())
        body = data.model_dump(mode="json")
        self.recipes[rid] = {"id": rid, "owner_id": user_id,
                             "created_at": datetime.now(timezone.utc).isoformat(), **body}
        return self._out(self.recipes[rid])

    def get_recipe(self, user_id: str, recipe_id: str):
        r = self.recipes.get(recipe_id)
        return self._out(r) if r and self._visible(user_id, r) else None

    def list_visible_recipes(self, user_id: str):
        return [self._out(r) for r in self.recipes.values() if self._visible(user_id, r)]

    def delete_recipe(self, user_id: str, recipe_id: str) -> None:
        r = self.recipes.get(recipe_id)
        if r and r["owner_id"] == user_id:
            del self.recipes[recipe_id]
            self.photos.pop(recipe_id, None)

    def list_photos(self, recipe_id: str):
        return [{"position": p, "path": path} for p, path in sorted(self.photos.get(recipe_id, {}).items())]

    def add_photo(self, recipe_id: str, position: int, path: str) -> None:
        slots = self.photos.setdefault(recipe_id, {})
        if position in slots or not 0 <= position <= 2:
            raise ValueError("photo position taken")
        slots[position] = path

    def delete_photo(self, recipe_id: str, position: int) -> None:
        self.photos.get(recipe_id, {}).pop(position, None)

    def save_week_plan(self, user_id: str, week: date, recipe_ids: Sequence[str | None]) -> str:
        key = (user_id, week)
        plan = self.plans.get(key) or {"id": str(uuid.uuid4())}
        plan["days"] = list(recipe_ids)
        self.plans[key] = plan
        return plan["id"]

    def follow(self, follower_id: str, followee_id: str) -> None:
        self.follows.add((follower_id, followee_id))

    def unfollow(self, follower_id: str, followee_id: str) -> None:
        self.follows.discard((follower_id, followee_id))


class MemoryStorage:
    def __init__(self) -> None:
        self.files: dict[str, bytes] = {}

    def upload(self, path: str, data: bytes, content_type: str) -> None:
        self.files[path] = data

    def remove(self, paths: Sequence[str]) -> None:
        for p in paths:
            self.files.pop(p, None)

    def public_url(self, path: str) -> str:
        return f"memory://recipe-photos/{path}"
