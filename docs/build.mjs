// Builds privacy.html from the policy text in the app (app/src/screens/Privacy.js), so the
// web page and the app always say the same thing. Run: node docs/build.mjs
import fs from 'node:fs';
const here = new URL('.', import.meta.url);
const src = fs.readFileSync(new URL('../app/src/screens/Privacy.js', here), 'utf8');
const POLICY = eval('(' + src.match(/const POLICY = (\{[\s\S]*?\n\});/)[1] + ')');
const EMAIL = src.match(/CONTACT_EMAIL = '([^']+)'/)[1];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fill = s => esc(s).replace('{email}', `<a href="mailto:${EMAIL}">${EMAIL}</a>`);
const LANGS = [['he', 'עברית', 'rtl'], ['en', 'English', 'ltr'], ['ru', 'Русский', 'ltr']];
const sections = LANGS.map(([code, , dir]) => {
  const p = POLICY[code];
  return `<section id="${code}" lang="${code}" dir="${dir}">
  <h1>${esc(p.title)}</h1>
  <p class="muted">${esc(p.updated)}</p>
  <p>${esc(p.intro)}</p>
${p.sections.map(([t, paras]) => `  <h2>${esc(t)}</h2>\n${paras.map(x => `  <p>${fill(x)}</p>`).join('\n')}`).join('\n')}
</section>`;
}).join('\n<hr>\n');
const html = fs.readFileSync(new URL('page.html', here), 'utf8')
  .replace('{{title}}', 'Weekly Plate · Privacy Policy')
  .replace('{{body}}', `<nav class="langs">${LANGS.map(([c, n]) => `<a href="#${c}">${n}</a>`).join(' · ')}</nav>\n${sections}`);
fs.writeFileSync(new URL('privacy.html', here), html);
console.log('wrote docs/privacy.html');
