// The privacy policy, in the app's three languages. Opened from sign-up and from Settings.
// It describes what the app actually does; change it whenever that changes.
import React from 'react';
import { Modal, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { Card, Header, RoundButton, Screen, T } from '../components/ui';

export const PRIVACY_UPDATED = '2026-11-19';
export const CONTACT_EMAIL = 'weeklyplate.app@gmail.com';

// Each section: [title, paragraphs]. {email} is replaced by CONTACT_EMAIL.
const POLICY = {
  he: {
    title: 'מדיניות פרטיות',
    updated: 'עודכן לאחרונה: 19 בנובמבר 2026',
    intro: 'Weekly Plate היא אפליקציה לתכנון ארוחות משפחתיות. כאן מוסבר איזה מידע האפליקציה שומרת, למה, מי רואה אותו ואיך מוחקים אותו.',
    sections: [
      ['איזה מידע נשמר', [
        'חשבון: שם, כתובת מייל ודרך הכניסה (מייל וסיסמה, Google או Apple). הסיסמה נשמרת מוצפנת ואיננו רואים אותה. בכניסה עם Google או Apple אנחנו מקבלים מהם רק שם ומייל.',
        'תוכן שאתם יוצרים: מתכונים, תמונות של מנות, תכנון שבועי, לייקים, תגובות ומי שאתם עוקבים אחריו.',
        'רשימת הקניות וההגדרות (שפה, ערכת צבעים, מספר סועדים והעדפות הבית) נשמרות רק בטלפון שלכם.',
      ]],
      ['מילוי מתכון מצילום מסך או PDF', [
        'כשאתם מבקשים למלא מתכון מצילום מסך או מקובץ PDF, הקובץ נשלח ל-Anthropic (Claude) כדי לקרוא ממנו את המתכון. איננו שומרים את הקובץ. נשמר רק רישום של מספר הפעמים שהשתמשתם בזה ביום, כדי לאכוף את המגבלה היומית.',
        'Anthropic מעבדת את הקובץ לפי התנאים המסחריים שלה ולא משתמשת בו לאימון המודלים שלה.',
      ]],
      ['מי רואה מה', [
        'מתכונים שאתם מוסיפים, עם התמונות שלהם, גלויים למשתמשים אחרים, והם יכולים לשמור עותק שלהם.',
        'בחשבון פרטי, מי שעדיין לא אישרתם כעוקב רואה רק את השם והתמונות שלכם ולא את המתכונים עצמם.',
        'התכנון השבועי שלכם גלוי רק לכם.',
        'השם שלכם מופיע ליד מתכונים ותגובות שלכם וליד מתכונים שאחרים העתיקו מכם.',
      ]],
      ['מי מעבד את המידע עבורנו', [
        'Supabase: מסד הנתונים, הכניסה לחשבון ואחסון התמונות.',
        'Anthropic: קריאת מתכונים מצילומי מסך ו-PDF, רק כשאתם מבקשים.',
        'Google ו-Apple: כניסה לחשבון, אם בחרתם בה.',
        'איננו מוכרים מידע, לא מציגים פרסומות ולא משתמשים בכלי מעקב או אנליטיקה.',
      ]],
      ['מחיקת החשבון', [
        'בהגדרות ← "מחיקת החשבון" נמחקים לתמיד החשבון, המתכונים, התמונות, התכנונים, העוקבים, הלייקים והתגובות שלכם. אי אפשר לבטל מחיקה.',
        'עותקים שמשתמשים אחרים שמרו מהמתכונים הציבוריים שלכם נשארים אצלם.',
        'אפשר גם לבקש מחיקה או עותק של המידע שלכם במייל {email}.',
      ]],
      ['ילדים', [
        'האפליקציה מיועדת למבוגרים שמתכננים ארוחות למשפחה, ואינה מיועדת לילדים מתחת לגיל 13.',
      ]],
      ['אבטחה', [
        'המידע עובר בחיבור מוצפן, וכללי הגישה במסד הנתונים מאפשרים לכל משתמש לשנות רק את המידע שלו.',
      ]],
      ['שינויים ויצירת קשר', [
        'אם המדיניות תשתנה, נעדכן את התאריך למעלה. לשאלות: {email}.',
      ]],
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: November 19, 2026',
    intro: 'Weekly Plate is an app for planning family meals. This explains what the app keeps, why, who sees it and how to delete it.',
    sections: [
      ['What we keep', [
        'Account: your name, email address and how you sign in (email and password, Google or Apple). Passwords are stored hashed and we never see them. With Google or Apple we receive only your name and email.',
        'What you create: recipes, dish photos, weekly plans, likes, comments and who you follow.',
        'Your shopping list and settings (language, theme, number of diners and household preferences) stay only on your phone.',
      ]],
      ['Filling a recipe from a screenshot or PDF', [
        'When you ask to fill a recipe from a screenshot or a PDF, the file is sent to Anthropic (Claude) to read the recipe. We don’t keep the file. We keep only a count of how many times you used it each day, to apply the daily limit.',
        'Anthropic processes the file under its commercial terms and doesn’t use it to train its models.',
      ]],
      ['Who sees what', [
        'Recipes you add, with their photos, are visible to other users, who can save a copy.',
        'With a private account, people you haven’t approved as followers see only your name and photos, not the recipes.',
        'Your weekly plan is visible only to you.',
        'Your name appears next to your recipes and comments, and next to recipes others copied from you.',
      ]],
      ['Who processes data for us', [
        'Supabase: the database, sign-in and photo storage.',
        'Anthropic: reading recipes from screenshots and PDFs, only when you ask.',
        'Google and Apple: sign-in, if you choose it.',
        'We don’t sell data, show ads, or use tracking or analytics tools.',
      ]],
      ['Deleting your account', [
        'Settings → “Delete account” permanently deletes your account, recipes, photos, plans, followers, likes and comments. This can’t be undone.',
        'Copies other users saved of your public recipes stay with them.',
        'You can also ask for deletion or a copy of your data at {email}.',
      ]],
      ['Children', [
        'The app is for adults planning family meals and isn’t meant for children under 13.',
      ]],
      ['Security', [
        'Data travels over an encrypted connection, and the database’s access rules let each user change only their own data.',
      ]],
      ['Changes and contact', [
        'If this policy changes, we’ll update the date above. Questions: {email}.',
      ]],
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Последнее обновление: 19 ноября 2026 г.',
    intro: 'Weekly Plate — приложение для планирования семейного меню. Здесь объясняется, какие данные хранит приложение, зачем, кто их видит и как их удалить.',
    sections: [
      ['Какие данные хранятся', [
        'Аккаунт: имя, адрес почты и способ входа (почта и пароль, Google или Apple). Пароль хранится в зашифрованном виде, и мы его не видим. При входе через Google или Apple мы получаем только имя и почту.',
        'То, что вы создаёте: рецепты, фото блюд, планы на неделю, лайки, комментарии и подписки.',
        'Список покупок и настройки (язык, тема, число едоков и предпочтения семьи) хранятся только в вашем телефоне.',
      ]],
      ['Заполнение рецепта со скриншота или PDF', [
        'Когда вы просите заполнить рецепт со скриншота или PDF, файл отправляется в Anthropic (Claude), чтобы прочитать рецепт. Мы не храним файл. Хранится только число использований за день, чтобы соблюдать дневной лимит.',
        'Anthropic обрабатывает файл по своим коммерческим условиям и не использует его для обучения моделей.',
      ]],
      ['Кто что видит', [
        'Рецепты, которые вы добавляете, вместе с фото видны другим пользователям, и они могут сохранить копию.',
        'В закрытом аккаунте те, кого вы ещё не одобрили как подписчиков, видят только ваше имя и фото, но не сами рецепты.',
        'Ваш план на неделю виден только вам.',
        'Ваше имя видно рядом с вашими рецептами и комментариями и рядом с рецептами, которые у вас скопировали.',
      ]],
      ['Кто обрабатывает данные для нас', [
        'Supabase: база данных, вход в аккаунт и хранение фото.',
        'Anthropic: чтение рецептов со скриншотов и PDF, только по вашему запросу.',
        'Google и Apple: вход в аккаунт, если вы его выбрали.',
        'Мы не продаём данные, не показываем рекламу и не используем трекеры или аналитику.',
      ]],
      ['Удаление аккаунта', [
        'Настройки → «Удалить аккаунт» навсегда удаляет аккаунт, рецепты, фото, планы, подписчиков, лайки и комментарии. Это нельзя отменить.',
        'Копии ваших публичных рецептов, сохранённые другими пользователями, остаются у них.',
        'Также можно попросить удалить данные или прислать их копию по адресу {email}.',
      ]],
      ['Дети', [
        'Приложение предназначено для взрослых, которые планируют семейное меню, и не предназначено для детей младше 13 лет.',
      ]],
      ['Безопасность', [
        'Данные передаются по зашифрованному соединению, а правила доступа в базе данных позволяют каждому менять только свои данные.',
      ]],
      ['Изменения и связь', [
        'Если политика изменится, мы обновим дату вверху. Вопросы: {email}.',
      ]],
    ],
  },
};

export const policyFor = lang => POLICY[lang] || POLICY.en;

/** The policy as a full-screen sheet. */
export default function Privacy({ visible, onClose }) {
  const { state, t } = useStore();
  const p = policyFor(state.lang);
  const fill = s => s.replace('{email}', CONTACT_EMAIL);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
        <Screen>
          <Header menu={false} title={p.title} sub={p.updated} right={<RoundButton icon="close" label={t('close')} onPress={onClose} />} />
          <T>{p.intro}</T>
          {p.sections.map(([title, paras]) => (
            <Card key={title} style={{ gap: 8 }}>
              <T v="heading">{title}</T>
              {paras.map((para, i) => <T key={i} c="muted">{fill(para)}</T>)}
            </Card>
          ))}
          <View style={{ height: 12 }} />
        </Screen>
      </SafeAreaProvider>
    </Modal>
  );
}
