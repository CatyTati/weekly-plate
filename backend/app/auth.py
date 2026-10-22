"""Checks the access token the app received from Supabase Auth at sign-in.

The React Native app signs users in directly with Supabase (email, Google,
Apple) and sends the resulting token to this API as `Authorization: Bearer`.
The API verifies the token's signature and expiry before trusting the user id.
"""
from __future__ import annotations

from functools import lru_cache

import jwt

from app.config import Settings
from app.errors import Unauthorized

AUDIENCE = "authenticated"


@lru_cache(maxsize=4)
def _jwks_client(url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(f"{url}/auth/v1/.well-known/jwks.json", cache_keys=True)


def verify_token(token: str, settings: Settings) -> str:
    """Return the user id inside a valid token, or raise Unauthorized."""
    try:
        alg = jwt.get_unverified_header(token).get("alg")
        if alg == "HS256":
            if not settings.supabase_jwt_secret:
                raise Unauthorized("invalid_token", "HS256 tokens need SUPABASE_JWT_SECRET")
            key, algorithms = settings.supabase_jwt_secret, ["HS256"]
        else:
            key = _jwks_client(settings.supabase_url).get_signing_key_from_jwt(token).key
            algorithms = ["RS256", "ES256"]
        claims = jwt.decode(token, key, algorithms=algorithms, audience=AUDIENCE,
                            options={"require": ["exp", "sub"]})
    except Unauthorized:
        raise
    except jwt.ExpiredSignatureError:
        raise Unauthorized("token_expired", "Sign in again") from None
    except (jwt.PyJWTError, ValueError):
        raise Unauthorized("invalid_token", "The access token is not valid") from None
    return str(claims["sub"])


def bearer(header: str | None) -> str:
    if not header or not header.lower().startswith("bearer "):
        raise Unauthorized("missing_token", "Sign in to continue")
    return header.split(" ", 1)[1].strip()
