// Figma Plugin API script (run with the Figma MCP use_figma tool on file b8Z3RUObkz9gvbho2rLGmX).
// Builds the account, home, feed, menu, settings and big-cook screens in one language.
// Set LANG, ONLY (null = all screens), SECTION_ID (null = new section below the last one) and START (first slot).
const LANG = '__LANG__'; const ONLY = __ONLY__; const SECTION_ID = __SECTION__; const START = __START__;
const rtl = LANG === 'he', A = rtl ? 'RIGHT' : 'LEFT', E = rtl ? 'LEFT' : 'RIGHT';
const V = {bg:"VariableID:2:4",surface:"VariableID:2:5",ink:"VariableID:2:6",muted:"VariableID:2:7",line:"VariableID:2:8",accent:"VariableID:2:9",onAccent:"VariableID:2:10",accentSoft:"VariableID:2:11",kids:"VariableID:2:12",kidsSoft:"VariableID:2:13",budget:"VariableID:2:14",budgetSoft:"VariableID:2:15",quick:"VariableID:2:16",quickSoft:"VariableID:2:17",error:"VariableID:2:18",errorSoft:"VariableID:2:19"};
const T = {Display:"S:2c2ebf0e692ebf7b67c5b578b244d730001beeb0,",Title:"S:e2c036a34f3cdf5f4d760374cf2b74474a44d76f,",Heading:"S:ee1e961ac6c8321ae6990798aa30f9e627645e25,",Body:"S:26ad2673b96b0a104358611df00d427082aba933,",BodyStrong:"S:5f33ab2283d623e17bc59633e4bd9a8cec46ee59,",Caption:"S:fa43a74db8d308a73918b40de02d18fae9a1ec68,",Label:"S:e9e076a89ab6372205e4f8f8e4d41e1160463ed9,"};
const SOFT = "S:f8aa5a96306c733800d78e3c510ee6427e831bea,";
const S = {
 he: { appName:'צלחת השבוע', tagline:'שבוע של ארוחות ערב, בלי לחשוב מה לבשל', google:'המשך עם Google', apple:'המשך עם Apple', orEmail:'או עם אימייל', email:'אימייל', password:'סיסמה', forgot:'שכחתי סיסמה', signIn:'כניסה', noAccount:'אין לכם חשבון?', signUp:'הרשמה',
   create:'יצירת חשבון', createSub:'30 שניות ומתחילים לתכנן', googleUp:'הרשמה עם Google', or:'או', name:'שם', nameVal:'טניה', ePass:'הסיסמה צריכה לפחות 8 תווים.', terms:'אני מסכימה לתנאי השימוש ולמדיניות הפרטיות',
   hello:'ערב טוב, טניה', helloSub:'יום שלישי · 4 סועדים · נשארו ₪138 השבוע', cooks:[['נ','נועה','kids','kidsSoft'],['ע','עמית ודנה','quick','quickSoft'],['י','יוסי','budget','budgetSoft']], more:'עוד בשלנים',
   tonight:'הערב', dish:'שקשוקה עם לחם', dishSub:'20 דק׳ · ₪34 · לילדים: ביצה עין בצד', view:'לצפייה במתכון', days:['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'],
   big:'הבישול הגדול', bigSub:'4 מנות · כ-3 שעות', list:'רשימת קניות', listSub:'9 פריטים נשארו',
   feed:'פיד', noa:'נועה ב.', noaSub:'לפני שעתיים · הבישול של יום ראשון', addWeek:'הוספה לשבוע', likes:'128 אהבו · 14 שמרו', caption:'שוקי עוף בתנור עם תפוחי אדמה. שלוש תבניות בתנור ויש ארוחות עד יום רביעי 🙌', comments:'לכל 12 התגובות', amit:'עמית ודנה', amitSub:'שיתפו שבוע שלם · אתמול',
   user:'טניה לוקין', letter:'ט', items:[['home','בית'],['week','השבוע'],['feed','פיד'],['shop','רשימת קניות'],['pot','הבישול הגדול'],['book','המתכונים שלי'],['users','בשלנים לעקוב']], newPosts:'3 חדשים', settings:'הגדרות והעדפות', language:'שפה', langName:'עברית', logout:'התנתקות',
   account:'חשבון', signedWith:'מחובר/ת עם Google', home:'הבית שלי', modes:[['ילדים בררנים',true],['תקציב נמוך',false],['מבשלים פעם בשבוע',false],['20 דקות בערב',true]], diners:'סועדים', budget:'תקציב שבועי לארוחות ערב (₪)', homeShows:'מה מופיע בדף הבית', shows:['בשלנים שאתם עוקבים','הארוחה של הערב','השבוע במבט','קיצורי דרך'],
   prepTitle:'הבישול הגדול', prepSub:'מנות לבישול ביום ראשון: 4 · כ-3 שעות', steps:[['חותכים הכל בבת אחת','',['בצל: 3','תפוחי אדמה: 1.5 ק״ג','בטטה: 2']],['מכניסים לתנור קודם','התנור עובד לבד בזמן שמבשלים על הכיריים',['שוקי עוף בתנור עם תפוחי אדמה (60 דק׳)']],['על הכיריים, בזו אחר זו','',['קציצות עוף ברוטב עגבניות (45 דק׳)','קארי חומוס ובטטה (30 דק׳)','מרק עדשים כתומות (40 דק׳)']],['מקררים ומחלקים לקופסאות','',['שוקי עוף בתנור: עד 4 ימים במקרר · מתאים להקפאה','קציצות עוף: עד 4 ימים במקרר · מתאים להקפאה','קארי חומוס ובטטה: עד 4 ימים במקרר · מתאים להקפאה','מרק עדשים: עד 5 ימים במקרר · מתאים להקפאה']]],
   tabs:{home:'בית',week:'השבוע',feed:'פיד',shop:'קניות'}, sectionTitle:'Weekly Plate · חשבון, בית, פיד ותפריט', sfx:'' },
 en: { appName:'Weekly Plate', tagline:'A week of dinners, without wondering what to cook', google:'Continue with Google', apple:'Continue with Apple', orEmail:'or with email', email:'Email', password:'Password', forgot:'Forgot password', signIn:'Sign in', noAccount:'No account yet?', signUp:'Sign up',
   create:'Create account', createSub:'30 seconds and you’re planning', googleUp:'Sign up with Google', or:'or', name:'Name', nameVal:'Tanya', ePass:'The password needs at least 8 characters.', terms:'I agree to the Terms of Use and the Privacy Policy',
   hello:'Good evening, Tanya', helloSub:'Tuesday · 4 people · ₪138 left this week', cooks:[['N','Noa','kids','kidsSoft'],['A','Amit & Dana','quick','quickSoft'],['Y','Yossi','budget','budgetSoft']], more:'More cooks',
   tonight:'Tonight', dish:'Shakshuka with bread', dishSub:'20 min · ₪34 · For kids: fried egg on the side', view:'View recipe', days:['S','M','T','W','T','F','S'],
   big:'Big cook', bigSub:'4 dishes · about 3 hours', list:'Shopping list', listSub:'9 items left',
   feed:'Feed', noa:'Noa B.', noaSub:'2 hours ago · Sunday big cook', addWeek:'Add to week', likes:'128 likes · 14 saves', caption:'Roast chicken drumsticks with potatoes. Three trays in the oven and dinners until Wednesday 🙌', comments:'See all 12 comments', amit:'Amit & Dana', amitSub:'Shared a full week · yesterday',
   user:'Tanya Lukin', letter:'T', items:[['home','Home'],['week','This week'],['feed','Feed'],['shop','Shopping list'],['pot','Big cook'],['book','My recipes'],['users','Cooks to follow']], newPosts:'3 new', settings:'Settings', language:'Language', langName:'English', logout:'Log out',
   account:'Account', signedWith:'Signed in with Google', home:'My home', modes:[['Picky kids',true],['Tight budget',false],['Cook once a week',false],['20 minutes a night',true]], diners:'People', budget:'Weekly dinner budget (₪)', homeShows:'Show on the home page', shows:['Cooks you follow','Tonight’s dinner','Week at a glance','Shortcuts'],
   prepTitle:'Big cook', prepSub:'Dishes to cook on Sunday: 4 · about 3 hours', steps:[['Chop everything at once','',['Onion: 3','Potatoes: 1.5 kg','Sweet potato: 2']],['Oven dishes go in first','The oven works on its own while you cook on the stove',['Roast chicken drumsticks with potatoes (60 min)']],['On the stove, one after another','',['Chicken meatballs in tomato sauce (45 min)','Chickpea and sweet potato curry (30 min)','Red lentil soup (40 min)']],['Cool and pack into containers','',['Chicken drumsticks: up to 4 days in the fridge · freezer-friendly','Chicken meatballs: up to 4 days in the fridge · freezer-friendly','Chickpea curry: up to 4 days in the fridge · freezer-friendly','Lentil soup: up to 5 days in the fridge · freezer-friendly']]],
   tabs:{home:'Home',week:'Week',feed:'Feed',shop:'Shopping'}, sectionTitle:'Weekly Plate · Account, home, feed and menu (English)', sfx:' · EN' } }[LANG];
await Promise.all(['Light','Regular','Medium','SemiBold','Bold'].map(s=>figma.loadFontAsync({family:'Rubik',style:s})));
const vars = {}; await Promise.all(Object.entries(V).map(async([k,id])=>vars[k]=await figma.variables.getVariableByIdAsync(id)));
const paint = k => figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',vars[k]);
const hex = h => { const n = parseInt(h.slice(1),16); return { r:((n>>16)&255)/255, g:((n>>8)&255)/255, b:(n&255)/255 }; };
const txt = (s, style, c='ink', align=A) => { const t = figma.createText(); t.textStyleId = T[style]; t.characters = s; t.fills=[paint(c)]; t.textAlignHorizontal = align; return t; };
const [btnSet, tagSet] = await Promise.all(['3:7','3:16'].map(id=>figma.getNodeByIdAsync(id)));
const labelKey = Object.keys(btnSet.componentPropertyDefinitions).find(k=>k.startsWith('Label'));
const btn = (label, type='Primary') => { const b = btnSet.children.find(c=>c.name===`Type=${type}`).createInstance(); b.setProperties({[labelKey]:label}); return b; };
const tag = k => tagSet.children.find(c=>c.name===`Kind=${k}`).createInstance();
const fill = (p, c) => { p.appendChild(c); c.layoutSizingHorizontal = 'FILL'; return c; };
const col = (o={}) => { const f = figma.createAutoLayout('VERTICAL', {itemSpacing:12, ...o}); f.fills=[]; f.counterAxisAlignItems = rtl ? 'MAX' : 'MIN'; return f; };
const row = (o={}) => { const f = figma.createAutoLayout('HORIZONTAL', {itemSpacing:8, ...o}); f.fills=[]; f.counterAxisAlignItems='CENTER'; return f; };
// put children in reading order: start side first (right in Hebrew, left in English). [node, true] = fill width
const R = (r, items) => { const list = rtl ? [...items].reverse() : items; for (const it of list) { if (Array.isArray(it)) fill(r, it[0]); else r.appendChild(it); } return r; };
const startAlign = r => { r.primaryAxisAlignItems = rtl ? 'MAX' : 'MIN'; return r; };
const card = (o={}) => { const c = col({paddingLeft:16,paddingRight:16,paddingTop:16,paddingBottom:16,cornerRadius:22,...o}); c.fills=[paint('surface')]; c.effectStyleId = SOFT; return c; };
const ICON = {
 menu:'<path d="M4 7h16M4 12h16M4 17h10"/>', home:'<path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10"/>', week:'<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 feed:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>', shop:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
 pot:'<path d="M3 11h18M5 11v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6M9 7c0-1 .5-2 1.5-2M14 7c0-1 .5-2 1.5-2"/>', book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5"/>',
 users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>', chat:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4.5A8.4 8.4 0 1 1 21 11.5z"/>',
 save:'<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>', more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/>', lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 check:'<path d="M20 6 9 17l-5-5"/>', close:'<path d="M18 6 6 18M6 6l12 12"/>', chevron:'<path d="m15 18-6-6 6-6"/>'
};
const icon = (name, c='ink', size=22, sw=1.9) => { const n = figma.createNodeFromSvg(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="#000" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</g></svg>`); n.name='icon/'+name; n.fills=[]; for (const v of n.findAllWithCriteria({types:['VECTOR','ELLIPSE','RECTANGLE']})) { if (v.strokes.length) v.strokes=[paint(c)]; v.fills=[]; } n.resize(size,size); return n; };
const round = (ic, c='ink', bg='surface', size=40) => { const b = figma.createAutoLayout({name:'Button/'+ic}); b.resize(size,size); b.primaryAxisSizingMode='FIXED'; b.counterAxisSizingMode='FIXED'; b.primaryAxisAlignItems='CENTER'; b.counterAxisAlignItems='CENTER'; b.cornerRadius=size/2; b.fills=[paint(bg)]; if (bg==='surface') b.effectStyleId=SOFT; b.appendChild(icon(ic,c,size*0.5)); return b; };
const back = () => { const b = round('chevron','ink','surface'); b.name='Button/back'; if (rtl) b.rotation = 180; return b; };
const avatar = (letter, fg, bg, size=44, ring=false) => { const a = figma.createAutoLayout({name:'Avatar'}); a.resize(size,size); a.primaryAxisSizingMode='FIXED'; a.counterAxisSizingMode='FIXED'; a.primaryAxisAlignItems='CENTER'; a.counterAxisAlignItems='CENTER'; a.cornerRadius=size/2; a.fills=[paint(bg)];
  if (ring) { a.strokes=[{type:'GRADIENT_LINEAR',gradientTransform:[[1,0,0],[0,1,0]],gradientStops:[{position:0,color:{...hex('#E7A1B9'),a:1}},{position:1,color:{...hex('#8DBB9D'),a:1}}]}]; a.strokeWeight=2.5; a.strokeAlign='OUTSIDE'; }
  a.appendChild(txt(letter, size>50?'Title':'Heading', fg, 'CENTER')); return a; };
const plate = (w, h, bgHex='#F6E3DA', sauce='#E59A86', r=24) => { const p = figma.createFrame(); p.name='Photo'; p.resize(w,h); p.cornerRadius=r; p.fills=[{type:'SOLID',color:hex(bgHex)}]; p.clipsContent=true;
  const d = Math.min(w,h)*0.68, pl = figma.createEllipse(); pl.resize(d,d); pl.fills=[{type:'SOLID',color:{r:1,g:1,b:1}}]; pl.effects=[{type:'DROP_SHADOW',color:{r:0.6,g:0.35,b:0.3,a:0.15},offset:{x:0,y:8},radius:20,spread:0,visible:true,blendMode:'NORMAL'}]; p.appendChild(pl); pl.x=(w-d)/2; pl.y=(h-d)/2;
  const s = figma.createEllipse(); s.resize(d*0.72,d*0.72); s.fills=[{type:'SOLID',color:hex(sauce)}]; p.appendChild(s); s.x=(w-d*0.72)/2; s.y=(h-d*0.72)/2; return p; };
const field = (label, value, ic, err) => { const f = col({name:'Field',itemSpacing:6}); fill(f, txt(label,'Label','muted'));
  const box = row({name:'Input',paddingLeft:14,paddingRight:14,paddingTop:13,paddingBottom:13,itemSpacing:10,cornerRadius:14}); box.fills=[paint(err?'errorSoft':'surface')]; box.strokes=[paint(err?'error':'line')]; box.strokeWeight=err?1.5:1;
  const items = []; if (ic) items.push(icon(ic,'muted',18)); items.push([txt(value,'Body','ink')]); if (ic==='lock') items.push(icon('eye','muted',18)); R(box, items); fill(f, box);
  if (err) fill(f, txt(err,'Caption','error')); return f; };
const APPLE = '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.8-4.1zM13.8 4.9c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z"/></svg>';
const GOOGLE = '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>';
const socialBtn = (label, kind) => { const b = row({name:'Button/'+kind,paddingTop:14,paddingBottom:14,paddingLeft:20,paddingRight:20,itemSpacing:10,cornerRadius:999}); b.primaryAxisAlignItems='CENTER';
  const logo = figma.createNodeFromSvg(kind==='apple'?APPLE:GOOGLE); logo.name='logo/'+kind;
  if (kind==='apple') b.fills=[paint('ink')]; else { b.fills=[paint('surface')]; b.effectStyleId=SOFT; }
  R(b, [logo, txt(label,'BodyStrong',kind==='apple'?'surface':'ink','CENTER')]); return b; };
const orRow = (label) => { const or = row({name:'Or',itemSpacing:12}); const l1 = figma.createRectangle(); l1.resize(100,1); l1.fills=[paint('line')]; const l2 = l1.clone(); fill(or,l1); or.appendChild(txt(label,'Caption','muted','CENTER')); fill(or,l2); return or; };
const tabbar = (active) => { const bar = row({name:'Tab bar',paddingTop:10,paddingBottom:28,itemSpacing:0,topLeftRadius:24,topRightRadius:24}); bar.fills=[paint('surface')]; bar.effects=[{type:'DROP_SHADOW',color:{r:0.36,g:0.28,b:0.36,a:0.08},offset:{x:0,y:-4},radius:20,spread:0,visible:true,blendMode:'NORMAL'}];
  const items = ['home','week','feed','shop'].map(k => { const on = k===active; const it = figma.createAutoLayout('VERTICAL',{name:'tab/'+k,itemSpacing:3}); it.fills=[]; it.counterAxisAlignItems='CENTER'; it.appendChild(icon(k,on?'accent':'muted',24,on?2.2:1.8)); it.appendChild(txt(S.tabs[k],'Label',on?'accent':'muted','CENTER')); return [it]; });
  return R(bar, items); };

// section
let sec;
if (SECTION_ID) sec = await figma.getNodeByIdAsync(SECTION_ID);
else { const secs = figma.currentPage.children.filter(n=>n.type==='SECTION'); const last = secs.reduce((a,b)=> (b.y+b.height > a.y+a.height ? b : a)); sec = figma.createSection(); sec.name='Screens · New · '+(rtl?'עברית':'English'); sec.x = 720; sec.y = last.y + last.height + 120; sec.fills=[{type:'SOLID',color:hex('#EFEAEC')}]; }
const screens = [];
let slot = START;
const screen = (name, padTop=12, h=844) => { const s = figma.createFrame(); s.name=name+S.sfx; s.resize(390,h); s.fills=[paint('bg')]; s.clipsContent=true; s.cornerRadius=32; s.layoutMode='VERTICAL'; s.primaryAxisSizingMode='FIXED'; s.counterAxisSizingMode='FIXED'; s.itemSpacing=0; sec.appendChild(s); s.x=80+slot*470; s.y=120; slot++;
  for (const [x,y,w,c] of [[rtl?200:-110,-120,300,'#F9DDE5'],[rtl?-120:230,-60,280,'#DCEDE1']]) { const e = figma.createEllipse(); e.name='Glow'; e.resize(w,w); e.fills=[{type:'SOLID',color:hex(c),opacity:0.9}]; e.effects=[{type:'LAYER_BLUR',radius:70,visible:true}]; s.appendChild(e); e.layoutPositioning='ABSOLUTE'; e.x=x; e.y=y; e.locked=true; }
  const st = row({name:'Status bar',paddingLeft:28,paddingRight:28,paddingTop:16,paddingBottom:8}); st.primaryAxisAlignItems='SPACE_BETWEEN'; st.appendChild(txt('9:41','Label','ink','LEFT')); st.appendChild(txt('●●●','Label','ink','RIGHT')); fill(s,st);
  const body = col({name:'Content',paddingLeft:24,paddingRight:24,paddingTop:padTop,paddingBottom:24,itemSpacing:16}); fill(s,body); body.layoutSizingVertical='FILL'; screens.push(s); return {s, body}; };
const spacer = p => { const sp = figma.createAutoLayout('VERTICAL',{name:'Spacer'}); sp.fills=[]; fill(p, sp); sp.layoutSizingVertical='FILL'; return sp; };
const hspacer = () => { const sp = figma.createAutoLayout({name:'Spacer'}); sp.fills=[]; return [sp]; };
const want = k => !ONLY || ONLY.includes(k);

if (want('signin')) { const {body} = screen('07 · Sign in', 40); body.itemSpacing = 14;
  const logo = figma.createAutoLayout('VERTICAL',{name:'Logo',itemSpacing:10}); logo.fills=[]; logo.counterAxisAlignItems='CENTER';
  logo.appendChild(plate(88,88,'#EAF2EC','#8DBB9D',28)); fill(logo, txt(S.appName,'Display','ink','CENTER')); fill(logo, txt(S.tagline,'Body','muted','CENTER')); fill(body, logo);
  const g = col({name:'Social',itemSpacing:10,paddingTop:12}); fill(g, socialBtn(S.google,'google')); fill(g, socialBtn(S.apple,'apple')); fill(body, g);
  fill(body, orRow(S.orEmail)); fill(body, field(S.email,'tanya@example.com','mail')); fill(body, field(S.password,'••••••••','lock'));
  fill(body, txt(S.forgot,'BodyStrong','accent',E)); fill(body, btn(S.signIn)); spacer(body);
  const sw = row({name:'Switch',itemSpacing:6}); sw.primaryAxisAlignItems='CENTER'; R(sw, [txt(S.noAccount,'Body','muted','CENTER'), txt(S.signUp,'BodyStrong','accent','CENTER')]); fill(body, sw);
}
if (want('signup')) { const {body} = screen('08 · Sign up', 8); body.itemSpacing = 14;
  const nav = startAlign(row({name:'Nav'})); nav.appendChild(back()); fill(body, nav);
  const h = col({itemSpacing:4}); fill(h, txt(S.create,'Display')); fill(h, txt(S.createSub,'Body','muted')); fill(body, h);
  fill(body, socialBtn(S.googleUp,'google')); fill(body, orRow(S.or));
  fill(body, field(S.name,S.nameVal,'user')); fill(body, field(S.email,'tanya@example.com','mail')); fill(body, field(S.password,'•••••','lock', S.ePass));
  const terms = row({name:'Terms',itemSpacing:10}); terms.counterAxisAlignItems='MIN';
  const box = figma.createAutoLayout({name:'Check'}); box.resize(22,22); box.primaryAxisSizingMode='FIXED'; box.counterAxisSizingMode='FIXED'; box.primaryAxisAlignItems='CENTER'; box.counterAxisAlignItems='CENTER'; box.cornerRadius=8; box.fills=[paint('accent')]; box.appendChild(icon('check','onAccent',14,3));
  R(terms, [box, [txt(S.terms,'Caption','muted')]]); fill(body, terms);
  spacer(body); fill(body, btn(S.create));
}
if (want('home')) { const {s, body} = screen('09 · Home', 8); body.itemSpacing = 16;
  const top = row({name:'Top bar'}); top.primaryAxisAlignItems='SPACE_BETWEEN'; R(top, [round('menu','ink','surface'), avatar(S.letter,'kids','kidsSoft',40)]); fill(body, top);
  const g = col({itemSpacing:2}); fill(g, txt(S.hello,'Display')); fill(g, txt(S.helloSub,'Caption','muted')); fill(body, g);
  const stories = startAlign(row({name:'Stories',itemSpacing:14})); const st = [];
  for (const [l,n,fg,bg] of S.cooks) { const c = figma.createAutoLayout('VERTICAL',{itemSpacing:6}); c.fills=[]; c.counterAxisAlignItems='CENTER'; c.appendChild(avatar(l,fg,bg,56,true)); c.appendChild(txt(n,'Label','ink','CENTER')); st.push(c); }
  const add = figma.createAutoLayout('VERTICAL',{itemSpacing:6}); add.fills=[]; add.counterAxisAlignItems='CENTER'; add.appendChild(round('plus','accent','accentSoft',56)); add.appendChild(txt(S.more,'Label','muted','CENTER')); st.push(add);
  R(stories, st); fill(body, stories);
  const tonight = card({name:'Tonight',itemSpacing:12,paddingTop:12});
  fill(tonight, plate(310,130,'#F6E3DA','#E59A86',18)).layoutSizingVertical='FIXED';
  const tt = row({itemSpacing:8}); tt.primaryAxisAlignItems='SPACE_BETWEEN'; R(tt, [txt(S.tonight,'Label','accent'), tag('Quick')]); fill(tonight, tt);
  fill(tonight, txt(S.dish,'Title')); fill(tonight, txt(S.dishSub,'Caption','muted')); fill(tonight, btn(S.view,'Secondary')); fill(body, tonight);
  const strip = row({name:'Week strip',itemSpacing:6}); const cells = [];
  S.days.forEach((d,i) => { const on = i===2, done = i<2; const c = figma.createAutoLayout('VERTICAL',{itemSpacing:4,paddingTop:10,paddingBottom:10,cornerRadius:16}); c.counterAxisAlignItems='CENTER'; c.fills=[paint(on?'accent':'surface')]; if(!on) c.effectStyleId=SOFT; c.appendChild(txt(d,'BodyStrong',on?'onAccent':'ink','CENTER')); const dot = figma.createEllipse(); dot.resize(6,6); dot.fills=[paint(done?'accent':on?'onAccent':'line')]; c.appendChild(dot); cells.push([c]); });
  R(strip, cells); fill(body, strip);
  const sc = row({name:'Shortcuts',itemSpacing:10}); const cs = [];
  for (const [ic,title,sub,fg,bg] of [['pot',S.big,S.bigSub,'accent','accentSoft'],['shop',S.list,S.listSub,'budget','budgetSoft']]) { const c = card({itemSpacing:6,paddingTop:14,paddingBottom:14}); c.appendChild(round(ic,fg,bg,36)); fill(c, txt(title,'BodyStrong')); fill(c, txt(sub,'Caption','muted')); cs.push([c]); }
  R(sc, cs); fill(body, sc);
  fill(s, tabbar('home'));
}
if (want('feed')) { const {s, body} = screen('10 · Feed', 8); body.itemSpacing = 14;
  const top = row({name:'Top bar'}); top.primaryAxisAlignItems='SPACE_BETWEEN'; R(top, [round('menu','ink','surface'), txt(S.feed,'Title','ink','CENTER'), round('plus','accent','accentSoft')]); fill(body, top);
  const post = card({name:'Post',itemSpacing:12,paddingLeft:0,paddingRight:0,paddingTop:14,paddingBottom:16});
  const head = row({name:'Author',itemSpacing:10,paddingLeft:16,paddingRight:16}); const who = col({itemSpacing:0}); fill(who, txt(S.noa,'BodyStrong')); fill(who, txt(S.noaSub,'Caption','muted'));
  R(head, [avatar(S.cooks[0][0],'kids','kidsSoft',40,true), [who], icon('more','muted',22)]); fill(post, head);
  const ph = plate(342,260,'#F3DCCB','#D9826B',0); fill(post, ph); ph.layoutSizingVertical='FIXED';
  const dots = row({name:'Photo dots',itemSpacing:5}); dots.primaryAxisAlignItems='CENTER'; for (let i=0;i<3;i++){ const d=figma.createEllipse(); d.resize(6,6); d.fills=[paint(i===(rtl?2:0)?'accent':'line')]; dots.appendChild(d);} fill(post, dots);
  const acts = row({name:'Actions',itemSpacing:16,paddingLeft:16,paddingRight:16});
  const addw = row({name:'Add to week',paddingLeft:12,paddingRight:12,paddingTop:7,paddingBottom:7,itemSpacing:6,cornerRadius:999}); addw.fills=[paint('accentSoft')]; R(addw, [icon('plus','accent',14,2.2), txt(S.addWeek,'Label','accent','CENTER')]);
  R(acts, [icon('heart','kids',24,2.2), icon('chat','ink',24), icon('save','ink',24), hspacer(), addw]); fill(post, acts);
  const cap = col({itemSpacing:4,paddingLeft:16,paddingRight:16}); fill(cap, txt(S.likes,'BodyStrong')); fill(cap, txt(S.caption,'Body'));
  const tg = startAlign(row({itemSpacing:6})); R(tg, [tag('Prep'), tag('Kids')]); cap.appendChild(tg); fill(cap, txt(S.comments,'Caption','muted')); fill(post, cap);
  fill(body, post);
  const post2 = card({name:'Post · week',itemSpacing:10}); const h2 = row({itemSpacing:10}); const w2 = col({itemSpacing:0}); fill(w2, txt(S.amit,'BodyStrong')); fill(w2, txt(S.amitSub,'Caption','muted'));
  R(h2, [avatar(S.cooks[1][0],'quick','quickSoft',40,true), [w2], icon('more','muted',22)]); fill(post2,h2); fill(body, post2);
  fill(s, tabbar('feed'));
}
if (want('menu')) { const {s, body} = screen('11 · Menu', 8);
  const top = row({name:'Top bar'}); top.primaryAxisAlignItems='SPACE_BETWEEN'; R(top, [round('menu','ink','surface'), avatar(S.letter,'kids','kidsSoft',40)]); fill(body, top);
  fill(body, txt(S.hello,'Display'));
  const dim = figma.createRectangle(); dim.name='Dim'; dim.resize(390,844); dim.fills=[{type:'SOLID',color:hex('#3A3340'),opacity:0.28}]; s.appendChild(dim); dim.layoutPositioning='ABSOLUTE'; dim.x=0; dim.y=0;
  const dr = col({name:'Drawer',itemSpacing:4,paddingLeft:20,paddingRight:20,paddingTop:60,paddingBottom:32}); dr.fills=[paint('surface')];
  if (rtl) { dr.topLeftRadius=28; dr.bottomLeftRadius=28; } else { dr.topRightRadius=28; dr.bottomRightRadius=28; }
  dr.effects=[{type:'DROP_SHADOW',color:{r:0.2,g:0.15,b:0.2,a:0.18},offset:{x:rtl?-8:8,y:0},radius:30,spread:0,visible:true,blendMode:'NORMAL'}];
  s.appendChild(dr); dr.layoutPositioning='ABSOLUTE'; dr.resize(306, 844); dr.primaryAxisSizingMode='FIXED'; dr.x = rtl ? 390-306 : 0; dr.y = 0;
  const prof = row({name:'Profile',itemSpacing:12,paddingBottom:16}); const pw = col({itemSpacing:0}); fill(pw, txt(S.user,'Heading')); fill(pw, txt('tanya@example.com','Caption','muted'));
  R(prof, [avatar(S.letter,'kids','kidsSoft',52), [pw], round('close','muted','bg',36)]); fill(dr, prof);
  const item = (ic, label, on=false, c='ink', extra) => { const r = row({name:'Item/'+label,itemSpacing:14,paddingLeft:14,paddingRight:14,paddingTop:12,paddingBottom:12,cornerRadius:16}); r.fills = on ? [paint('accentSoft')] : [];
    const items = [icon(ic, on?'accent':c==='error'?'error':'muted', 22), [txt(label, on?'BodyStrong':'Body', on?'accent':c)]]; if (extra) items.push(extra); return R(r, items); };
  const pill = (n, fg, bg) => { const b = row({paddingLeft:8,paddingRight:8,paddingTop:2,paddingBottom:2,cornerRadius:999}); b.fills=[paint(bg)]; b.appendChild(txt(n,'Label',fg,'CENTER')); return b; };
  S.items.forEach(([ic,l],i) => fill(dr, item(ic,l,i===0,'ink', ic==='feed' ? pill(S.newPosts,'kids','kidsSoft') : null)));
  const div = figma.createRectangle(); div.resize(260,1); div.fills=[paint('line')]; fill(dr, div);
  fill(dr, item('gear',S.settings)); fill(dr, item('globe',S.language,false,'ink',pill(S.langName,'muted','bg')));
  spacer(dr); fill(dr, item('logout',S.logout,false,'error'));
}
if (want('settings')) { const {s, body} = screen('12 · Settings', 8, 1000); body.itemSpacing = 14;
  const hr = row({name:'Title row',itemSpacing:12}); R(hr, [round('menu','ink','surface'), [txt(S.settings,'Display')]]); fill(body, hr);
  const label = (c, t) => fill(c, txt(t,'Label','muted'));
  const acc = card({name:'Account',itemSpacing:10}); label(acc, S.account); const ar = row({itemSpacing:12}); const ac = col({itemSpacing:0}); fill(ac, txt(S.user,'Heading')); fill(ac, txt('tanya@example.com','Caption','muted')); fill(ac, txt(S.signedWith,'Caption','muted'));
  R(ar, [avatar(S.letter,'kids','kidsSoft',48), [ac]]); fill(acc, ar); fill(body, acc);
  const lc = card({name:'Language',itemSpacing:10}); label(lc, S.language); const seg = row({name:'Language switch',itemSpacing:4,paddingLeft:4,paddingRight:4,paddingTop:4,paddingBottom:4,cornerRadius:999}); seg.fills=[paint('bg')];
  R(seg, ['עברית','English','Русский'].map(l => { const on = l===S.langName; const o = row({paddingTop:9,paddingBottom:9,cornerRadius:999}); o.primaryAxisAlignItems='CENTER'; o.fills = on ? [paint('accent')] : []; o.appendChild(txt(l, on?'BodyStrong':'Body', on?'onAccent':'muted','CENTER')); return [o]; })); fill(lc, seg); fill(body, lc);
  const hc = card({name:'My home',itemSpacing:12}); label(hc, S.home);
  const pills = startAlign(row({name:'Modes',itemSpacing:6})); pills.layoutWrap='WRAP'; pills.counterAxisSpacing=6;
  R(pills, S.modes.map(([l,on]) => { const p = row({paddingLeft:12,paddingRight:12,paddingTop:7,paddingBottom:7,cornerRadius:999}); p.fills=[paint(on?'accentSoft':'bg')]; p.strokes = on ? [paint('accent')] : []; p.strokeWeight = 1; p.appendChild(txt(l,'Label',on?'accent':'muted','CENTER')); return p; })); fill(hc, pills);
  const dr = row({itemSpacing:8}); dr.primaryAxisAlignItems='SPACE_BETWEEN'; const stp = row({name:'Stepper',itemSpacing:12}); R(stp, [round('minus','accent','accentSoft',32), txt('4','Heading','ink','CENTER'), round('plus','accent','accentSoft',32)]);
  R(dr, [txt(S.diners,'Body'), stp]); fill(hc, dr); fill(hc, field(S.budget,'400', null)); fill(body, hc);
  const sc = card({name:'Home page',itemSpacing:2}); label(sc, S.homeShows);
  for (const l of S.shows) { const r = row({itemSpacing:8,paddingTop:6,paddingBottom:6}); const sw = figma.createAutoLayout({name:'Switch'}); sw.resize(46,28); sw.primaryAxisSizingMode='FIXED'; sw.counterAxisSizingMode='FIXED'; sw.counterAxisAlignItems='CENTER'; sw.primaryAxisAlignItems = rtl ? 'MIN' : 'MAX'; sw.paddingLeft=3; sw.paddingRight=3; sw.cornerRadius=14; sw.fills=[paint('accent')];
    const k = figma.createEllipse(); k.resize(22,22); k.fills=[paint('surface')]; sw.appendChild(k); R(r, [[txt(l,'Body')], sw]); fill(sc, r); }
  fill(body, sc);
  const lo = card({name:'Log out',itemSpacing:0}); lo.counterAxisAlignItems='CENTER'; fill(lo, txt(S.logout,'BodyStrong','error','CENTER')); fill(body, lo);
  spacer(body); fill(s, tabbar(null));
}
if (want('prep')) { const {body} = screen('13 · Big cook', 8); body.itemSpacing = 14;
  const nav = startAlign(row({name:'Nav'})); nav.appendChild(back()); fill(body, nav);
  const h = col({itemSpacing:4}); fill(h, txt(S.prepTitle,'Display')); fill(h, txt(S.prepSub,'Body','muted')); fill(body, h);
  const c = card({name:'Steps',itemSpacing:18});
  S.steps.forEach(([title, hint, lines], i) => { const r = row({name:'Step '+(i+1),itemSpacing:12}); r.counterAxisAlignItems='MIN';
    const n = figma.createAutoLayout({name:'Number'}); n.resize(32,32); n.primaryAxisSizingMode='FIXED'; n.counterAxisSizingMode='FIXED'; n.primaryAxisAlignItems='CENTER'; n.counterAxisAlignItems='CENTER'; n.cornerRadius=16; n.fills=[paint('accentSoft')]; n.appendChild(txt(String(i+1),'BodyStrong','accent','CENTER'));
    const tc = col({itemSpacing:4}); fill(tc, txt(title,'Heading')); if (hint) fill(tc, txt(hint,'Caption','muted')); for (const l of lines) fill(tc, txt('• '+l,'Body'));
    R(r, [n, [tc]]); fill(c, r); });
  fill(body, c);
}
const used = 80 + (START + screens.length) * 470;
sec.resizeWithoutConstraints(Math.max(sec.width, used), Math.max(sec.height, 120 + Math.max(...screens.map(x=>x.height)) + 120));
if (!SECTION_ID) { const title = txt(S.sectionTitle,'Title','ink','LEFT'); sec.appendChild(title); title.x=80; title.y=48; }
return { sectionId: sec.id, screens: screens.map(x=>({id:x.id,name:x.name})) };
