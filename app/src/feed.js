// Example posts from the example cooks in data.js (prototype content, not real users).
// kind: 'recipe' links a recipe; 'week' shares the cook's weekly plan.
export const POSTS = [
  { id: 'p1', cook: 'noa', kind: 'recipe', recipe: 'chicken', hours: 2, likes: 128, saves: 14, comments: 12, photo: ['#F3DCCB', '#D9826B'],
    text: { he: 'שלוש תבניות בתנור ויש ארוחות עד יום רביעי. הילדים ביקשו צ׳יפס, אז חתכתי את תפוחי האדמה דק.', en: 'Three trays in the oven and dinner is sorted until Wednesday. The kids asked for fries, so I cut the potatoes thin.', ru: 'Три противня в духовке — и ужины готовы до среды. Дети попросили картошку фри, поэтому нарезала тонко.' } },
  { id: 'p2', cook: 'amit', kind: 'week', hours: 20, likes: 86, saves: 31, comments: 7, photo: ['#E6ECF8', '#8E9BCB'],
    text: { he: 'השבוע של 20 הדקות: אף ערב לא עבר את הזמן. מי מצטרף?', en: 'Our 20-minute week: not one evening went over. Who’s in?', ru: 'Неделя по 20 минут: ни один ужин не вышел за рамки. Кто с нами?' } },
  { id: 'p3', cook: 'yossi', kind: 'recipe', recipe: 'curry', hours: 30, likes: 203, saves: 58, comments: 21, photo: ['#F8EBD3', '#D7A24B'],
    text: { he: 'קארי חומוס ובטטה ב-₪6 למנה. מספיק לשלושה ימים, ועוד יותר טעים למחרת.', en: 'Chickpea and sweet potato curry for ₪6 a serving. Lasts three days and tastes even better the next day.', ru: 'Карри с нутом и бататом за 6 ₪ порция. Хватает на три дня, а на следующий день ещё вкуснее.' } },
  { id: 'p4', cook: 'noa', kind: 'recipe', recipe: 'pie', hours: 52, likes: 97, saves: 22, comments: 9, photo: ['#EAF2EC', '#9BC0A6'],
    text: { he: 'פשטידת זוקיני שהילדים אוכלים בלי לשים לב שיש בה ירק.', en: 'A zucchini bake the kids eat without noticing there are vegetables in it.', ru: 'Запеканка из кабачков, в которой дети даже не замечают овощей.' } },
];
