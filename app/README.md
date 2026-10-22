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
   npm run setup      # matches every package to the installed Expo version
   npx expo start
   ```

3. Scan the QR code with the iPhone camera. The app opens in Expo Go.

The Mac and the iPhone must be on the same Wi-Fi. If they can't see each other
(for example on an office network), use `npx expo start --tunnel`.

Node.js is required on the Mac (`node --version`). If it's missing, install the
LTS version from nodejs.org.

## Screens

| Tab | What it does |
| --- | --- |
| Week | Plan for 7 dinners, budget bar, swap a day, open a recipe, big-cook plan |
| Shopping | List built from the week, grouped by aisle, tick items, send by WhatsApp/Share |
| Recipes | Filter and search, add your own recipe with up to 3 photos and field checks |
| Community | Cooks you follow, copy their week into yours (example profiles) |

## Code

| Path | What it is |
| --- | --- |
| `src/theme.js` | Colors, type and shapes from Figma |
| `src/logic.js` | Planner, shopping list, quantities, validation (tested with `npm test`) |
| `src/data.js` | Built-in recipes and the three languages, shared with the HTML prototype |
| `src/store.js` | App state, saved on the phone |
| `src/components/ui.js` | Buttons, cards, tags, fields, tab bar |
| `src/screens/` | One file per screen |
