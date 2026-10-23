import test from 'node:test';
import assert from 'node:assert/strict';
import { R, makeT, planWeek, swapDay, shoppingList, fmtQty, validateRecipe, prepPlan, cost, money, validateSignIn, validateSignUp, greetingKey, timeAgo, feedFor, firstName } from './logic.js';

const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const t = makeT('en');

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
  const two = R.filter(r => ['shak', 'omelet'].includes(r.id));
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
  const shak = R.find(r => r.id === 'shak');
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
  assert.equal(validateRecipe({ ...good, name: 'Shakshuka with bread' }, R, t).errors.name, t('eNameDup'));
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
  const p = prepPlan(R.filter(r => ['chicken', 'curry', 'soup'].includes(r.id)), 4);
  assert.deepEqual(p.oven.map(r => r.id), ['chicken']);
  assert.equal(p.stove.length, 2);
  assert.ok(p.chop.length > 0);
});

test('every language has the strings the app uses', () => {
  for (const lang of ['he', 'en', 'ru']) {
    const tt = makeT(lang);
    for (const k of ['app', 'obTitle', 'tab_week', 'eNameReq', 'copyPlan', 'openPrep', 'withGoogle', 'logout', 'feedEmpty', 'show_stories']) assert.notEqual(tt(k), k, `${lang}:${k}`);
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

test('feed shows only followed cooks, newest first', () => {
  const f = feedFor(['noa', 'yossi']);
  assert.ok(f.length > 0 && f.every(p => ['noa', 'yossi'].includes(p.cook)));
  assert.deepEqual(f.map(p => p.hours), [...f.map(p => p.hours)].sort((a, b) => a - b));
  assert.ok(feedFor(['noa'], 'noa').every(p => p.cook === 'noa'));
  assert.deepEqual(feedFor([]), []);
});

test('time ago and first name', () => {
  assert.equal(timeAgo(2, t), t('hoursAgo', { n: 2 }));
  assert.equal(timeAgo(30, t), t('yesterday'));
  assert.equal(timeAgo(52, t), t('daysAgo', { n: 2 }));
  assert.equal(firstName({ name: 'Tanya Lukin' }), 'Tanya');
  assert.equal(firstName({ email: 'tanya@example.com' }), 'tanya');
});

test('every feed post points to a real cook and recipe', async () => {
  const { POSTS, COOKS } = await import('./logic.js');
  for (const p of POSTS) {
    assert.ok(COOKS.some(c => c.id === p.cook), p.id);
    if (p.kind === 'recipe') assert.ok(R.some(r => r.id === p.recipe), p.id);
    for (const l of ['he', 'en', 'ru']) assert.ok(p.text[l], p.id + l);
  }
});
