"""One error shape for the whole API.

Every error response looks like:
    {"errors": [{"field": "ingredients.1.qty", "code": "greater_than",
                 "message": "...", "params": {"gt": 0}}]}
The app translates `code` (with `params`) into Hebrew, English or Russian.
`message` is English, for developers and logs.
"""
from __future__ import annotations

from typing import Any, Iterable

from pydantic import ValidationError

_PARAM_KEYS = ("min_length", "max_length", "gt", "ge", "lt", "le", "expected", "first", "limit")


class AppError(Exception):
    status = 400
    code = "bad_request"

    def __init__(self, code: str | None = None, message: str = "", field: str | None = None,
                 params: dict[str, Any] | None = None):
        self.code = code or self.code
        self.message = message or self.code.replace("_", " ")
        self.field = field
        self.params = params or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        return {"field": self.field, "code": self.code, "message": self.message, "params": self.params}


class NotFound(AppError):
    status = 404
    code = "not_found"


class Conflict(AppError):
    status = 409
    code = "conflict"


class LimitReached(AppError):
    status = 403
    code = "free_plan_recipe_limit"


class InvalidPhoto(AppError):
    status = 422
    code = "photo_invalid"


class Unauthorized(AppError):
    status = 401
    code = "unauthorized"


def format_validation_errors(errors: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    """Turn pydantic / FastAPI validation errors into the API's error shape."""
    out = []
    for err in errors:
        ctx = err.get("ctx") or {}
        loc = [str(p) for p in err.get("loc", ()) if p not in ("body", "query", "path")]
        field = ".".join(loc) or ctx.get("field")
        if not loc and ctx.get("field"):
            field = ctx["field"]
        out.append({
            "field": field,
            "code": err.get("type", "invalid"),
            "message": err.get("msg", ""),
            "params": {k: (v if isinstance(v, (int, float, str, bool)) else str(v))
                       for k, v in ctx.items() if k in _PARAM_KEYS},
        })
    return out


def from_validation_error(exc: ValidationError) -> list[dict[str, Any]]:
    return format_validation_errors(exc.errors())
