import test from 'node:test';
import assert from 'node:assert/strict';
import { makeT, planWeek, swapDay, shoppingList, fmtQty, validateRecipe, prepPlan, cost, money, validateSignIn, validateSignUp, greetingKey, timeAgo, firstName } from './logic.js';

const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const t = makeT('en');

// Recipes made up for these tests. Ingredient: [name, qty for 4, unit, aisle, ₪ per unit].
const mk = (id, time, tags, ing, m = 'stove') => ({ id, name: id, time, m, tags, ing, custom: true });
const eggs = ['ביצים', 8, 'יח׳', 'dairy', 1.2];
const onion = ['בצל', 2, 'יח׳', 'veg', 1];
const R = [
  mk('Shakshuka', 20, ['quick', 'budget', 'kids'], [eggs, onion]),
  mk('Omelette', 10, ['quick', 'kids'], [eggs]),
  mk('Pasta', 20, ['quick', 'budget'], [['פסטה', 500, 'גרם', 'pantry', 0.01], onion]),
  mk('Stir-fry', 20, ['quick'], [['חזה עוף', 600, 'גרם', 'meat', 0.04], onion]),
  mk('Quesadilla', 15, ['quick', 'kids'], [['טורטיות', 8, 'יח׳', 'bakery', 1]]),
  mk('Fried rice', 20, ['quick', 'budget'], [['אורז', 400, 'גרם', 'pantry', 0.01], eggs]),
  mk('Drumsticks', 60, ['prep', 'kids'], [['שוקי עוף', 1500, 'גרם', 'meat', 0.03], ['תפוחי אדמה', 1000, 'גרם', 'veg', 0.005]], 'oven'),
  mk('Curry', 30, ['prep', 'budget'], [['חומוס', 500, 'גרם', 'pantry', 0.01], onion]),
  mk('Lentil soup', 40, ['prep', 'budget'], [['עדשים', 400, 'גרם', 'pantry', 0.01], onion]),
];

test('plan has 7 different dishes', () => {
  const p = planWeek(R, { kids: true }, seeded(3));
  assert.equal(p.length, 7);
  assert.equal(new Set(p).size, 7);
});

test('quick mode keeps weeknights at 30 minutes or less', () => {
  for (let s = 1; s < 30; s++) {
    const p = planWeek(R, { quick: true }, seeded(s));
    for (const id of p.slice(0, 5)) assert.ok(R.find(r => r.id === id).time <= 30, `seed ${s}`);
  }
});

test('swap changes only that day', () => {
  const p = planWeek(R, {}, seeded(5));
  const n = swapDay(p, 2, R, {}, seeded(9));
  assert.notEqual(n[2], p[2]);
  assert.deepEqual([...n.slice(0, 2), ...n.slice(3)], [...p.slice(0, 2), ...p.slice(3)]);
});

test('shopping list merges the same ingredient and scales with people', () => {
  const two = R.filter(r => ['Shakshuka', 'Omelette'].includes(r.id));
  const eggs = shoppingList(two, 4).find(i => i.n === 'ביצים');
  assert.equal(eggs.q, 16);
  assert.equal(shoppingList(two, 2).find(i => i.n === 'ביצים').q, 8);
});

test('quantities are rounded and translated', () => {
  assert.equal(fmtQty(1250, 'גרם', 'en'), '1.25 kg');
  assert.equal(fmtQty(2.2, 'יח׳', 'ru'), '3 шт.');
  assert.equal(fmtQty(130, 'גרם', 'he'), '150 גרם');
});

test('cost scales with servings', () => {
  const shak = R.find(r => r.id === 'Shakshuka');
  assert.ok(Math.abs(cost(shak, 8) - 2 * cost(shak, 4)) < 1e-9);
  assert.equal(money(1234.4, 'en'), '₪1,234');
});

const good = { name: 'Rice bowl', time: '20', steps: 'Cook the rice and top it.', tags: { quick: true }, ing: [
  { n: 'rice', q: '400', u: 'גרם', a: 'pantry' }, { n: 'egg', q: '4', u: 'יח׳', a: 'dairy' }] };

test('valid recipe passes', () => {
  const r = validateRecipe(good, R, t);
  assert.equal(r.first, null);
  assert.deepEqual(r.value.tags, ['quick']);
  assert.equal(r.value.ing.length, 2);
});

test('validation catches each rule', () => {
  assert.equal(validateRecipe({ ...good, name: 'x' }, R, t).errors.name, t('eNameShort'));
  assert.equal(validateRecipe({ ...good, name: 'shakshuka' }, R, t).errors.name, t('eNameDup'));
  assert.equal(validateRecipe({ ...good, time: '3' }, R, t).errors.time, t('eTimeRange'));
  assert.equal(validateRecipe({ ...good, time: '20.5' }, R, t).errors.time, t('eTimeRange'));
  assert.equal(validateRecipe({ ...good, steps: 'Cook.' }, R, t).errors.steps, t('eStepsShort'));
  assert.equal(validateRecipe({ ...good, ing: good.ing.slice(0, 1) }, R, t).errors.ing, t('eIngMin'));
  const noQty = validateRecipe({ ...good, ing: [good.ing[0], { ...good.ing[1], q: '' }] }, R, t);
  assert.equal(noQty.errors['ing.1'], t('eIngNoQty', { n: 'egg' }));
  assert.equal(noQty.first, 'ing.1');
});

test('kid note kept only with the kids tag', () => {
  assert.equal(validateRecipe({ ...good, kid: 'mild' }, R, t).value.kid, undefined);
  assert.equal(validateRecipe({ ...good, tags: { kids: true }, kid: 'mild' }, R, t).value.kid, 'mild');
});

test('big cook groups oven and stove dishes', () => {
  const p = prepPlan(R.filter(r => ['Drumsticks', 'Curry', 'Lentil soup'].includes(r.id)), 4);
  assert.deepEqual(p.oven.map(r => r.id), ['Drumsticks']);
  assert.equal(p.stove.length, 2);
  assert.ok(p.chop.length > 0);
});

test('every language has the strings the app uses', () => {
  for (const lang of ['he', 'en', 'ru']) {
    const tt = makeT(lang);
    for (const k of ['app', 'obTitle', 'tab_week', 'eNameReq', 'openPrep', 'withGoogle', 'logout', 'feedEmpty']) assert.notEqual(tt(k), k, `${lang}:${k}`);
  }
});

test('sign in checks email and password', () => {
  assert.deepEqual(validateSignIn({ email: 'a@b.co', password: 'x' }, t), {});
  assert.equal(validateSignIn({ email: 'nope', password: '' }, t).email, t('eEmail'));
  assert.equal(validateSignIn({ email: 'a@b.co', password: '' }, t).password, t('ePassReq'));
});

test('sign up needs name, valid email, 8+ char password and terms', () => {
  const ok = { name: 'Tanya', email: 'tanya@example.com', password: '12345678', terms: true };
  assert.deepEqual(validateSignUp(ok, t), {});
  const e = validateSignUp({ name: ' ', email: 'tanya@', password: '1234', terms: false }, t);
  assert.deepEqual(Object.keys(e).sort(), ['email', 'name', 'password', 'terms']);
  assert.equal(e.password, t('ePass'));
});

test('greeting follows the time of day', () => {
  assert.equal(greetingKey(8), 'goodMorning');
  assert.equal(greetingKey(14), 'goodAfternoon');
  assert.equal(greetingKey(21), 'goodEvening');
});

test('time ago and first name', () => {
  assert.equal(timeAgo(2, t), t('hoursAgo', { n: 2 }));
  assert.equal(timeAgo(30, t), t('yesterday'));
  assert.equal(timeAgo(52, t), t('daysAgo', { n: 2 }));
  assert.equal(firstName({ name: 'Tanya Lukin' }), 'Tanya');
  assert.equal(firstName({ email: 'tanya@example.com' }), 'tanya');
});
