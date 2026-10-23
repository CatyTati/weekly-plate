// Figma Plugin API script: adds the screens Sign in, Sign up, Home, Feed and Menu
// to "Weekly Plate – App Design" (file b8Z3RUObkz9gvbho2rLGmX). Run through the Figma MCP use_figma tool.
const V = {bg:"VariableID:2:4",surface:"VariableID:2:5",ink:"VariableID:2:6",muted:"VariableID:2:7",line:"VariableID:2:8",accent:"VariableID:2:9",onAccent:"VariableID:2:10",accentSoft:"VariableID:2:11",kids:"VariableID:2:12",kidsSoft:"VariableID:2:13",budget:"VariableID:2:14",budgetSoft:"VariableID:2:15",quick:"VariableID:2:16",quickSoft:"VariableID:2:17",error:"VariableID:2:18",errorSoft:"VariableID:2:19"};
const T = {Display:"S:2c2ebf0e692ebf7b67c5b578b244d730001beeb0,",Title:"S:e2c036a34f3cdf5f4d760374cf2b74474a44d76f,",Heading:"S:ee1e961ac6c8321ae6990798aa30f9e627645e25,",Body:"S:26ad2673b96b0a104358611df00d427082aba933,",BodyStrong:"S:5f33ab2283d623e17bc59633e4bd9a8cec46ee59,",Caption:"S:fa43a74db8d308a73918b40de02d18fae9a1ec68,",Label:"S:e9e076a89ab6372205e4f8f8e4d41e1160463ed9,"};
const SOFT = "S:f8aa5a96306c733800d78e3c510ee6427e831bea,";
await Promise.all(['Light','Regular','Medium','SemiBold','Bold'].map(s=>figma.loadFontAsync({family:'Rubik',style:s})));
const vars = {}; await Promise.all(Object.entries(V).map(async([k,id])=>vars[k]=await figma.variables.getVariableByIdAsync(id)));
const paint = k => figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',vars[k]);
const hex = h => { const n = parseInt(h.slice(1),16); return { r:((n>>16)&255)/255, g:((n>>8)&255)/255, b:(n&255)/255 }; };
const txt = (s, style, c='ink', align='RIGHT') => { const t = figma.createText(); t.textStyleId = T[style]; t.characters = s; t.fills=[paint(c)]; t.textAlignHorizontal = align; return t; };
const [btnSet, tagSet] = await Promise.all(['3:7','3:16'].map(id=>figma.getNodeByIdAsync(id)));
const labelKey = Object.keys(btnSet.componentPropertyDefinitions).find(k=>k.startsWith('Label'));
const btn = (label, type='Primary') => { const b = btnSet.children.find(c=>c.name===`Type=${type}`).createInstance(); b.setProperties({[labelKey]:label}); return b; };
const tag = k => tagSet.children.find(c=>c.name===`Kind=${k}`).createInstance();
const fill = (p, c) => { p.appendChild(c); c.layoutSizingHorizontal = 'FILL'; return c; };
const col = (o={}) => { const f = figma.createAutoLayout('VERTICAL', {itemSpacing:12, ...o}); f.fills=[]; f.counterAxisAlignItems='MAX'; return f; };
const row = (o={}) => { const f = figma.createAutoLayout('HORIZONTAL', {itemSpacing:8, ...o}); f.fills=[]; f.counterAxisAlignItems='CENTER'; return f; };
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
 plus:'<path d="M12 5v14M5 12h14"/>', mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/>', lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 check:'<path d="M20 6 9 17l-5-5"/>', alert:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>', close:'<path d="M18 6 6 18M6 6l12 12"/>', chevron:'<path d="m15 18-6-6 6-6"/>'
};
const icon = (name, c='ink', size=22, sw=1.9) => { const n = figma.createNodeFromSvg(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="#000" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</g></svg>`); n.name='icon/'+name; n.fills=[]; for (const v of n.findAllWithCriteria({types:['VECTOR','ELLIPSE','RECTANGLE']})) { if (v.strokes.length) v.strokes=[paint(c)]; v.fills=[]; } n.resize(size,size); return n; };
const round = (ic, c='ink', bg='surface', size=40) => { const b = figma.createAutoLayout({name:'Button/'+ic}); b.resize(size,size); b.primaryAxisSizingMode='FIXED'; b.counterAxisSizingMode='FIXED'; b.primaryAxisAlignItems='CENTER'; b.counterAxisAlignItems='CENTER'; b.cornerRadius=size/2; b.fills=[paint(bg)]; if (bg==='surface') b.effectStyleId=SOFT; b.appendChild(icon(ic,c,size*0.5)); return b; };
const avatar = (letter, fg, bg, size=44, ring=false) => { const a = figma.createAutoLayout({name:'Avatar'}); a.resize(size,size); a.primaryAxisSizingMode='FIXED'; a.counterAxisSizingMode='FIXED'; a.primaryAxisAlignItems='CENTER'; a.counterAxisAlignItems='CENTER'; a.cornerRadius=size/2; a.fills=[paint(bg)];
  if (ring) { a.strokes=[{type:'GRADIENT_LINEAR',gradientTransform:[[1,0,0],[0,1,0]],gradientStops:[{position:0,color:{...hex('#E7A1B9'),a:1}},{position:1,color:{...hex('#8DBB9D'),a:1}}]}]; a.strokeWeight=2.5; a.strokeAlign='OUTSIDE'; }
  a.appendChild(txt(letter, size>50?'Title':'Heading', fg, 'CENTER')); return a; };
const plate = (w, h, bgHex='#F6E3DA', sauce='#E59A86', r=24) => { const p = figma.createFrame(); p.name='Photo'; p.resize(w,h); p.cornerRadius=r; p.fills=[{type:'SOLID',color:hex(bgHex)}]; p.clipsContent=true;
  const d = Math.min(w,h)*0.68, pl = figma.createEllipse(); pl.resize(d,d); pl.fills=[{type:'SOLID',color:{r:1,g:1,b:1}}]; pl.effects=[{type:'DROP_SHADOW',color:{r:0.6,g:0.35,b:0.3,a:0.15},offset:{x:0,y:8},radius:20,spread:0,visible:true,blendMode:'NORMAL'}]; p.appendChild(pl); pl.x=(w-d)/2; pl.y=(h-d)/2;
  const s = figma.createEllipse(); s.resize(d*0.72,d*0.72); s.fills=[{type:'SOLID',color:hex(sauce)}]; p.appendChild(s); s.x=(w-d*0.72)/2; s.y=(h-d*0.72)/2; return p; };
const field = (label, value, ic, err) => { const f = col({name:'Field',itemSpacing:6}); fill(f, txt(label,'Label','muted'));
  const box = row({name:'Input',paddingLeft:14,paddingRight:14,paddingTop:13,paddingBottom:13,itemSpacing:10,cornerRadius:14}); box.fills=[paint(err?'errorSoft':'surface')]; box.strokes=[paint(err?'error':'line')]; box.strokeWeight=err?1.5:1;
  if (ic==='lock') box.appendChild(icon('eye','muted',18)); fill(box, txt(value,'Body', value.startsWith('•')||value.includes('@')||!value?'ink':'ink')); box.appendChild(icon(ic,'muted',18)); fill(f, box);
  if (err) fill(f, txt(err,'Caption','error')); return f; };
const socialBtn = (label, kind) => { const b = row({name:'Button/'+kind,paddingTop:14,paddingBottom:14,paddingLeft:20,paddingRight:20,itemSpacing:10,cornerRadius:999}); b.primaryAxisAlignItems='CENTER';
  if (kind==='apple') { b.fills=[paint('ink')]; b.appendChild(txt(label,'BodyStrong','surface','CENTER')); const a = figma.createNodeFromSvg('<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.8-4.1zM13.8 4.9c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z"/></svg>'); a.name='logo/apple'; b.appendChild(a); }
  else { b.fills=[paint('surface')]; b.effectStyleId=SOFT; b.appendChild(txt(label,'BodyStrong','ink','CENTER')); const g = figma.createNodeFromSvg('<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>'); g.name='logo/google'; b.appendChild(g); }
  return b; };
const tabbar = (active) => { const bar = row({name:'Tab bar',paddingTop:10,paddingBottom:28,itemSpacing:0,topLeftRadius:24,topRightRadius:24}); bar.fills=[paint('surface')]; bar.effects=[{type:'DROP_SHADOW',color:{r:0.36,g:0.28,b:0.36,a:0.08},offset:{x:0,y:-4},radius:20,spread:0,visible:true,blendMode:'NORMAL'}];
  for (const [k,ic,label] of [['shop','shop','קניות'],['feed','feed','פיד'],['week','week','השבוע'],['home','home','בית']]) { const on = k===active; const it = col({name:'tab/'+k,itemSpacing:3}); it.counterAxisAlignItems='CENTER'; it.appendChild(icon(ic,on?'accent':'muted',24,on?2.2:1.8)); it.appendChild(txt(label,'Label',on?'accent':'muted','CENTER')); fill(bar,it); }
  return bar; };

// section below the English screens
const en = await figma.getNodeByIdAsync('11:196');
const sec = figma.createSection(); sec.name='Screens · New (Account, Home, Feed, Menu)'; sec.x = en.x; sec.y = en.y + en.height + 120; sec.fills=[{type:'SOLID',color:hex('#EFEAEC')}];
const screens = [];
const screen = (name, i, padTop=12, glow=true) => { const s = figma.createFrame(); s.name=name; s.resize(390,844); s.fills=[paint('bg')]; s.clipsContent=true; s.cornerRadius=32; s.layoutMode='VERTICAL'; s.primaryAxisSizingMode='FIXED'; s.counterAxisSizingMode='FIXED'; s.itemSpacing=0; sec.appendChild(s); s.x=80+i*470; s.y=120;
  if (glow) for (const [x,y,w,c] of [[200,-120,300,'#F9DDE5'],[-120,-60,280,'#DCEDE1']]) { const e = figma.createEllipse(); e.name='Glow'; e.resize(w,w); e.fills=[{type:'SOLID',color:hex(c),opacity:0.9}]; e.effects=[{type:'LAYER_BLUR',radius:70,visible:true}]; s.appendChild(e); e.layoutPositioning='ABSOLUTE'; e.x=x; e.y=y; e.locked=true; }
  const st = row({name:'Status bar',paddingLeft:28,paddingRight:28,paddingTop:16,paddingBottom:8}); st.primaryAxisAlignItems='SPACE_BETWEEN'; st.appendChild(txt('9:41','Label','ink','LEFT')); st.appendChild(txt('●●●','Label','ink','RIGHT')); fill(s,st);
  const body = col({name:'Content',paddingLeft:24,paddingRight:24,paddingTop:padTop,paddingBottom:24,itemSpacing:16}); fill(s,body); body.layoutSizingVertical='FILL'; screens.push(s); return {s, body}; };
const spacer = body => { const sp = col({name:'Spacer'}); fill(body, sp); sp.layoutSizingVertical='FILL'; };

// ---------- 07 Sign in ----------
{ const {s, body} = screen('07 · Sign in', 0, 40); body.itemSpacing = 14;
  const logo = col({name:'Logo',itemSpacing:10}); logo.counterAxisAlignItems='CENTER';
  logo.appendChild(plate(88,88,'#EAF2EC','#8DBB9D',28)); fill(logo, txt('צלחת השבוע','Display','ink','CENTER')); fill(logo, txt('שבוע של ארוחות ערב, בלי לחשוב מה לבשל','Body','muted','CENTER')); fill(body, logo);
  const g = col({name:'Social',itemSpacing:10,paddingTop:12}); fill(g, socialBtn('המשך עם Google','google')); fill(g, socialBtn('המשך עם Apple','apple')); fill(body, g);
  const or = row({name:'Or',itemSpacing:12}); const l1 = figma.createRectangle(); l1.resize(100,1); l1.fills=[paint('line')]; const l2 = l1.clone(); fill(or,l1); or.appendChild(txt('או עם אימייל','Caption','muted','CENTER')); fill(or,l2); fill(body, or);
  fill(body, field('אימייל','tanya@example.com','mail')); fill(body, field('סיסמה','••••••••','lock'));
  fill(body, txt('שכחתי סיסמה','BodyStrong','accent','LEFT'));
  fill(body, btn('כניסה'));
  spacer(body);
  const sw = row({name:'Switch',itemSpacing:6}); sw.primaryAxisAlignItems='CENTER'; sw.appendChild(txt('הרשמה','BodyStrong','accent','CENTER')); sw.appendChild(txt('אין לכם חשבון?','Body','muted','CENTER')); fill(body, sw);
}
// ---------- 08 Sign up ----------
{ const {s, body} = screen('08 · Sign up', 1, 8); body.itemSpacing = 14;
  const nav = row({name:'Nav'}); nav.primaryAxisAlignItems='SPACE_BETWEEN'; nav.appendChild(txt('','Label')); nav.appendChild(round('chevron','ink','surface')); nav.children[1].rotation = 180; fill(body, nav);
  const h = col({itemSpacing:4}); fill(h, txt('יצירת חשבון','Display')); fill(h, txt('30 שניות ומתחילים לתכנן','Body','muted')); fill(body, h);
  fill(body, socialBtn('הרשמה עם Google','google'));
  const or = row({name:'Or',itemSpacing:12}); const l1 = figma.createRectangle(); l1.resize(100,1); l1.fills=[paint('line')]; const l2 = l1.clone(); fill(or,l1); or.appendChild(txt('או','Caption','muted','CENTER')); fill(or,l2); fill(body, or);
  fill(body, field('שם','טניה','user')); fill(body, field('אימייל','tanya@example.com','mail')); fill(body, field('סיסמה','•••••','lock', true ? 'הסיסמה צריכה לפחות 8 תווים.' : ''));
  const terms = row({name:'Terms',itemSpacing:10}); terms.counterAxisAlignItems='MIN'; const tt = txt('אני מסכימה לתנאי השימוש ולמדיניות הפרטיות','Caption','muted'); fill(terms, tt);
  const box = figma.createAutoLayout({name:'Check'}); box.resize(22,22); box.primaryAxisSizingMode='FIXED'; box.counterAxisSizingMode='FIXED'; box.primaryAxisAlignItems='CENTER'; box.counterAxisAlignItems='CENTER'; box.cornerRadius=8; box.fills=[paint('accent')]; box.appendChild(icon('check','onAccent',14,3)); terms.appendChild(box); fill(body, terms);
  spacer(body); fill(body, btn('יצירת חשבון'));
}
// ---------- 09 Home ----------
{ const {s, body} = screen('09 · Home', 2, 8); body.itemSpacing = 16;
  const top = row({name:'Top bar'}); top.primaryAxisAlignItems='SPACE_BETWEEN'; top.appendChild(avatar('ט','kids','kidsSoft',40)); top.appendChild(round('menu','ink','surface')); fill(body, top);
  const g = col({itemSpacing:2}); fill(g, txt('ערב טוב, טניה','Display')); fill(g, txt('יום שלישי · 4 סועדים · נשארו ₪138 השבוע','Caption','muted')); fill(body, g);
  // stories
  const stories = row({name:'Stories',itemSpacing:14}); stories.primaryAxisAlignItems='MAX';
  for (const [l,n,fg,bg] of [['י','יוסי','budget','budgetSoft'],['ע','עמית ודנה','quick','quickSoft'],['נ','נועה','kids','kidsSoft']]) { const st = col({itemSpacing:6}); st.counterAxisAlignItems='CENTER'; st.appendChild(avatar(l,fg,bg,56,true)); st.appendChild(txt(n,'Label','ink','CENTER')); stories.appendChild(st); }
  const add = col({itemSpacing:6}); add.counterAxisAlignItems='CENTER'; const ab = round('plus','accent','accentSoft',56); add.appendChild(ab); add.appendChild(txt('עוד בשלנים','Label','muted','CENTER')); stories.insertChild(0, add);
  fill(body, stories);
  // tonight
  const tonight = card({name:'Tonight',itemSpacing:12,paddingTop:12});
  fill(tonight, plate(310,130,'#F6E3DA','#E59A86',18)).layoutSizingVertical='FIXED';
  const tt = row({itemSpacing:8}); tt.primaryAxisAlignItems='SPACE_BETWEEN'; tt.appendChild(tag('Quick')); tt.appendChild(txt('הערב','Label','accent')); fill(tonight, tt);
  fill(tonight, txt('שקשוקה עם לחם','Title')); fill(tonight, txt('20 דק׳ · ₪34 · לילדים: ביצה עין בצד','Caption','muted'));
  fill(tonight, btn('לצפייה במתכון','Secondary')); fill(body, tonight);
  // week strip
  const strip = row({name:'Week strip',itemSpacing:6});
  for (const [d,on,done] of [['ש׳',false,false],['ו׳',false,false],['ה׳',false,false],['ד׳',false,false],['ג׳',true,false],['ב׳',false,true],['א׳',false,true]]) { const c = col({itemSpacing:4,paddingTop:10,paddingBottom:10,cornerRadius:16}); c.counterAxisAlignItems='CENTER'; c.fills=[paint(on?'accent':'surface')]; if(!on) c.effectStyleId=SOFT; c.appendChild(txt(d,'BodyStrong',on?'onAccent':'ink','CENTER')); const dot = figma.createEllipse(); dot.resize(6,6); dot.fills=[paint(done?'accent':on?'onAccent':'line')]; c.appendChild(dot); fill(strip, c); }
  fill(body, strip);
  // shortcuts
  const sc = row({name:'Shortcuts',itemSpacing:10});
  for (const [ic,title,sub,fg,bg] of [['pot','הבישול הגדול','4 מנות · כ-3 שעות','accent','accentSoft'],['shop','רשימת קניות','9 פריטים נשארו','budget','budgetSoft']]) { const c = card({itemSpacing:6,paddingTop:14,paddingBottom:14}); const ib = round(ic,fg,bg,36); c.appendChild(ib); fill(c, txt(title,'BodyStrong')); fill(c, txt(sub,'Caption','muted')); fill(sc, c); }
  fill(body, sc);
  fill(s, tabbar('home'));
}
// ---------- 10 Feed ----------
{ const {s, body} = screen('10 · Feed', 3, 8); body.itemSpacing = 14;
  const top = row({name:'Top bar'}); top.primaryAxisAlignItems='SPACE_BETWEEN'; top.appendChild(round('plus','accent','accentSoft')); top.appendChild(txt('פיד','Title','ink','CENTER')); top.appendChild(round('menu','ink','surface')); fill(body, top);
  const post = card({name:'Post',itemSpacing:12,paddingLeft:0,paddingRight:0,paddingTop:14,paddingBottom:16});
  const head = row({name:'Author',itemSpacing:10,paddingLeft:16,paddingRight:16}); head.appendChild(icon('more','muted',22)); const who = col({itemSpacing:0}); fill(who, txt('נועה ב.','BodyStrong')); fill(who, txt('לפני שעתיים · הבישול של יום ראשון','Caption','muted')); fill(head, who); head.appendChild(avatar('נ','kids','kidsSoft',40,true)); fill(post, head);
  const ph = plate(342,260,'#F3DCCB','#D9826B',0); fill(post, ph); ph.layoutSizingVertical='FIXED';
  const dots = row({name:'Photo dots',itemSpacing:5}); dots.primaryAxisAlignItems='CENTER'; for (let i=0;i<3;i++){ const d=figma.createEllipse(); d.resize(6,6); d.fills=[paint(i===2?'accent':'line')]; dots.appendChild(d);} fill(post, dots);
  const acts = row({name:'Actions',itemSpacing:16,paddingLeft:16,paddingRight:16});
  const addw = row({name:'Add to week',paddingLeft:12,paddingRight:12,paddingTop:7,paddingBottom:7,itemSpacing:6,cornerRadius:999}); addw.fills=[paint('accentSoft')]; addw.appendChild(txt('הוספה לשבוע','Label','accent','CENTER')); addw.appendChild(icon('plus','accent',14,2.2));
  acts.appendChild(addw); const sp = row({name:'Spacer'}); fill(acts, sp); acts.appendChild(icon('save','ink',24)); acts.appendChild(icon('chat','ink',24)); acts.appendChild(icon('heart','kids',24,2.2)); fill(post, acts);
  const cap = col({itemSpacing:4,paddingLeft:16,paddingRight:16}); fill(cap, txt('128 אהבו · 14 שמרו','BodyStrong')); fill(cap, txt('שוקי עוף בתנור עם תפוחי אדמה. שלוש תבניות בתנור ויש ארוחות עד יום רביעי 🙌','Body'));
  const tg = row({itemSpacing:6}); tg.primaryAxisAlignItems='MAX'; tg.appendChild(tag('Prep')); tg.appendChild(tag('Kids')); cap.appendChild(tg); fill(cap, txt('לכל 12 התגובות','Caption','muted')); fill(post, cap);
  fill(body, post);
  const post2 = card({name:'Post · week',itemSpacing:10}); const h2 = row({itemSpacing:10}); h2.appendChild(icon('more','muted',22)); const w2 = col({itemSpacing:0}); fill(w2, txt('עמית ודנה','BodyStrong')); fill(w2, txt('שיתפו שבוע שלם · אתמול','Caption','muted')); fill(h2,w2); h2.appendChild(avatar('ע','quick','quickSoft',40,true)); fill(post2,h2);
  fill(body, post2);
  fill(s, tabbar('feed'));
}
// ---------- 11 Menu ----------
{ const {s, body} = screen('11 · Menu', 4, 8);
  const top = row({name:'Top bar'}); top.primaryAxisAlignItems='SPACE_BETWEEN'; top.appendChild(avatar('ט','kids','kidsSoft',40)); top.appendChild(round('menu','ink','surface')); fill(body, top);
  fill(body, txt('ערב טוב, טניה','Display'));
  const dim = figma.createRectangle(); dim.name='Dim'; dim.resize(390,844); dim.fills=[{type:'SOLID',color:hex('#3A3340'),opacity:0.28}]; s.appendChild(dim); dim.layoutPositioning='ABSOLUTE'; dim.x=0; dim.y=0;
  const dr = col({name:'Drawer',itemSpacing:4,paddingLeft:20,paddingRight:20,paddingTop:60,paddingBottom:32,topLeftRadius:28,bottomLeftRadius:28}); dr.fills=[paint('surface')]; dr.effects=[{type:'DROP_SHADOW',color:{r:0.2,g:0.15,b:0.2,a:0.18},offset:{x:-8,y:0},radius:30,spread:0,visible:true,blendMode:'NORMAL'}];
  s.appendChild(dr); dr.layoutPositioning='ABSOLUTE'; dr.resize(306, 844); dr.primaryAxisSizingMode='FIXED'; dr.x = 390-306; dr.y = 0;
  const prof = row({name:'Profile',itemSpacing:12,paddingBottom:16}); const pw = col({itemSpacing:0}); fill(pw, txt('טניה לוקין','Heading')); fill(pw, txt('tanya@example.com','Caption','muted')); prof.appendChild(round('close','muted','bg',36)); fill(prof, pw); prof.appendChild(avatar('ט','kids','kidsSoft',52)); fill(dr, prof);
  const item = (ic, label, on=false, c='ink', extra) => { const r = row({name:'Item/'+label,itemSpacing:14,paddingLeft:14,paddingRight:14,paddingTop:12,paddingBottom:12,cornerRadius:16}); r.fills = on ? [paint('accentSoft')] : [];
    if (extra) r.appendChild(extra); const tx = txt(label, on?'BodyStrong':'Body', on?'accent':c); fill(r, tx); r.appendChild(icon(ic, on?'accent':c==='error'?'error':'muted', 22)); return r; };
  const badge = (n) => { const b = row({paddingLeft:8,paddingRight:8,paddingTop:2,paddingBottom:2,cornerRadius:999}); b.fills=[paint('kidsSoft')]; b.appendChild(txt(n,'Label','kids','CENTER')); return b; };
  for (const [ic,l,on,ex] of [['home','בית',true],['week','השבוע'],['feed','פיד',false,badge('3 חדשים')],['shop','רשימת קניות'],['pot','הבישול הגדול'],['book','המתכונים שלי'],['users','בשלנים לעקוב']]) fill(dr, item(ic,l,on,'ink',ex));
  const div = figma.createRectangle(); div.resize(260,1); div.fills=[paint('line')]; fill(dr, div);
  const lang = row({paddingLeft:10,paddingRight:10,paddingTop:4,paddingBottom:4,cornerRadius:999}); lang.fills=[paint('bg')]; lang.appendChild(txt('עברית','Label','muted','CENTER'));
  fill(dr, item('gear','הגדרות והעדפות')); fill(dr, item('globe','שפה',false,'ink',lang));
  const sp = col({name:'Spacer'}); fill(dr, sp); sp.layoutSizingVertical='FILL';
  fill(dr, item('logout','התנתקות',false,'error'));
}
sec.resizeWithoutConstraints(80 + 5*470, 120 + 844 + 120);
const title = txt('Weekly Plate · חשבון, בית, פיד ותפריט','Title','ink','LEFT'); sec.appendChild(title); title.x=80; title.y=48;
return { sectionId: sec.id, screenIds: screens.map(x=>x.id) };
