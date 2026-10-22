import unittest
import uuid
from datetime import date
from io import BytesIO

from PIL import Image

from app.errors import Conflict, InvalidPhoto, LimitReached, NotFound
from app.repo.memory import MemoryRepo, MemoryStorage
from app.schemas import PlanRequest, RecipeIn
from app.services import photos
from app.services.recipes import Service
from tests.helpers import image_bytes, recipe_body

ALICE, BOB = str(uuid.UUID(int=1)), str(uuid.UUID(int=2))


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.repo, self.storage = MemoryRepo(), MemoryStorage()
        self.repo.add_user(ALICE)
        self.repo.add_user(BOB)
        self.svc = Service(self.repo, self.storage)

    def make(self, user=ALICE, **kw):
        return self.svc.create_recipe(user, RecipeIn.model_validate(recipe_body(**kw)))

    # --- recipes -----------------------------------------------------------
    def test_create_and_list(self):
        rec = self.make()
        self.assertEqual(rec["owner_id"], ALICE)
        self.assertEqual([x["id"] for x in self.svc.list_recipes(ALICE)], [rec["id"]])

    def test_private_recipe_hidden_from_others(self):
        self.make()
        self.assertEqual(self.svc.list_recipes(BOB), [])

    def test_public_recipe_visible_to_others(self):
        self.make(is_public=True)
        self.assertEqual(len(self.svc.list_recipes(BOB)), 1)

    def test_duplicate_name_is_conflict(self):
        self.make(name="Lentil soup")
        with self.assertRaises(Conflict) as ctx:
            self.make(name="lentil SOUP")
        self.assertEqual((ctx.exception.code, ctx.exception.field), ("recipe_name_taken", "name"))

    def test_same_name_allowed_for_different_users(self):
        self.make(name="Lentil soup")
        self.make(user=BOB, name="Lentil soup")

    def test_free_plan_limit(self):
        for i in range(20):
            self.make(name=f"Recipe {i}")
        with self.assertRaises(LimitReached):
            self.make(name="Recipe 21")

    def test_premium_has_no_limit(self):
        self.repo.profiles[ALICE]["is_premium"] = True
        for i in range(21):
            self.make(name=f"Recipe {i}")

    def test_cannot_delete_someone_elses_recipe(self):
        rec = self.make()
        with self.assertRaises(NotFound):
            self.svc.delete_recipe(BOB, rec["id"])

    def test_delete_removes_photo_files(self):
        rec = self.make()
        self.svc.add_photo(ALICE, rec["id"], image_bytes())
        self.svc.delete_recipe(ALICE, rec["id"])
        self.assertEqual(self.storage.files, {})

    # --- photos ------------------------------------------------------------
    def test_photo_is_converted_and_stored(self):
        rec = self.make()
        out = self.svc.add_photo(ALICE, rec["id"], image_bytes("PNG"))
        self.assertEqual(out["position"], 0)
        self.assertTrue(out["path"].startswith(f"{ALICE}/{rec['id']}/"))
        stored = self.storage.files[out["path"]]
        self.assertEqual(Image.open(BytesIO(stored)).format, "JPEG")

    def test_max_three_photos(self):
        rec = self.make()
        for _ in range(3):
            self.svc.add_photo(ALICE, rec["id"], image_bytes())
        with self.assertRaises(Conflict) as ctx:
            self.svc.add_photo(ALICE, rec["id"], image_bytes())
        self.assertEqual(ctx.exception.code, "photo_limit")

    def test_freed_slot_is_reused(self):
        rec = self.make()
        for _ in range(3):
            self.svc.add_photo(ALICE, rec["id"], image_bytes())
        self.svc.delete_photo(ALICE, rec["id"], 1)
        self.assertEqual(self.svc.add_photo(ALICE, rec["id"], image_bytes())["position"], 1)

    def test_cannot_add_photo_to_someone_elses_recipe(self):
        rec = self.make(is_public=True)
        with self.assertRaises(NotFound):
            self.svc.add_photo(BOB, rec["id"], image_bytes())

    def test_failed_db_write_removes_uploaded_file(self):
        rec = self.make()
        self.repo.add_photo = lambda *a: (_ for _ in ()).throw(RuntimeError("db down"))
        with self.assertRaises(RuntimeError):
            self.svc.add_photo(ALICE, rec["id"], image_bytes())
        self.assertEqual(self.storage.files, {})

    # --- plans and follows -------------------------------------------------
    def test_auto_plan_uses_visible_recipes(self):
        mine = self.make()
        self.make(user=BOB, name="Bob secret")                     # private, must not appear
        out = self.svc.auto_plan(ALICE, PlanRequest(week_start=date(2026, 10, 25), seed=1))
        self.assertEqual(len(out["days"]), 7)
        self.assertEqual([d for d in out["days"] if d], [mine["id"]])

    def test_follow_rules(self):
        with self.assertRaises(Conflict):
            self.svc.follow(ALICE, ALICE)
        with self.assertRaises(NotFound):
            self.svc.follow(ALICE, str(uuid.uuid4()))
        self.svc.follow(ALICE, BOB)
        self.assertIn((ALICE, BOB), self.repo.follows)


class PhotoChecks(unittest.TestCase):
    def test_accepts_common_formats(self):
        for fmt in ("PNG", "JPEG", "WEBP", "GIF"):
            out = photos.process_photo(image_bytes(fmt))
            self.assertEqual(Image.open(BytesIO(out)).format, "JPEG", fmt)

    def test_rejects_non_image(self):
        with self.assertRaises(InvalidPhoto) as ctx:
            photos.process_photo(b"%PDF-1.7 not a photo")
        self.assertEqual(ctx.exception.code, "photo_unreadable")

    def test_rejects_unsupported_format(self):
        with self.assertRaises(InvalidPhoto) as ctx:
            photos.process_photo(image_bytes("BMP"))
        self.assertEqual(ctx.exception.code, "photo_type")

    def test_rejects_empty_and_too_large(self):
        with self.assertRaises(InvalidPhoto):
            photos.process_photo(b"")
        with self.assertRaises(InvalidPhoto) as ctx:
            photos.process_photo(b"0" * (photos.MAX_BYTES + 1))
        self.assertEqual(ctx.exception.code, "photo_too_large")

    def test_resizes_large_photo(self):
        out = photos.process_photo(image_bytes("JPEG", size=(4000, 3000)))
        self.assertEqual(max(Image.open(BytesIO(out)).size), photos.MAX_SIDE)

    def test_removes_location_metadata(self):
        exif = Image.Exif()
        exif[0x8825] = {1: "N", 2: (32.0, 4.0, 0.0), 3: "E", 4: (34.0, 46.0, 0.0)}  # GPS: Tel Aviv
        exif[0x010F] = "PhoneMaker"
        original = image_bytes("JPEG", exif=exif.tobytes())
        self.assertIn(0x8825, Image.open(BytesIO(original)).getexif())
        cleaned = Image.open(BytesIO(photos.process_photo(original)))
        self.assertEqual(dict(cleaned.getexif()), {})


if __name__ == "__main__":
    unittest.main()
