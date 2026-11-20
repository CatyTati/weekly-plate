import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHits } from './lookup.js';

// Shaped like real Open Food Facts results, including one with a broken fat value.
const hits = [
  { code: '1', product_name: 'חומוס', brands: ['צבר'], nutriments: { 'energy-kcal_100g': 215, proteins_100g: 8, carbohydrates_100g: 15, fat_100g: 13.7 } },
  { code: '2', product_name: 'חומוס' },
  { code: '3', product_name: 'חומוס מסעדות', brands: ['סניר'], nutriments: { 'energy-kcal_100g': 253, proteins_100g: 8.7, carbohydrates_100g: 9.6, fat_100g: 1806 } },
  { code: '4', product_name: 'Гречка', nutriments: { 'energy-kj_100g': 1423, proteins_100g: 12.6, carbohydrates_100g: 62.1, fat_100g: 3.3 } },
  { code: '5', product_name: 'Fresh parsley', brands: ['USDA'], nutriments: { 'energy-kcal_100g': 21.6, proteins_100g: 1.8, carbohydrates_100g: 3.8, fat_100g: 0.5 } },
  { code: '6', product_name: 'Wrong', nutriments: { 'energy-kcal_100g': 50, proteins_100g: 20, carbohydrates_100g: 40, fat_100g: 30 } },
  { code: '7', product_name: '', nutriments: { 'energy-kcal_100g': 100 } },
];

test('products from Open Food Facts become values per 100 g', () => {
  const list = parseHits({ hits });
  assert.deepEqual(list.map(p => p.id), ['1', '3', '4', '5']);
  assert.deepEqual(list[0], { id: '1', name: 'חומוס', brand: 'צבר', kcal: 215, protein: 8, carbs: 15, fat: 13.7 });
});

test('a value that cannot be right is left out, not used', () => {
  const sanir = parseHits({ hits })[1];
  assert.equal(sanir.fat, null);
  assert.equal(sanir.kcal, 253);
});

test('calories come from kilojoules when that is all there is', () => {
  assert.equal(parseHits({ hits }).find(p => p.id === '4').kcal, 340);
});

test('empty or broken responses give nothing', () => {
  assert.deepEqual(parseHits(null), []);
  assert.deepEqual(parseHits({}), []);
});
