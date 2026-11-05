import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalize, indexFoods, matchFood, didYouMean, suggestFoods, gramsOf, nutritionOf, looksTooMuch, foodName } from './nutrition.js';

// The starter foods, read from the same SQL that fills the database.
const sql = readFileSync(new URL('../../backend/supabase/migrations/20261105010000_foods_seed.sql', import.meta.url), 'utf8');
const num = v => (v === 'null' ? null : Number(v));
const foods = [...sql.matchAll(/^\s*\('(.+?)'::jsonb, '(\w+)', ([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+|null), ([\d.]+|null)\)/gm)]
  .map((m, i) => ({ id: 'f' + i, names: JSON.parse(m[1].replace(/''/g, "'")), aisle: m[2], kcal: num(m[3]), protein: num(m[4]), carbs: num(m[5]), fat: num(m[6]), piece_g: num(m[7]), density: num(m[8]) }));
const index = indexFoods(foods);
const en = name => foodName(matchFood(name, index), 'en');

test('every starter food is read from the seed', () => {
  assert.equal(foods.length, 148);
});

test('names match in any language, plural, with extra words', () => {
  assert.equal(en('בצל'), 'onion');
  assert.equal(en('בצלים'), 'onion');
  assert.equal(en('Onions'), 'onion');
  assert.equal(en('лук'), 'onion');
  assert.equal(en('עגבניות'), 'tomato');
  assert.equal(en('עגבנייה'), 'tomato');
  assert.equal(en('2 שיני שום כתושות'), 'garlic');
  assert.equal(en('חזה עוף טרי'), 'chicken breast');
  assert.equal(en('פלפל שחור גרוס'), 'black pepper');
  assert.equal(en('שמנת מתוקה'), 'whipping cream');
  assert.equal(en('שמן זית כתית'), 'olive oil');
  assert.equal(en('olives'), 'olives');
  assert.equal(matchFood('רוטב סודי של סבתא', index), null);
});

test('typos get a suggestion, unrelated words do not', () => {
  assert.equal(foodName(didYouMean('בצעל', index), 'en'), 'onion');
  assert.equal(foodName(didYouMean('onoin', index), 'en'), 'onion');
  assert.equal(didYouMean('זעתר', index), null);
});

test('suggestions while typing come in your language first', () => {
  const he = suggestFoods('בצ', index, 'he').map(f => foodName(f, 'he'));
  assert.ok(he.includes('בצל') && he.includes('בצל סגול'));
  assert.equal(suggestFoods('ב', index, 'he').length, 0);
});

test('amounts become grams by unit', () => {
  const onion = matchFood('בצל', index), oil = matchFood('שמן זית', index), rice = matchFood('אורז', index);
  assert.equal(gramsOf(2, 'יח׳', onion), 220);
  assert.equal(gramsOf(1.5, 'ק״ג', onion), 1500);
  assert.equal(Math.round(gramsOf(2, 'כף', oil)), 28);   // 2 × 15 ml × 0.92
  assert.equal(Math.round(gramsOf(1, 'כוס', rice)), 185); // 240 ml × 0.77
  assert.equal(gramsOf(1, 'כוס', onion), null);           // no density: unknown
});

test('nutrition per serving counts known foods and names the rest', () => {
  // Amounts are for 4 people.
  const recipe = { ing: [['חזה עוף', 800, 'גרם'], ['שמן זית', 2, 'כף'], ['אורז', 400, 'גרם'], ['רוטב סודי', 1, 'כף']] };
  const n = nutritionOf(recipe, row => matchFood(row[0], index));
  // chicken 800 g × 1.2 + oil 27.6 g × 8.84 + rice 400 g × 3.6 = 960 + 244 + 1440 = 2644 → ÷ 4
  assert.equal(Math.round(n.kcal), 661);
  assert.deepEqual(n.missing, ['רוטב סודי']);
  assert.equal(n.counted, 3);
});

test('huge amounts and too much salt look like typos', () => {
  const salt = matchFood('מלח', index), rice = matchFood('אורז', index), water = matchFood('מים', index);
  assert.ok(looksTooMuch(salt, 500));
  assert.ok(!looksTooMuch(salt, 3));
  assert.ok(looksTooMuch(rice, 900));
  assert.ok(!looksTooMuch(rice, 100));
  assert.ok(!looksTooMuch(water, 250));
  assert.equal(normalize('  Ё-Чёрный  перец '), 'е черный перец');
});
