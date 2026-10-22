"""Database rules: constraints, Row Level Security, limits.

Runs the real migration on a throwaway local PostgreSQL. Skipped when
PostgreSQL is not installed.
"""
import unittest
import uuid

from tests import pg

A = str(uuid.UUID(int=1))
B = str(uuid.UUID(int=2))
METHOD = "'Fry the onion, add the rest and simmer.'"


@unittest.skipUnless(pg.available(), "PostgreSQL is not installed")
class DatabaseRules(unittest.TestCase):
    db: pg.LocalPostgres

    @classmethod
    def setUpClass(cls):
        cls.db = pg.LocalPostgres()
        cls.db.start()
        cls.db.sql(f"insert into auth.users (id) values ('{A}'), ('{B}');")
        # one built-in recipe, readable by everyone
        cls.db.sql(f"insert into public.recipes (id, owner_id, name, prep_minutes, method) "
                   f"values ('{uuid.UUID(int=99)}', null, 'Shakshuka', 20, {METHOD});")

    @classmethod
    def tearDownClass(cls):
        cls.db.stop()

    def new_recipe(self, user, name, **extra):
        cols = {"owner_id": f"'{user}'", "name": f"'{name}'", "prep_minutes": "30", "method": METHOD}
        cols.update(extra)
        return self.db.as_user(user, (
            f"insert into public.recipes ({', '.join(cols)}) "
            f"values ({', '.join(cols.values())}) returning id;"))

    def assertSqlError(self, fragment, fn, *args, **kw):
        with self.assertRaises(pg.SqlError) as ctx:
            fn(*args, **kw)
        self.assertIn(fragment, str(ctx.exception))

    # --- sign-up ---------------------------------------------------------
    def test_profile_created_on_signup(self):
        self.assertEqual(self.db.sql(f"select count(*) from public.profiles where id in ('{A}','{B}');"), "2")

    # --- privacy ---------------------------------------------------------
    def test_private_recipe_visible_only_to_owner(self):
        rid = self.new_recipe(A, "Private soup")
        self.assertEqual(self.db.as_user(A, f"select count(*) from public.recipes where id = '{rid}';"), "1")
        self.assertEqual(self.db.as_user(B, f"select count(*) from public.recipes where id = '{rid}';"), "0")

    def test_public_and_builtin_recipes_visible_to_others(self):
        rid = self.new_recipe(A, "Shared pasta", is_public="true")
        self.assertEqual(self.db.as_user(B, f"select count(*) from public.recipes where id = '{rid}';"), "1")
        self.assertEqual(self.db.as_user(B, "select count(*) from public.recipes where owner_id is null;"), "1")

    def test_cannot_create_recipe_for_someone_else(self):
        self.assertSqlError("row-level security", self.new_recipe, B, "Fake", owner_id=f"'{A}'")

    def test_cannot_edit_someone_elses_recipe(self):
        rid = self.new_recipe(A, "Mine only", is_public="true")
        self.db.as_user(B, f"update public.recipes set name = 'Hacked' where id = '{rid}';")
        self.assertEqual(self.db.sql(f"select name from public.recipes where id = '{rid}';"), "Mine only")

    def test_ingredients_of_private_recipe_hidden(self):
        rid = self.new_recipe(A, "Secret sauce")
        self.db.as_user(A, f"insert into public.recipe_ingredients (recipe_id, position, name, qty, unit, aisle) "
                           f"values ('{rid}', 0, 'salt', 1, 'tsp', 'pantry');")
        self.assertEqual(self.db.as_user(B, f"select count(*) from public.recipe_ingredients where recipe_id = '{rid}';"), "0")

    def test_user_cannot_make_themselves_premium(self):
        self.assertSqlError("permission denied", self.db.as_user, A,
                            f"update public.profiles set is_premium = true where id = '{A}';")

    # --- field rules -----------------------------------------------------
    def test_prep_time_range(self):
        self.assertSqlError("prep_minutes", self.new_recipe, A, "Too fast", prep_minutes="3")

    def test_name_too_short(self):
        self.assertSqlError("recipes_name_check", self.new_recipe, A, "x")

    def test_kid_note_needs_kids_tag(self):
        self.assertSqlError("kid_note_needs_kids_tag", self.new_recipe, A, "Spicy", kid_note="'no chili'")

    def test_unknown_tag_rejected(self):
        self.assertSqlError("recipes_tags_check", self.new_recipe, A, "Odd tag", tags="array['vegan']")

    def test_duplicate_name_ignores_case(self):
        self.new_recipe(A, "Lentil Stew")
        self.assertSqlError("recipes_owner_name_uniq", self.new_recipe, A, "lentil stew")

    def test_at_most_three_photos(self):
        rid = self.new_recipe(A, "Photo cake")
        for i in range(3):
            self.db.as_user(A, f"insert into public.recipe_photos values ('{rid}', {i}, '{A}/{rid}/{i}.jpg');")
        self.assertSqlError("recipe_photos_position_check", self.db.as_user, A,
                            f"insert into public.recipe_photos values ('{rid}', 3, '{A}/{rid}/3.jpg');")

    def test_ingredient_quantity_must_be_positive(self):
        rid = self.new_recipe(A, "Zero salt")
        self.assertSqlError("recipe_ingredients_qty_check", self.db.as_user, A,
                            f"insert into public.recipe_ingredients (recipe_id, position, name, qty, unit, aisle) "
                            f"values ('{rid}', 0, 'salt', 0, 'tsp', 'pantry');")

    # --- plans and follows -----------------------------------------------
    def test_week_must_start_on_sunday(self):
        self.assertSqlError("week_start", self.db.as_user, A,
                            f"insert into public.weekly_plans (owner_id, week_start) values ('{A}', '2026-10-26');")

    def test_plan_cannot_use_someone_elses_private_recipe(self):
        rid = self.new_recipe(A, "Not for B")
        pid = self.db.as_user(B, f"insert into public.weekly_plans (owner_id, week_start) "
                                 f"values ('{B}', '2026-10-25') returning id;")
        self.assertSqlError("row-level security", self.db.as_user, B,
                            f"insert into public.plan_days values ('{pid}', 0, '{rid}');")

    def test_cannot_follow_yourself_or_for_someone_else(self):
        self.assertSqlError("follows_check", self.db.as_user, A,
                            f"insert into public.follows (follower_id, followee_id) values ('{A}', '{A}');")
        self.assertSqlError("row-level security", self.db.as_user, B,
                            f"insert into public.follows (follower_id, followee_id) values ('{A}', '{B}');")

    # --- free plan limit -------------------------------------------------
    def test_free_plan_limit_and_premium(self):
        u = str(uuid.UUID(int=3))
        self.db.sql(f"insert into auth.users (id) values ('{u}');")
        for i in range(20):
            self.new_recipe(u, f"Recipe {i:02d}")
        self.assertSqlError("free_plan_recipe_limit", self.new_recipe, u, "Recipe 21")
        self.db.sql(f"update public.profiles set is_premium = true where id = '{u}';")  # payment webhook
        self.new_recipe(u, "Recipe 21")

    # --- atomic writes ---------------------------------------------------
    def test_create_recipe_function_saves_all_or_nothing(self):
        good = ('{"name":"Rice bowl","prep_minutes":20,"method":"Cook the rice and top it.",'
                '"tags":["quick"],"ingredients":[{"name":"rice","qty":400,"unit":"g","aisle":"pantry"},'
                '{"name":"egg","qty":4,"unit":"pcs","aisle":"dairy"}]}')
        rid = self.db.as_user(A, f"select public.create_recipe('{good}'::jsonb);")
        self.assertEqual(self.db.sql(f"select count(*) from public.recipe_ingredients where recipe_id = '{rid}';"), "2")
        bad = good.replace('"Rice bowl"', '"Broken bowl"').replace('"qty":4,', '"qty":0,')
        self.assertSqlError("qty_check", self.db.as_user, A, f"select public.create_recipe('{bad}'::jsonb);")
        self.assertEqual(self.db.sql("select count(*) from public.recipes where name = 'Broken bowl';"), "0")

    def test_save_week_plan_replaces_days(self):
        ids = ",".join(["null"] * 6 + [f"'{uuid.UUID(int=99)}'"])
        pid = self.db.as_user(A, f"select public.save_week_plan('2026-11-01', array[{ids}]::uuid[]);")
        pid2 = self.db.as_user(A, f"select public.save_week_plan('2026-11-01', array[{ids}]::uuid[]);")
        self.assertEqual(pid, pid2)
        self.assertEqual(self.db.sql(f"select count(*) from public.plan_days where plan_id = '{pid}';"), "7")
        self.assertSqlError("plan_needs_7_days", self.db.as_user, A,
                            "select public.save_week_plan('2026-11-08', array[null]::uuid[]);")

    # --- photo storage ---------------------------------------------------
    def test_photo_upload_only_into_own_folder(self):
        self.db.as_user(A, f"insert into storage.objects (bucket_id, name) values ('recipe-photos', '{A}/r1/0.jpg');")
        self.assertSqlError("row-level security", self.db.as_user, A,
                            f"insert into storage.objects (bucket_id, name) values ('recipe-photos', '{B}/r1/0.jpg');")


if __name__ == "__main__":
    unittest.main()
