# Weekly Plate – phone app (React Native / Expo)

The design matches the Figma file "Weekly Plate – App Design". Hebrew (right to
left), English and Russian. Data is kept on the phone for now; connecting to
the Python API in `../backend` comes next.

## Run it on your iPhone

1. Install **Expo Go** from the App Store on the iPhone.
2. On the Mac, open Terminal and run:

   ```bash
   cd ~/Documents/GitHub/weekly-plate/app
   npm install
   npm run setup      # matches every package to the installed Expo version (run again after a pull)
   npx expo start
   ```

3. Scan the QR code with the iPhone camera. The app opens in Expo Go.

The Mac and the iPhone must be on the same Wi-Fi. If they can't see each other
(for example on an office network), use `npx expo start --tunnel`.

Node.js is required on the Mac (`node --version`). If it's missing, install the
LTS version from nodejs.org.

## Screens

| Screen | What it does |
| --- | --- |
| Sign in / Sign up | Google, Apple, email and password, password reset, field checks |
| Home | Greeting, cooks you follow, tonight's dinner, week at a glance, shortcuts |
| Week (tab) | Plan for 7 dinners, budget bar, swap a day, open a recipe, big-cook plan |
| Feed (tab) | Posts from cooks you follow: like, save, add a dish to your week, copy a week |
| Shopping (tab) | List built from the week, grouped by aisle, tick items, send by WhatsApp/Share |
| Menu | Side menu with every section, settings, language and log out |
| Settings | Account, language, home preferences, what the home page shows, log out |
| Recipes, Cooks | From the menu: your recipes (add with up to 3 photos), cooks to follow |

Cooks and feed posts are example content until the backend serves real ones.

## Accounts

Without settings the app runs in **demo mode**: sign-in works on the phone only,
so every screen can be tried. To use real accounts with Supabase:

1. In Supabase: Authentication > Providers, turn on **Email**, **Google** and **Apple**
   and paste the client IDs from Google Cloud and Apple Developer.
2. Authentication > URL Configuration > Redirect URLs: add `weeklyplate://**`
   and, for Expo Go, `exp://**`.
3. Copy `.env.example` to `.env` and fill in the project URL and anon key.
4. Restart with `npx expo start --clear`.

## Code

| Path | What it is |
| --- | --- |
| `src/theme.js` | Colors, type and shapes from Figma |
| `src/logic.js` | Planner, shopping list, quantities, validation (tested with `npm test`) |
| `src/data.js` | Built-in recipes and the three languages, shared with the HTML prototype |
| `src/store.js` | App state, saved on the phone |
| `src/auth.js` | Sign in, sign up, log out (Supabase, or demo mode) |
| `src/feed.js`, `src/strings2.js` | Example feed posts; strings for accounts, home, feed and menu |
| `src/components/ui.js` | Buttons, cards, tags, fields, tab bar |
| `src/screens/` | One file per screen |
