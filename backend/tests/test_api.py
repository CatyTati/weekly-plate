"""End-to-end HTTP tests against the FastAPI app in memory mode.

Needs the packages in requirements.txt (fastapi, httpx). Skipped otherwise.
"""
import importlib.util
import os
import unittest
import uuid

from tests.helpers import image_bytes, recipe_body

HAVE_DEPS = all(importlib.util.find_spec(m) for m in ("fastapi", "httpx"))


@unittest.skipUnless(HAVE_DEPS, "fastapi / httpx not installed")
class ApiTests(unittest.TestCase):
    def setUp(self):
        os.environ["USE_MEMORY_REPO"] = "1"
        from fastapi.testclient import TestClient

        from app.config import Settings
        from app.main import create_app

        self.client = TestClient(create_app(Settings(use_memory=True)))
        self.alice = {"Authorization": f"Bearer dev:{uuid.UUID(int=1)}"}
        self.bob = {"Authorization": f"Bearer dev:{uuid.UUID(int=2)}"}

    def test_requires_sign_in(self):
        r = self.client.get("/v1/recipes")
        self.assertEqual(r.status_code, 401)
        self.assertEqual(r.json()["errors"][0]["code"], "missing_token")

    def test_create_recipe_and_photo(self):
        r = self.client.post("/v1/recipes", json=recipe_body(), headers=self.alice)
        self.assertEqual(r.status_code, 201, r.text)
        rid = r.json()["id"]
        p = self.client.post(f"/v1/recipes/{rid}/photos", headers=self.alice,
                             files={"photo": ("soup.png", image_bytes(), "image/png")})
        self.assertEqual(p.status_code, 201, p.text)
        self.assertEqual(p.json()["position"], 0)

    def test_validation_errors_are_listed_per_field(self):
        body = recipe_body(name="a", prep_minutes=1)
        body["ingredients"][0]["qty"] = -1
        r = self.client.post("/v1/recipes", json=body, headers=self.alice)
        self.assertEqual(r.status_code, 422)
        fields = {(e["field"], e["code"]) for e in r.json()["errors"]}
        self.assertTrue({("name", "string_too_short"), ("prep_minutes", "greater_than_equal"),
                         ("ingredients.0.qty", "greater_than")} <= fields, fields)

    def test_duplicate_name_409(self):
        self.client.post("/v1/recipes", json=recipe_body(), headers=self.alice)
        r = self.client.post("/v1/recipes", json=recipe_body(), headers=self.alice)
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.json()["errors"][0]["code"], "recipe_name_taken")

    def test_non_image_upload_rejected(self):
        rid = self.client.post("/v1/recipes", json=recipe_body(), headers=self.alice).json()["id"]
        r = self.client.post(f"/v1/recipes/{rid}/photos", headers=self.alice,
                             files={"photo": ("x.jpg", b"not an image", "image/jpeg")})
        self.assertEqual(r.status_code, 422)
        self.assertEqual(r.json()["errors"][0]["code"], "photo_unreadable")

    def test_auto_plan(self):
        self.client.post("/v1/recipes", json=recipe_body(), headers=self.alice)
        r = self.client.post("/v1/plans/auto", json={"week_start": "2026-10-25", "modes": ["budget"]},
                             headers=self.alice)
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(len(r.json()["days"]), 7)


if __name__ == "__main__":
    unittest.main()
