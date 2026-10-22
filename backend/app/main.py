"""HTTP API for the Weekly Plate app (FastAPI).

Run locally without Supabase:
    USE_MEMORY_REPO=1 uvicorn app.main:app --reload
In memory mode a token like `dev:<any-uuid>` signs you in as that user.

Interactive docs: http://localhost:8000/docs
The React Native app can generate typed API calls from /openapi.json.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import Depends, FastAPI, File, Header, Request, Response, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import bearer, verify_token
from app.config import Settings
from app.errors import AppError, Unauthorized, format_validation_errors
from app.repo.memory import MemoryRepo, MemoryStorage
from app.schemas import PlanRequest, RecipeIn
from app.services.photos import MAX_BYTES
from app.services.recipes import Service


@dataclass
class Ctx:
    user_id: str
    service: Service


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    app = FastAPI(title="Weekly Plate API", version="0.1.0")
    if settings.cors_origins:
        app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins),
                           allow_methods=["*"], allow_headers=["*"])

    memory_repo, memory_storage = MemoryRepo(), MemoryStorage()

    def context(authorization: str | None = Header(default=None)) -> Ctx:
        token = bearer(authorization)
        if settings.use_memory:
            if not token.startswith("dev:"):
                raise Unauthorized("invalid_token", "In memory mode use a token like dev:<uuid>")
            user_id = str(uuid.UUID(token[4:]))
            if not memory_repo.get_profile(user_id):
                memory_repo.add_user(user_id)
            return Ctx(user_id, Service(memory_repo, memory_storage))
        from app.repo.supabase_repo import SupabaseRepo, SupabaseStorage, user_client

        user_id = verify_token(token, settings)
        client = user_client(settings, token)
        return Ctx(user_id, Service(SupabaseRepo(client), SupabaseStorage(client)))

    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status, content={"errors": [exc.to_dict()]})

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"errors": format_validation_errors(exc.errors())})

    @app.get("/health")
    def health():
        return {"ok": True}

    @app.get("/v1/recipes")
    def list_recipes(ctx: Ctx = Depends(context)):
        return ctx.service.list_recipes(ctx.user_id)

    @app.post("/v1/recipes", status_code=status.HTTP_201_CREATED)
    def create_recipe(body: RecipeIn, ctx: Ctx = Depends(context)):
        return ctx.service.create_recipe(ctx.user_id, body)

    @app.delete("/v1/recipes/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_recipe(recipe_id: uuid.UUID, ctx: Ctx = Depends(context)):
        ctx.service.delete_recipe(ctx.user_id, str(recipe_id))
        return Response(status_code=204)

    @app.post("/v1/recipes/{recipe_id}/photos", status_code=status.HTTP_201_CREATED)
    async def add_photo(recipe_id: uuid.UUID, photo: UploadFile = File(...), ctx: Ctx = Depends(context)):
        data = await photo.read(MAX_BYTES + 1)  # one byte more than allowed, to detect "too large"
        return ctx.service.add_photo(ctx.user_id, str(recipe_id), data)

    @app.delete("/v1/recipes/{recipe_id}/photos/{position}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_photo(recipe_id: uuid.UUID, position: int, ctx: Ctx = Depends(context)):
        ctx.service.delete_photo(ctx.user_id, str(recipe_id), position)
        return Response(status_code=204)

    @app.post("/v1/plans/auto")
    def auto_plan(body: PlanRequest, ctx: Ctx = Depends(context)):
        return ctx.service.auto_plan(ctx.user_id, body)

    @app.put("/v1/follows/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
    def follow(user_id: uuid.UUID, ctx: Ctx = Depends(context)):
        ctx.service.follow(ctx.user_id, str(user_id))
        return Response(status_code=204)

    @app.delete("/v1/follows/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
    def unfollow(user_id: uuid.UUID, ctx: Ctx = Depends(context)):
        ctx.service.unfollow(ctx.user_id, str(user_id))
        return Response(status_code=204)

    return app


app = create_app()
