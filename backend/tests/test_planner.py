import random
import unittest

from app.services.planner import plan_week, swap_day


def r(rid, minutes, tags=(), cost=None):
    return {"id": rid, "prep_minutes": minutes, "tags": list(tags), "cost_per_serving": cost}


RECIPES = [
    r("shakshuka", 20, ["quick", "budget", "kids"], 8),
    r("omelette", 10, ["quick", "kids"], 7),
    r("stir-fry", 20, ["quick"], 18),
    r("quesadilla", 15, ["quick", "kids"], 9),
    r("fried-rice", 20, ["quick", "budget"], 6),
    r("roast-chicken", 60, ["prep", "kids"], 14),
    r("chili", 45, ["prep", "budget"], 11),
    r("soup", 40, ["prep", "budget"], 5),
    r("salmon", 25, ["quick"], 25),
]


class Planner(unittest.TestCase):
    def test_seven_days_no_repeats(self):
        plan = plan_week(RECIPES, ["kids"], random.Random(1))
        self.assertEqual(len(plan), 7)
        self.assertEqual(len(set(plan)), 7)

    def test_quick_mode_keeps_weeknights_short(self):
        for seed in range(20):
            plan = plan_week(RECIPES, ["quick"], random.Random(seed))
            minutes = {x["id"]: x["prep_minutes"] for x in RECIPES}
            self.assertTrue(all(minutes[d] <= 30 for d in plan[:5]), (seed, plan))

    def test_same_seed_same_week(self):
        self.assertEqual(plan_week(RECIPES, ["budget"], random.Random(7)),
                         plan_week(RECIPES, ["budget"], random.Random(7)))

    def test_not_enough_recipes_leaves_days_empty(self):
        plan = plan_week(RECIPES[:3], [], random.Random(0))
        self.assertEqual(plan[3:], [None] * 4)

    def test_unknown_cost_is_never_counted_as_cheap(self):
        recipes = [r("mystery", 20, [], None), r("cheap", 20, [], 5)]
        for seed in range(20):
            self.assertEqual(plan_week(recipes, ["budget"], random.Random(seed))[0], "cheap")

    def test_swap_day_picks_unused_recipe(self):
        plan = plan_week(RECIPES, [], random.Random(3))
        new = swap_day(plan, 2, RECIPES, [], random.Random(3))
        self.assertNotEqual(new[2], plan[2])
        self.assertNotIn(new[2], plan)
        self.assertEqual(new[:2] + new[3:], plan[:2] + plan[3:])


if __name__ == "__main__":
    unittest.main()
