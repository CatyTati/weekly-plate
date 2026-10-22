import unittest
from datetime import date

from pydantic import ValidationError

from app.errors import from_validation_error
from app.schemas import PlanRequest, RecipeIn
from tests.helpers import recipe_body


def errors_for(model, data):
    with unittest.TestCase().assertRaises(ValidationError) as ctx:
        model.model_validate(data)
    return {(e["field"], e["code"]) for e in from_validation_error(ctx.exception)}


class RecipeValidation(unittest.TestCase):
    def test_valid_recipe(self):
        r = RecipeIn.model_validate(recipe_body(name="  Lentil soup  "))
        self.assertEqual(r.name, "Lentil soup")          # spaces trimmed
        self.assertEqual(r.keeps_days, 3)                # meal-prep default

    def test_name_too_short(self):
        self.assertIn(("name", "string_too_short"), errors_for(RecipeIn, recipe_body(name=" a ")))

    def test_name_too_long(self):
        self.assertIn(("name", "string_too_long"), errors_for(RecipeIn, recipe_body(name="x" * 61)))

    def test_prep_time_range(self):
        self.assertIn(("prep_minutes", "greater_than_equal"), errors_for(RecipeIn, recipe_body(prep_minutes=3)))
        self.assertIn(("prep_minutes", "less_than_equal"), errors_for(RecipeIn, recipe_body(prep_minutes=300)))
        self.assertIn(("prep_minutes", "int_from_float"), errors_for(RecipeIn, recipe_body(prep_minutes=20.5)))

    def test_needs_two_ingredients(self):
        body = recipe_body()
        body["ingredients"] = body["ingredients"][:1]
        self.assertIn(("ingredients", "too_short"), errors_for(RecipeIn, body))

    def test_at_most_thirty_ingredients(self):
        ings = [{"name": f"item {i}", "qty": 1, "unit": "pcs", "aisle": "veg"} for i in range(31)]
        self.assertIn(("ingredients", "too_long"), errors_for(RecipeIn, recipe_body(ingredients=ings)))

    def test_quantity_must_be_positive(self):
        body = recipe_body()
        body["ingredients"][1]["qty"] = 0
        self.assertIn(("ingredients.1.qty", "greater_than"), errors_for(RecipeIn, body))

    def test_unknown_unit_and_aisle(self):
        body = recipe_body()
        body["ingredients"][0]["unit"] = "bucket"
        body["ingredients"][1]["aisle"] = "garden"
        errs = errors_for(RecipeIn, body)
        self.assertIn(("ingredients.0.unit", "enum"), errs)
        self.assertIn(("ingredients.1.aisle", "enum"), errs)

    def test_duplicate_ingredient(self):
        body = recipe_body()
        body["ingredients"][1]["name"] = "Red Lentils"
        self.assertIn(("ingredients.1.name", "duplicate_ingredient"), errors_for(RecipeIn, body))

    def test_kid_note_needs_kids_tag(self):
        self.assertIn(("kid_note", "kid_note_needs_kids_tag"),
                      errors_for(RecipeIn, recipe_body(kid_note="sauce on the side")))
        r = RecipeIn.model_validate(recipe_body(tags=["kids"], kid_note="sauce on the side"))
        self.assertEqual(r.kid_note, "sauce on the side")

    def test_method_too_short(self):
        self.assertIn(("method", "string_too_short"), errors_for(RecipeIn, recipe_body(method="Cook it.")))

    def test_unknown_fields_rejected(self):
        self.assertIn(("owner_id", "extra_forbidden"), errors_for(RecipeIn, recipe_body(owner_id="someone")))

    def test_duplicate_tags_removed(self):
        self.assertEqual(RecipeIn.model_validate(recipe_body(tags=["kids", "kids"])).tags, ["kids"])

    def test_error_params_for_translation(self):
        with self.assertRaises(ValidationError) as ctx:
            RecipeIn.model_validate(recipe_body(name="a"))
        err = from_validation_error(ctx.exception)[0]
        self.assertEqual(err["params"], {"min_length": 2})


class PlanValidation(unittest.TestCase):
    def test_week_starts_on_sunday(self):
        PlanRequest(week_start=date(2026, 10, 25))
        self.assertIn(("week_start", "week_must_start_sunday"),
                      errors_for(PlanRequest, {"week_start": "2026-10-26"}))


if __name__ == "__main__":
    unittest.main()
