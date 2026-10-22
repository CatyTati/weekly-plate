import time
import unittest

import jwt

from app.auth import bearer, verify_token
from app.config import Settings
from app.errors import Unauthorized

SECRET = "test-secret-at-least-32-characters-long"
SETTINGS = Settings(supabase_url="https://example.supabase.co", supabase_jwt_secret=SECRET)


def token(**claims):
    base = {"sub": "11111111-1111-1111-1111-111111111111", "aud": "authenticated",
            "exp": int(time.time()) + 3600}
    base.update(claims)
    return jwt.encode(base, claims.pop("_key", SECRET), algorithm="HS256")


class TokenChecks(unittest.TestCase):
    def test_valid_token(self):
        self.assertEqual(verify_token(token(), SETTINGS), "11111111-1111-1111-1111-111111111111")

    def test_expired(self):
        with self.assertRaises(Unauthorized) as ctx:
            verify_token(token(exp=int(time.time()) - 10), SETTINGS)
        self.assertEqual(ctx.exception.code, "token_expired")

    def test_wrong_signature(self):
        bad = jwt.encode({"sub": "x", "aud": "authenticated", "exp": int(time.time()) + 60},
                         "another-secret-that-is-also-long-enough", algorithm="HS256")
        with self.assertRaises(Unauthorized):
            verify_token(bad, SETTINGS)

    def test_wrong_audience(self):
        with self.assertRaises(Unauthorized):
            verify_token(token(aud="anon"), SETTINGS)

    def test_garbage(self):
        with self.assertRaises(Unauthorized):
            verify_token("not-a-token", SETTINGS)

    def test_bearer_header(self):
        self.assertEqual(bearer("Bearer abc"), "abc")
        with self.assertRaises(Unauthorized):
            bearer(None)
        with self.assertRaises(Unauthorized):
            bearer("Basic abc")


if __name__ == "__main__":
    unittest.main()
