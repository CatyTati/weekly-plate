"""Production storage on Supabase.

Every request builds a client with the *user's own* access token, so the
database's Row Level Security rules apply to everything the API does:
the server cannot accidentally show one user's private recipe to another.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Sequence

from app.config import Settings
from app.errors import Conflict, LimitReached
from app.repo.base import cost_per_serving
from app.schemas import RecipeIn

BUCKET = "recipe-photos"
RECIPE_SELECT = ("*, ingredients:recipe_ingredients(position,name,qty,unit,aisle,price_per_unit),"
                 " photos:recipe_photos(position,storage_path)")


def user_client(settings: Settings, access_token: str):
    from supabase import ClientOptions, create_client  # imported lazily: tests don't need it

    client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
        options=ClientOptions(headers={"Authorization": f"Bearer {access_token}"}),
    )
    client.postgrest.auth(access_token)
    return client


def _ilike_exact(text: str) -> str:
    """Escape LIKE wildcards so ilike works as a case-insensitive equality."""
    return text.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _translate_db_error(exc: Exception) -> Exception:
    code = getattr(exc, "code", None)
    msg = str(getattr(exc, "message", exc))
    if code == "23505" and "recipes_owner_name_uniq" in msg:
        return Conflict("recipe_name_taken", "You already have a recipe with this name", field="name")
    if "free_plan_recipe_limit" in msg:
        return LimitReached(message="The free plan allows up to 20 recipes", params={"limit": 20})
    return exc


def _shape(row: dict[str, Any]) -> dict[str, Any]:
    ings = sorted(row.pop("ingredients", None) or [], key=lambda i: i["position"])
    photos = sorted(row.pop("photos", None) or [], key=lambda p: p["position"])
    return {**row,
            "ingredients": ings,
            "photos": [{"position": p["position"], "path": p["storage_path"]} for p in photos],
            "cost_per_serving": cost_per_serving(ings)}


class SupabaseRepo:
    def __init__(self, client):
        self.c = client

    def get_profile(self, user_id: str):
        res = self.c.table("profiles").select("id,is_premium,lang").eq("id", user_id).limit(1).execute()
        return res.data[0] if res.data else None

    def count_own_recipes(self, user_id: str) -> int:
        res = self.c.table("recipes").select("id", count="exact").eq("owner_id", user_id).limit(1).execute()
        return res.count or 0

    def recipe_name_exists(self, user_id: str, name: str) -> bool:
        res = (self.c.table("recipes").select("id").eq("owner_id", user_id)
               .ilike("name", _ilike_exact(name)).limit(1).execute())
        return bool(res.data)

    def create_recipe(self, user_id: str, data: RecipeIn) -> dict[str, Any]:
        try:
            rid = self.c.rpc("create_recipe", {"payload": data.model_dump(mode="json")}).execute().data
        except Exception as exc:  # postgrest APIError
            raise _translate_db_error(exc) from exc
        return self.get_recipe(user_id, rid)

    def get_recipe(self, user_id: str, recipe_id: str):
        res = self.c.table("recipes").select(RECIPE_SELECT).eq("id", recipe_id).limit(1).execute()
        return _shape(res.data[0]) if res.data else None

    def list_visible_recipes(self, user_id: str):
        res = self.c.table("recipes").select(RECIPE_SELECT).order("created_at", desc=True).limit(500).execute()
        return [_shape(r) for r in res.data or []]

    def delete_recipe(self, user_id: str, recipe_id: str) -> None:
        self.c.table("recipes").delete().eq("id", recipe_id).execute()

    def list_photos(self, recipe_id: str):
        res = self.c.table("recipe_photos").select("position,storage_path").eq("recipe_id", recipe_id).execute()
        return [{"position": p["position"], "path": p["storage_path"]} for p in res.data or []]

    def add_photo(self, recipe_id: str, position: int, path: str) -> None:
        self.c.table("recipe_photos").insert(
            {"recipe_id": recipe_id, "position": position, "storage_path": path}).execute()

    def delete_photo(self, recipe_id: str, position: int) -> None:
        self.c.table("recipe_photos").delete().eq("recipe_id", recipe_id).eq("position", position).execute()

    def save_week_plan(self, user_id: str, week: date, recipe_ids: Sequence[str | None]) -> str:
        return self.c.rpc("save_week_plan", {"week": week.isoformat(), "recipe_ids": list(recipe_ids)}).execute().data

    def follow(self, follower_id: str, followee_id: str) -> None:
        self.c.table("follows").upsert({"follower_id": follower_id, "followee_id": followee_id},
                                       on_conflict="follower_id,followee_id", ignore_duplicates=True).execute()

    def unfollow(self, follower_id: str, followee_id: str) -> None:
        self.c.table("follows").delete().eq("follower_id", follower_id).eq("followee_id", followee_id).execute()


class SupabaseStorage:
    def __init__(self, client):
        self.bucket = client.storage.from_(BUCKET)

    def upload(self, path: str, data: bytes, content_type: str) -> None:
        self.bucket.upload(path, data, {"content-type": content_type, "upsert": "false"})

    def remove(self, paths: Sequence[str]) -> None:
        self.bucket.remove(list(paths))

    def public_url(self, path: str) -> str:
        return self.bucket.get_public_url(path)
