"""Business rules for recipes, photos, plans and follows.

The API routes stay thin and call these functions, so the rules can be
tested without a web server or a database.
"""
from __future__ import annotations

import random
import uuid
from typing import Any

from app.errors import Conflict, LimitReached, NotFound
from app.repo.base import PhotoStorage, Repo
from app.schemas import PlanRequest, RecipeIn
from app.services.photos import process_photo
from app.services.planner import plan_week

FREE_RECIPE_LIMIT = 20
MAX_PHOTOS = 3


class Service:
    def __init__(self, repo: Repo, storage: PhotoStorage):
        self.repo = repo
        self.storage = storage

    # --- recipes -----------------------------------------------------------
    def _profile(self, user_id: str) -> dict[str, Any]:
        profile = self.repo.get_profile(user_id)
        if not profile:
            raise NotFound("profile_not_found", "No profile for this user")
        return profile

    def create_recipe(self, user_id: str, data: RecipeIn) -> dict[str, Any]:
        profile = self._profile(user_id)
        if self.repo.recipe_name_exists(user_id, data.name):
            raise Conflict("recipe_name_taken", "You already have a recipe with this name", field="name")
        if not profile.get("is_premium") and self.repo.count_own_recipes(user_id) >= FREE_RECIPE_LIMIT:
            raise LimitReached(message="The free plan allows up to 20 recipes",
                               params={"limit": FREE_RECIPE_LIMIT})
        return self.repo.create_recipe(user_id, data)

    def list_recipes(self, user_id: str) -> list[dict[str, Any]]:
        return self.repo.list_visible_recipes(user_id)

    def _own_recipe(self, user_id: str, recipe_id: str) -> dict[str, Any]:
        recipe = self.repo.get_recipe(user_id, recipe_id)
        # Someone else's recipe looks the same as a missing one: no hint that it exists.
        if not recipe or recipe.get("owner_id") != user_id:
            raise NotFound("recipe_not_found", "Recipe not found")
        return recipe

    def delete_recipe(self, user_id: str, recipe_id: str) -> None:
        recipe = self._own_recipe(user_id, recipe_id)
        paths = [p["path"] for p in recipe.get("photos", [])]
        self.repo.delete_recipe(user_id, recipe_id)
        if paths:
            self.storage.remove(paths)

    # --- photos ------------------------------------------------------------
    def add_photo(self, user_id: str, recipe_id: str, data: bytes) -> dict[str, Any]:
        self._own_recipe(user_id, recipe_id)
        taken = {p["position"] for p in self.repo.list_photos(recipe_id)}
        if len(taken) >= MAX_PHOTOS:
            raise Conflict("photo_limit", "A recipe can have up to 3 photos", field="photo",
                           params={"limit": MAX_PHOTOS})
        clean = process_photo(data)
        position = min(set(range(MAX_PHOTOS)) - taken)
        path = f"{user_id}/{recipe_id}/{uuid.uuid4().hex}.jpg"
        self.storage.upload(path, clean, "image/jpeg")
        try:
            self.repo.add_photo(recipe_id, position, path)
        except Exception:
            self.storage.remove([path])   # don't leave an orphan file behind
            raise
        return {"position": position, "path": path, "url": self.storage.public_url(path)}

    def delete_photo(self, user_id: str, recipe_id: str, position: int) -> None:
        recipe = self._own_recipe(user_id, recipe_id)
        match = [p for p in recipe.get("photos", []) if p["position"] == position]
        if not match:
            raise NotFound("photo_not_found", "Photo not found")
        self.repo.delete_photo(recipe_id, position)
        self.storage.remove([match[0]["path"]])

    # --- plans -------------------------------------------------------------
    def auto_plan(self, user_id: str, req: PlanRequest) -> dict[str, Any]:
        self._profile(user_id)
        recipes = self.repo.list_visible_recipes(user_id)
        rng = random.Random(req.seed) if req.seed is not None else None
        days = plan_week(recipes, [m.value for m in req.modes], rng)
        plan_id = self.repo.save_week_plan(user_id, req.week_start, days)
        return {"id": plan_id, "week_start": req.week_start.isoformat(), "days": days}

    # --- follows -----------------------------------------------------------
    def follow(self, user_id: str, target_id: str) -> None:
        if user_id == target_id:
            raise Conflict("cannot_follow_self", "You can't follow yourself")
        if not self.repo.get_profile(target_id):
            raise NotFound("user_not_found", "User not found")
        self.repo.follow(user_id, target_id)

    def unfollow(self, user_id: str, target_id: str) -> None:
        self.repo.unfollow(user_id, target_id)
