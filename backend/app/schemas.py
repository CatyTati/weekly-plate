"""Request models and their validation rules.

These rules match the database constraints in supabase/migrations and the
checks in the app's form, so the user sees the same limits everywhere.
Error codes (not translated text) are returned to the app, which shows
the message in the user's language.
"""
from __future__ import annotations

from datetime import date
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator
from pydantic_core import PydanticCustomError


class Tag(StrEnum):
    kids = "kids"
    budget = "budget"
    quick = "quick"
    prep = "prep"


class Unit(StrEnum):
    pcs = "pcs"
    g = "g"
    kg = "kg"
    ml = "ml"
    cup = "cup"
    tbsp = "tbsp"
    tsp = "tsp"
    can = "can"
    bag = "bag"
    head = "head"
    loaf = "loaf"


class Aisle(StrEnum):
    veg = "veg"
    dairy = "dairy"
    meat = "meat"
    bread = "bread"
    frozen = "frozen"
    pantry = "pantry"


class Lang(StrEnum):
    he = "he"
    en = "en"
    ru = "ru"


def _text(min_len: int, max_len: int):
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=min_len, max_length=max_len)]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class IngredientIn(Strict):
    name: _text(1, 40)
    qty: float = Field(gt=0, le=100_000)
    unit: Unit
    aisle: Aisle


class RecipeIn(Strict):
    name: _text(2, 60)
    lang: Lang = Lang.he
    prep_minutes: int = Field(ge=5, le=240)
    tags: list[Tag] = Field(default_factory=list)
    kid_note: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] | None = None
    ingredients: list[IngredientIn] = Field(min_length=2, max_length=30)
    method: _text(15, 3000)
    cook_method: Literal["stove", "oven"] = "stove"
    keeps_days: int | None = Field(default=None, ge=0, le=14)
    is_public: bool = False

    @field_validator("tags")
    @classmethod
    def _unique_tags(cls, tags: list[Tag]) -> list[Tag]:
        return list(dict.fromkeys(tags))

    @model_validator(mode="after")
    def _cross_field_rules(self) -> "RecipeIn":
        if self.kid_note == "":
            self.kid_note = None
        if self.kid_note and Tag.kids not in self.tags:
            raise PydanticCustomError(
                "kid_note_needs_kids_tag",
                "A note for kids needs the kid-friendly tag",
                {"field": "kid_note"},
            )
        seen: dict[str, int] = {}
        for i, ing in enumerate(self.ingredients):
            key = ing.name.casefold()
            if key in seen:
                raise PydanticCustomError(
                    "duplicate_ingredient",
                    "The same ingredient appears twice",
                    {"field": f"ingredients.{i}.name", "first": seen[key]},
                )
            seen[key] = i
        if Tag.prep in self.tags and self.keeps_days is None:
            self.keeps_days = 3
        return self


class PlanRequest(Strict):
    week_start: date
    modes: list[Tag] = Field(default_factory=list)
    seed: int | None = Field(default=None, description="Only for repeatable tests")

    @field_validator("week_start")
    @classmethod
    def _sunday(cls, d: date) -> date:
        if d.isoweekday() != 7:
            raise PydanticCustomError("week_must_start_sunday", "A week starts on Sunday")
        return d


class ProfileUpdate(Strict):
    display_name: _text(1, 40) | None = None
    lang: Lang | None = None
    modes: list[Tag] | None = None
    servings: int | None = Field(default=None, ge=1, le=12)
    weekly_budget: float | None = Field(default=None, ge=0, le=100_000)
