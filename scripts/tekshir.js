#!/usr/bin/env node
/**
 * hi-neo plugin — to'liq repo tekshiruvi.
 *
 * 1. Kirill belgilar yo'qligini tekshiradi (U+0400..U+04FF).
 * 2. Antigravity plugin.json hamda Claude plugin.json / marketplace.json manifestlarini tekshiradi.
 * 3. Barcha 8 ta skill (sayt, sahifa, effekt, animatsiya, ikonka, shrift, rang, vitrina) va rules/AGENTS.md ni tekshiradi.
 * 4. 31 ta WOW effekt, 64 ta CSS animatsiya (>=50), 3,054 ta minimalist SVG ikonka (~3,000), 60 ta shrift + 24 ta juftlik, 36 ta rang palitrasi va «bitta bet — bitta bo'lim» sahifa maketi butunligini tekshiradi.
 *
 * Ishlatish:  node scripts/tekshir.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const CHECK_EXT = new Set(['.md', '.json', '.js', '.css', '.html', '.yml', '.yaml', '.txt']);
const KIRILL = new RegExp('[\\u0400-\\u04FF]');

const AGY_ALLOWED_KEYS = new Set([
  'name',
  'description',
  'logo',
  'suggestedPrompts',
  'displayName',
  'version',
  'author',
  'homepage',
  'repository',
  'disabled'
]);

const xatolar = [];
const ogohlantirishlar = [];

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile()) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function kirillTekshir(fayllar) {
  let topildi = 0;
  for (const fayl of fayllar) {
    if (!CHECK_EXT.has(path.extname(fayl).toLowerCase())) continue;
    const matn = fs.readFileSync(fayl, 'utf8');
    if (!KIRILL.test(matn)) continue;
    matn.split(/\r?\n/).forEach((qator, i) => {
      const m = qator.match(KIRILL);
      if (!m) return;
      topildi++;
      xatolar.push(
        `KIRILL: ${path.relative(ROOT, fayl)}:${i + 1} — "${m[0]}" | ${qator.trim().slice(0, 80)}`
      );
    });
  }
  if (!topildi) console.log('OK  kirill belgilar topilmadi');
}

function jsonTekshir() {
  const agyPath = path.join(ROOT, 'plugin.json');
  const claudePath = path.join(ROOT, '.claude-plugin', 'plugin.json');
  const marketPath = path.join(ROOT, '.claude-plugin', 'marketplace.json');

  let agy = null;
  let claude = null;

  try {
    agy = JSON.parse(fs.readFileSync(agyPath, 'utf8'));
    if (agy.name !== 'hi-neo') xatolar.push(`plugin.json: name "${agy.name}" != "hi-neo"`);
    if (!agy.description) xatolar.push('plugin.json: "description" yo\'q');
    for (const k of Object.keys(agy)) {
      if (!AGY_ALLOWED_KEYS.has(k)) xatolar.push(`plugin.json: ruxsat etilmagan maydon "${k}"`);
    }
    if (agy.logo && !fs.existsSync(path.join(ROOT, agy.logo))) {
      xatolar.push(`plugin.json: logo topilmadi (${agy.logo})`);
    }
    console.log(`OK  plugin.json (Antigravity) — ${agy.name}@${agy.version}`);
  } catch (e) {
    xatolar.push(`plugin.json xato: ${e.message}`);
  }

  try {
    claude = JSON.parse(fs.readFileSync(claudePath, 'utf8'));
    if (agy && claude.name !== agy.name) xatolar.push('plugin nomlari mos emas');
    if (agy && claude.version !== agy.version) xatolar.push('plugin versiyalari mos emas');
    console.log(`OK  .claude-plugin/plugin.json — ${claude.name}@${claude.version}`);
  } catch (e) {
    xatolar.push(`.claude-plugin/plugin.json xato: ${e.message}`);
  }

  try {
    const market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
    if (!market.plugins || !market.plugins.length || market.plugins[0].name !== 'hi-neo') {
      xatolar.push('marketplace.json: plugin nomi "hi-neo" emas');
    }
    console.log(`OK  .claude-plugin/marketplace.json — ${market.name}`);
  } catch (e) {
    xatolar.push(`marketplace.json xato: ${e.message}`);
  }
}

function frontmatter(fayl) {
  const matn = fs.readFileSync(fayl, 'utf8');
  const m = matn.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const obj = {};
  for (const qator of m[1].split(/\r?\n/)) {
    const kv = qator.match(/^([a-zA-Z-]+):\s*(.*)$/);
    if (kv) obj[kv[1]] = kv[2].trim();
  }
  return obj;
}

function komponentTekshir() {
  for (const nom of ['hidesign', 'sayt', 'sahifa', 'effekt', 'animatsiya', 'ikonka', 'shrift', 'rang', 'audit', 'vitrina']) {
    const fayl = path.join(ROOT, 'skills', nom, 'SKILL.md');
    if (!fs.existsSync(fayl)) {
      xatolar.push(`skill topilmadi: skills/${nom}/SKILL.md`);
      continue;
    }
    const fm = frontmatter(fayl);
    if (!fm || fm.name !== nom || !fm.description) {
      xatolar.push(`skills/${nom}/SKILL.md: frontmatter noto'g'ri`);
    } else {
      console.log(`OK  skill — ${nom}`);
    }
  }

  const rulesFile = path.join(ROOT, 'rules', 'AGENTS.md');
  if (!fs.existsSync(rulesFile)) xatolar.push('rules/AGENTS.md topilmadi');
  else console.log('OK  rules/AGENTS.md — yagona dizayn va maket qoidalari');

  // 1. 31 WOW Effekt
  const efDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'effekt', 'references', 'effektlar.json'), 'utf8'));
  if (!Array.isArray(efDb.effektlar) || efDb.effektlar.length !== 31) {
    xatolar.push('effektlar.json: 31 ta effekt bo\'lishi shart');
  } else {
    console.log('OK  effektlar.json — 31 ta WOW effekt tasdiqlandi');
  }

  // 2. 64 CSS Animatsiya (>50 talab)
  const anDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'animatsiya', 'references', 'animatsiyalar.json'), 'utf8'));
  const anCss = fs.readFileSync(path.join(ROOT, 'skills', 'animatsiya', 'assets', 'neo-animations.css'), 'utf8');
  if (!Array.isArray(anDb.animatsiyalar) || anDb.animatsiyalar.length < 50) {
    xatolar.push(`animatsiyalar.json: kamida 50 ta kerak, hozir ${anDb.animatsiyalar ? anDb.animatsiyalar.length : 0} ta`);
  } else {
    const kfCount = (anCss.match(/@keyframes\s+neo-/g) || []).length;
    if (kfCount !== anDb.animatsiyalar.length) {
      xatolar.push(`neo-animations.css: @keyframes soni (${kfCount}) JSON bilan (${anDb.animatsiyalar.length}) teng emas`);
    } else {
      console.log(`OK  animatsiyalar.json + neo-animations.css — ${anDb.animatsiyalar.length} ta CSS animatsiya tasdiqlandi`);
    }
  }

  // 3. 3,000 dan ortiq ALOHIDA minimalist SVG ikonka (nusxa-variantlarsiz)
  const icDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'ikonka', 'references', 'ikonkalar.json'), 'utf8'));
  if (!Array.isArray(icDb.ikonkalar) || icDb.ikonkalar.length < 3000) {
    xatolar.push(`ikonkalar.json: 3,000 dan ortiq ikonka kerak, hozir ${icDb.ikonkalar ? icDb.ikonkalar.length : 0} ta`);
  } else {
    const ids = new Set();
    for (const ic of icDb.ikonkalar) {
      if (ids.has(ic.id)) xatolar.push(`ikonkalar.json: takrorlangan id "${ic.id}"`);
      ids.add(ic.id);
      if (!ic.svg || !ic.svg.startsWith('<')) xatolar.push(`ikonka "${ic.id}": noto'g'ri SVG`);
      // Eski usul: asl ikonkani kichraytirib yoniga belgi qo'yilgan nusxa. Endi taqiqlangan.
      if (ic.svg.includes('<g transform="translate(')) xatolar.push(`ikonka "${ic.id}": nusxa-variant (alohida ikonka emas)`);
      if (!icDb.meta.kategoriyalar[ic.kat]) xatolar.push(`ikonka "${ic.id}": noma'lum yo'nalish "${ic.kat}"`);
    }
    const chizmalar = new Set(icDb.ikonkalar.map((ic) => ic.svg)).size;
    if (chizmalar < icDb.ikonkalar.length * 0.99) xatolar.push(`ikonkalar.json: takror chizmalar bor (${icDb.ikonkalar.length - chizmalar} ta)`);
    console.log(`OK  ikonkalar.json — ${icDb.ikonkalar.length} ta alohida minimalist SVG ikonka (${chizmalar} ta takrorlanmas chizma)`);
  }

  // 4. 60 ta shrift va 24 ta juftlik (Google Fonts)
  const fnDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'shrift', 'references', 'shriftlar.json'), 'utf8'));
  if (!Array.isArray(fnDb.shriftlar) || fnDb.shriftlar.length !== 60) {
    xatolar.push(`shriftlar.json: 60 ta shrift bo'lishi shart, hozir ${fnDb.shriftlar ? fnDb.shriftlar.length : 0} ta`);
  } else if (!Array.isArray(fnDb.juftliklar) || fnDb.juftliklar.length !== 24) {
    xatolar.push(`shriftlar.json: 24 ta juftlik bo'lishi shart, hozir ${fnDb.juftliklar ? fnDb.juftliklar.length : 0} ta`);
  } else {
    const fnIds = new Set();
    for (const s of fnDb.shriftlar) {
      if (fnIds.has(s.id)) xatolar.push(`shriftlar.json: takrorlangan id "${s.id}"`);
      fnIds.add(s.id);
      if (!fnDb.meta.uslublar[s.uslub]) xatolar.push(`shrift "${s.id}": noma'lum uslub "${s.uslub}"`);
      if (!Array.isArray(s.vaznlar) || !s.vaznlar.length) xatolar.push(`shrift "${s.id}": vaznlar yo'q`);
      if (!String(s.link || '').startsWith('https://fonts.googleapis.com/css2?family=')) xatolar.push(`shrift "${s.id}": havola noto'g'ri`);
      if (!s.css || !s.css.includes(`'${s.nom}'`)) xatolar.push(`shrift "${s.id}": css qatori noto'g'ri`);
    }
    for (const j of fnDb.juftliklar) {
      if (!fnIds.has(j.sarlavha) || !fnIds.has(j.matn)) xatolar.push(`juftlik "${j.id}": shrift bazada yo'q`);
    }
    console.log(`OK  shriftlar.json — ${fnDb.shriftlar.length} ta shrift va ${fnDb.juftliklar.length} ta juftlik tasdiqlandi`);
  }

  // 5. 36 ta rang palitrasi (6 uslub)
  const rgDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'rang', 'references', 'palitralar.json'), 'utf8'));
  const HEX_RE = /^#[0-9a-fA-F]{6}$/;
  if (!Array.isArray(rgDb.palitralar) || rgDb.palitralar.length !== 36) {
    xatolar.push(`palitralar.json: 36 ta palitra bo'lishi shart, hozir ${rgDb.palitralar ? rgDb.palitralar.length : 0} ta`);
  } else {
    const rgIds = new Set();
    for (const p of rgDb.palitralar) {
      if (rgIds.has(p.id)) xatolar.push(`palitralar.json: takrorlangan id "${p.id}"`);
      rgIds.add(p.id);
      if (!rgDb.meta.uslublar[p.uslub]) xatolar.push(`palitra "${p.id}": noma'lum uslub "${p.uslub}"`);
      if (!HEX_RE.test(p.fon) || !HEX_RE.test(p.matn)) xatolar.push(`palitra "${p.id}": fon/matn HEX noto'g'ri`);
      if (!Array.isArray(p.ranglar) || p.ranglar.length < 2 || !p.ranglar.every((c) => HEX_RE.test(c))) {
        xatolar.push(`palitra "${p.id}": ranglar ro'yxati noto'g'ri`);
      }
    }
    console.log(`OK  palitralar.json — ${rgDb.palitralar.length} ta rang palitrasi (${Object.keys(rgDb.meta.uslublar).length} uslub) tasdiqlandi`);
  }

  // 5b. 100 ta premium gradient (8 uslub, xameleon tovlanish bilan)
  const grDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'rang', 'references', 'gradientlar.json'), 'utf8'));
  const GR_TURLAR = new Set(['linear', 'radial', 'conic']);
  if (!Array.isArray(grDb.gradientlar) || grDb.gradientlar.length !== 100) {
    xatolar.push(`gradientlar.json: 100 ta gradient bo'lishi shart, hozir ${grDb.gradientlar ? grDb.gradientlar.length : 0} ta`);
  } else {
    const grIds = new Set();
    for (const g of grDb.gradientlar) {
      if (grIds.has(g.id)) xatolar.push(`gradientlar.json: takrorlangan id "${g.id}"`);
      grIds.add(g.id);
      if (!grDb.meta.uslublar[g.uslub]) xatolar.push(`gradient "${g.id}": noma'lum uslub "${g.uslub}"`);
      if (!GR_TURLAR.has(g.tur)) xatolar.push(`gradient "${g.id}": noma'lum tur "${g.tur}"`);
      if (!Array.isArray(g.toxtashlar) || g.toxtashlar.length < 2 || !g.toxtashlar.every((t) => HEX_RE.test(t.rang) && t.joy >= 0 && t.joy <= 100)) {
        xatolar.push(`gradient "${g.id}": toxtashlar ro'yxati noto'g'ri`);
      }
    }
    console.log(`OK  gradientlar.json — ${grDb.gradientlar.length} ta premium gradient (${Object.keys(grDb.meta.uslublar).length} uslub) tasdiqlandi`);
  }

  // 5c. 50 ta birinchi bet (Hero) maketi (Supahero ilhomli, 7 uslub)
  const hmDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'sahifa', 'references', 'hero-maketlar.json'), 'utf8'));
  if (!Array.isArray(hmDb.maketlar) || hmDb.maketlar.length !== 50) {
    xatolar.push(`hero-maketlar.json: 50 ta Hero maket bo'lishi shart, hozir ${hmDb.maketlar ? hmDb.maketlar.length : 0} ta`);
  } else {
    const hmIds = new Set();
    for (const h of hmDb.maketlar) {
      if (hmIds.has(h.id)) xatolar.push(`hero-maketlar.json: takrorlangan id "${h.id}"`);
      hmIds.add(h.id);
      if (!hmDb.meta.uslublar[h.uslub]) xatolar.push(`hero "${h.id}": noma'lum uslub "${h.uslub}"`);
      if (!h.sxema || !h.sarlavha || !h.html || !h.html.includes('<section')) {
        xatolar.push(`hero "${h.id}": sxema, sarlavha yoki HTML shabloni noto'g'ri`);
      }
    }
    console.log(`OK  hero-maketlar.json — ${hmDb.maketlar.length} ta Hero maket (${Object.keys(hmDb.meta.uslublar).length} uslub) tasdiqlandi`);
  }

  // 6. «Bitta bet — bitta bo'lim» maketi va Vitrina + JS sintaksis tekshiruvi
  const vitrina = fs.readFileSync(path.join(ROOT, 'skills', 'vitrina', 'assets', 'vitrina.html'), 'utf8');
  const skriptlar = [...vitrina.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (skriptlar.length !== 2) {
    xatolar.push(`vitrina.html: 2 ta <script> bo'lishi kerak (mavzu + asosiy), hozir ${skriptlar.length} ta`);
  } else {
    try {
      const vm = require('vm');
      skriptlar.forEach((kod) => new vm.Script(kod));
      console.log('OK  vitrina.html — ichki JavaScript sintaksisi 100% toza');
    } catch (e) {
      xatolar.push(`vitrina.html JS xatosi: ${e.message}`);
    }
  }
  const betlar = (vitrina.match(/<section class="neo-section" id="[a-z-]+"/g) || []).length;
  if (betlar !== 9 || !vitrina.includes('.neo-section.is-active') || !vitrina.includes('100svh')) {
    xatolar.push(`vitrina.html: «bitta bet — bitta bo'lim» standarti buzilgan (betlar: ${betlar}, kutilgan: 9)`);
  } else {
    console.log('OK  vitrina.html — 9 ta alohida bet (bitta bet — bitta bo\'lim)');
  }

  // Bo'lim ichida skroll bo'lmasligi kerak: ro'yxatlar sahifalanadi, uzun kod kesiladi
  const uslubQismi = vitrina.slice(0, vitrina.indexOf('</style>'));
  if (/overflow(-[xy])?:\s*(auto|scroll)|scroll-snap/.test(uslubQismi)) {
    xatolar.push('vitrina.html: skroll (overflow: auto/scroll yoki scroll-snap) topildi');
  } else {
    console.log('OK  vitrina.html — skroll yo\'q (ro\'yxatlar sahifalanadi)');
  }

  // Vitrinadagi ma'lumotlar manba JSON bazalar bilan bir xil bo'lishi shart
  const olish = (nom) => {
    const boshi = vitrina.indexOf('const ' + nom + ' = ');
    if (boshi === -1) return null;
    const qator = vitrina.slice(boshi + nom.length + 9, vitrina.indexOf(';\n', boshi));
    return JSON.parse(qator.split('<\\/').join('</').split('<\\!--').join('<!--'));
  };
  const teng = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const vFonts = olish('FONTS') || [];
  if (!teng(olish('EFFECTS'), efDb.effektlar)) xatolar.push('vitrina.html: EFFECTS effektlar.json bilan mos emas');
  else if (!teng(olish('ANIMS'), anDb.animatsiyalar)) xatolar.push('vitrina.html: ANIMS animatsiyalar.json bilan mos emas');
  else if (!teng(vFonts.map((f) => f.link), fnDb.shriftlar.map((f) => f.link))) xatolar.push('vitrina.html: FONTS shriftlar.json bilan mos emas');
  else if (!teng(olish('PALETTES'), rgDb.palitralar)) xatolar.push('vitrina.html: PALETTES palitralar.json bilan mos emas');
  else if (!teng(olish('GRADIENTS'), grDb.gradientlar)) xatolar.push('vitrina.html: GRADIENTS gradientlar.json bilan mos emas');
  else if (!teng(olish('HERO_LAYOUTS'), hmDb.maketlar)) xatolar.push('vitrina.html: HERO_LAYOUTS hero-maketlar.json bilan mos emas');
  else if (!teng((olish('ICONS_RAW') || []).map((x) => x[0]), icDb.ikonkalar.map((x) => x.id))) xatolar.push('vitrina.html: ICONS_RAW ikonkalar.json bilan mos emas');
  else console.log('OK  vitrina.html — ichki ma\'lumotlar JSON bazalar bilan bir xil');
}

const fayllar = walk(ROOT, []);
kirillTekshir(fayllar);
jsonTekshir();
komponentTekshir();

for (const o of ogohlantirishlar) console.log(`OGOH  ${o}`);

if (xatolar.length) {
  console.error(`\n${xatolar.length} ta xato topildi:\n`);
  for (const x of xatolar) console.error(`  ${x}`);
  process.exit(1);
}

console.log('\nHammasi 100% joyida!');
