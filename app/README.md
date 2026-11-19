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

### Google and Apple sign-in inside the app

In Expo Go, Google and Apple open the browser, and Google's page says
"Sign in to xxxx.supabase.co". In a development or store build the app uses the
phone's own sign-in sheet instead, which shows **Weekly Plate**. It's free.

**Google Cloud** (console.cloud.google.com, the project already used for Supabase):

1. Google Auth Platform > Branding: app name **Weekly Plate**, logo, support email.
2. Google Auth Platform > Clients: the existing **Web application** client (the one
   in Supabase) stays. Copy its client ID to `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
3. Create client > **Android**: package name `com.catytati.weeklyplate` and the
   SHA-1 of the key that signs the app. One Android client per key:
   - Build on your computer (`npm run android:build`): run
     `cd android && ./gradlew signingReport` and take SHA1 of the `debug` variant.
   - EAS build: `npx eas credentials` > Android shows the SHA-1.
   - Google Play: Play Console > Test and release > App integrity > App signing key.
4. For iPhone: Create client > **iOS**, bundle ID `com.catytati.weeklyplate`. Put its
   client ID in `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and its "iOS URL scheme"
   (`com.googleusercontent.apps.…`) in `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`.

**Supabase**: Authentication > Providers > Google > **Client IDs**: list the Web client
ID first, then the iOS client ID, separated by commas. For iPhone also turn on
**Skip nonce checks**. (The Android client ID doesn't go here.)

**Apple** (iPhone): in Supabase > Providers > Apple add the bundle ID
`com.catytati.weeklyplate` to Client IDs. The App ID needs "Sign in with Apple",
which EAS sets up on the first build.

**Build and run** (the native sign-in needs its own build, not Expo Go):

```bash
npm install
npm run setup
npm run android:build   # Android Studio or a phone on USB; or: npx eas build -p android --profile development
npx expo start          # later, for code changes: the installed build reloads like Expo Go
```

If the native sheet can't be used (Expo Go, or a client ID is missing) the app falls
back to the browser, so sign-in keeps working.

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
