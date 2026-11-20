#!/usr/bin/env node
/**
 * Hi Neo — yagona CLI boshqaruv skripti (hiworld.club).
 *
 * Buyruqlar:
 *   node katalog.js royxat [--kategoriya K] [--stek S] [--qidiruv Q]
 *   node katalog.js ol <01..31 yoki nom>
 *   node katalog.js anim-royxat [--uslub U] [--qidiruv Q]
 *   node katalog.js anim-ol <01..64 yoki slug>
 *   node katalog.js ikonka-qidir <soz> [--kategoriya K] [--limit N]
 *   node katalog.js ikonka-ol <id_yoki_raqam> [--format svg|jsx|vue] [--qalinlik 1.75] [--olcham 24]
 *   node katalog.js shrift-royxat [--uslub U] [--qidiruv Q]
 *   node katalog.js shrift-ol <id, 01..60 yoki nom>
 *   node katalog.js juftlik-royxat [--qidiruv Q]
 *   node katalog.js juftlik-ol <id yoki 01..24>
 *   node katalog.js tanla <soha va kayfiyat so'zlari>
 *   node katalog.js vitrina [--chiqish YOL]
 *   node katalog.js server [--boshat]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const ASOS = __dirname;
const SKILLS_DIR = path.resolve(ASOS, '..', '..');
const DATA_PATH = path.resolve(SKILLS_DIR, 'effekt', 'references', 'effektlar.json');
const ANIM_PATH = path.resolve(SKILLS_DIR, 'animatsiya', 'references', 'animatsiyalar.json');
const ANIM_CSS_PATH = path.resolve(SKILLS_DIR, 'animatsiya', 'assets', 'neo-animations.css');
const ICON_PATH = path.resolve(SKILLS_DIR, 'ikonka', 'references', 'ikonkalar.json');
const FONT_PATH = path.resolve(SKILLS_DIR, 'shrift', 'references', 'shriftlar.json');
const VITRINA_PATH = path.resolve(SKILLS_DIR, 'vitrina', 'assets', 'vitrina.html');

function yuklaJson(fayl) {
  return JSON.parse(fs.readFileSync(fayl, 'utf8'));
}

function argOqi(args, nom) {
  const idx = args.indexOf(nom);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function stekMos(item, stek) {
  if (!stek) return true;
  const s = item.stek.join(' ').toLowerCase();
  const q = stek.toLowerCase();
  if (q === 'webgl') return s.includes('webgl') || s.includes('three') || s.includes('glsl');
  return s.includes(q);
}

// --- 1. 31 ta WOW Effekt ---
function royxat(args) {
  const db = yuklaJson(DATA_PATH);
  const kat = argOqi(args, '--kategoriya');
  const stek = argOqi(args, '--stek');
  const qidiruv = (argOqi(args, '--qidiruv') || '').toLowerCase().trim();

  const natija = db.effektlar.filter((it) => {
    if (kat && it.kategoriya !== kat.toLowerCase()) return false;
    if (!stekMos(it, stek)) return false;
    if (!qidiruv) return true;
    const matn = [it.id, it.slug, it.nom, it.en, it.qayerda, ...it.stek].join(' ').toLowerCase();
    return matn.includes(qidiruv);
  }).map((it) => ({
    id: it.id,
    nom: it.nom,
    en: it.en,
    kategoriya: it.kategoriya,
    stek: it.stek,
    qiyinlik: it.qiyinlik,
    qayerda: it.qayerda
  }));

  console.log(JSON.stringify({ soni: natija.length, effektlar: natija }, null, 2));
}

function ol(args) {
  const db = yuklaJson(DATA_PATH);
  const sorov = (args[0] || '').trim().toLowerCase();
  if (!sorov) {
    console.error('Ishlatish: node katalog.js ol <01..31 yoki nom>');
    process.exit(1);
  }
  const raqam = parseInt(sorov, 10);
  let topildi = null;
  if (/^\d+$/.test(sorov)) {
    topildi = db.effektlar.find((x) => x.raqam === raqam);
  }
  if (!topildi) {
    topildi = db.effektlar.find(
      (x) => x.slug === sorov || x.nom.toLowerCase().includes(sorov) || x.en.toLowerCase().includes(sorov)
    );
  }
  if (!topildi) {
    console.error(`"${sorov}" bo'yicha WOW-effekt topilmadi.`);
    process.exit(1);
  }
  console.log(JSON.stringify(topildi, null, 2));
}

// --- 2. 64 ta CSS Animatsiya ---
function animRoyxat(args) {
  const db = yuklaJson(ANIM_PATH);
  const uslub = argOqi(args, '--uslub');
  const qidiruv = (argOqi(args, '--qidiruv') || '').toLowerCase().trim();

  const natija = db.animatsiyalar.filter((a) => {
    if (uslub && a.uslub !== uslub.toLowerCase()) return false;
    if (!qidiruv) return true;
    return [a.id, a.slug, a.nom, a.en, a.uslub].join(' ').toLowerCase().includes(qidiruv);
  }).map((a) => ({
    id: a.id,
    klass: a.klass,
    nom: a.nom,
    en: a.en,
    uslub: a.uslub,
    davomiylik: a.davomiylik
  }));

  console.log(JSON.stringify({ soni: natija.length, animatsiyalar: natija }, null, 2));
}

function animOl(args) {
  const db = yuklaJson(ANIM_PATH);
  const sorov = (args[0] || '').trim().toLowerCase();
  if (!sorov) {
    console.error('Ishlatish: node katalog.js anim-ol <01..64 yoki slug>');
    process.exit(1);
  }
  const raqam = parseInt(sorov, 10);
  let topildi = /^\d+$/.test(sorov) ? db.animatsiyalar.find((x) => x.raqam === raqam) : null;
  if (!topildi) {
    topildi = db.animatsiyalar.find(
      (x) => x.slug === sorov || x.klass === sorov || x.nom.toLowerCase().includes(sorov) || x.en.toLowerCase().includes(sorov)
    );
  }
  if (!topildi) {
    console.error(`"${sorov}" bo'yicha CSS animatsiya topilmadi.`);
    process.exit(1);
  }
  console.log(JSON.stringify(topildi, null, 2));
}

// --- 3. 3,054 ta Minimalist SVG Ikonka ---
function ikonkaQidir(args) {
  const db = yuklaJson(ICON_PATH);
  const kat = argOqi(args, '--kategoriya');
  const limit = parseInt(argOqi(args, '--limit') || '24', 10);
  const soz = (args[0] && !args[0].startsWith('--') ? args[0] : (argOqi(args, '--qidiruv') || '')).toLowerCase().trim();

  const mos = db.ikonkalar.filter((ik) => {
    if (kat && ik.kat !== kat.toLowerCase()) return false;
    if (!soz) return true;
    return ik.id.includes(soz) || ik.nom.toLowerCase().includes(soz) || ik.en.toLowerCase().includes(soz) || ik.kat.includes(soz);
  });

  console.log(JSON.stringify({
    jami_topildi: mos.length,
    korsatildi: Math.min(limit, mos.length),
    ikonkalar: mos.slice(0, limit).map((x) => ({ n: x.n, id: x.id, nom: x.nom, en: x.en, kat: x.kat }))
  }, null, 2));
}

function ikonkaOl(args) {
  const db = yuklaJson(ICON_PATH);
  const sorov = (args[0] || '').trim().toLowerCase();
  if (!sorov) {
    console.error('Ishlatish: node katalog.js ikonka-ol <id_yoki_raqam> [--format svg|jsx|vue]');
    process.exit(1);
  }
  const fmt = (argOqi(args, '--format') || 'svg').toLowerCase();
  const sw = argOqi(args, '--qalinlik') || '1.75';
  const sz = argOqi(args, '--olcham') || '24';

  let ik = /^\d+$/.test(sorov) ? db.ikonkalar.find((x) => x.n === parseInt(sorov, 10)) : null;
  if (!ik) ik = db.ikonkalar.find((x) => x.id === sorov);
  if (!ik) ik = db.ikonkalar.find((x) => x.id.includes(sorov) || x.en.includes(sorov) || x.nom.toLowerCase().includes(sorov));

  if (!ik) {
    console.error(`"${sorov}" bo'yicha ikonka topilmadi.`);
    process.exit(1);
  }

  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ik.svg}</svg>`;

  if (fmt === 'jsx') {
    const jsxInner = ik.svg.replace(/stroke-width=/g, 'strokeWidth=');
    const compName = 'Icon' + ik.id.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    console.log(
      `export function ${compName}({ size = ${sz}, strokeWidth = ${sw}, className = '' }) {\n` +
      `  return (\n` +
      `    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">\n` +
      `      ${jsxInner}\n` +
      `    </svg>\n` +
      `  );\n}`
    );
    return;
  }

  if (fmt === 'vue') {
    console.log(`<template>\n  ${rawSvg}\n</template>`);
    return;
  }

  console.log(rawSvg);
}

// --- 4. 60 ta Shrift va 24 ta Juftlik ---
function shriftRoyxat(args) {
  const db = yuklaJson(FONT_PATH);
  const uslub = argOqi(args, '--uslub');
  const qidiruv = (argOqi(args, '--qidiruv') || '').toLowerCase().trim();

  const natija = db.shriftlar.filter((s) => {
    if (uslub && s.uslub !== uslub.toLowerCase()) return false;
    if (!qidiruv) return true;
    return [s.id, s.nom, s.uslub, s.qayerda].join(' ').toLowerCase().includes(qidiruv);
  }).map((s) => ({
    id: s.id,
    raqam: s.raqam,
    nom: s.nom,
    uslub: s.uslub,
    vaznlar: s.vaznlar,
    kirill: s.kirill,
    qayerda: s.qayerda
  }));

  console.log(JSON.stringify({ soni: natija.length, shriftlar: natija }, null, 2));
}

function shriftOl(args) {
  const db = yuklaJson(FONT_PATH);
  const sorov = (args[0] || '').trim().toLowerCase();
  if (!sorov) {
    console.error('Ishlatish: node katalog.js shrift-ol <id, 01..60 yoki nom>');
    process.exit(1);
  }
  let topildi = /^\d+$/.test(sorov) ? db.shriftlar.find((x) => x.raqam === parseInt(sorov, 10)) : null;
  if (!topildi) {
    topildi = db.shriftlar.find((x) => x.id === sorov || x.nom.toLowerCase() === sorov) ||
      db.shriftlar.find((x) => x.nom.toLowerCase().includes(sorov));
  }
  if (!topildi) {
    console.error(`"${sorov}" bo'yicha shrift topilmadi.`);
    process.exit(1);
  }
  console.log(JSON.stringify({ ...topildi, html: `<link href="${topildi.link}" rel="stylesheet">` }, null, 2));
}

function juftlikRoyxat(args) {
  const db = yuklaJson(FONT_PATH);
  const qidiruv = (argOqi(args, '--qidiruv') || '').toLowerCase().trim();
  const natija = db.juftliklar.filter((j) => {
    if (!qidiruv) return true;
    return [j.id, j.nom, j.sarlavha, j.matn, j.kayfiyat, j.qayerda].join(' ').toLowerCase().includes(qidiruv);
  }).map((j) => ({
    id: j.id,
    raqam: j.raqam,
    nom: j.nom,
    sarlavha: j.sarlavha,
    matn: j.matn,
    kayfiyat: j.kayfiyat,
    qayerda: j.qayerda
  }));

  console.log(JSON.stringify({ soni: natija.length, juftliklar: natija }, null, 2));
}

function juftlikOl(args) {
  const db = yuklaJson(FONT_PATH);
  const sorov = (args[0] || '').trim().toLowerCase();
  if (!sorov) {
    console.error('Ishlatish: node katalog.js juftlik-ol <id yoki 01..24>');
    process.exit(1);
  }
  let topildi = /^\d+$/.test(sorov) ? db.juftliklar.find((x) => x.raqam === parseInt(sorov, 10)) : null;
  if (!topildi) {
    topildi = db.juftliklar.find((x) => x.id === sorov) || db.juftliklar.find((x) => x.nom.toLowerCase().includes(sorov));
  }
  if (!topildi) {
    console.error(`"${sorov}" bo'yicha shrift juftligi topilmadi.`);
    process.exit(1);
  }
  const shrift = (id) => db.shriftlar.find((s) => s.id === id);
  console.log(JSON.stringify({
    ...topildi,
    sarlavha_shrifti: shrift(topildi.sarlavha),
    matn_shrifti: shrift(topildi.matn),
    html: `<link href="${topildi.link}" rel="stylesheet">`
  }, null, 2));
}

// --- 5. Sayt uchun to'plam tanlash (sayt skilli): hammasidan keraklisini oladi ---
const SOHALAR = [
  { nom: 'Restoran va kafe', kalit: ['restoran', 'kafe', 'taom', 'ovqat', 'qahva', 'choyxona', 'oshxona', 'menyu'], juftlik: 'premium-brend', kat: ['rasm', 'karta'], ikonka: ['tools-kitchen-2', 'coffee', 'clock', 'map-pin', 'phone'] },
  { nom: 'Fintech va bank', kalit: ['fintech', 'bank', 'tolov', 'moliya', 'kredit', 'hamyon', 'sugurta'], juftlik: 'fintech-ilova', kat: ['karta', 'hero'], ikonka: ['credit-card', 'wallet', 'shield', 'trending-up', 'coin'] },
  { nom: 'Startap va IT', kalit: ['startap', 'saas', 'ai', 'dastur', 'texnologiya', 'platforma', 'ilova', 'bot'], juftlik: 'texno-startap', kat: ['hero', 'karta'], ikonka: ['rocket', 'sparkles', 'code', 'cloud', 'shield'] },
  { nom: "Onlayn do'kon", kalit: ['dokon', 'savdo', 'magazin', 'mahsulot', 'kiyim', 'market', 'katalog'], juftlik: 'kocha-uslubi', kat: ['rasm', 'karta'], ikonka: ['shopping-cart', 'shopping-bag', 'tag', 'truck', 'credit-card'] },
  { nom: "Ta'lim", kalit: ['talim', 'kurs', 'maktab', 'oquv', 'universitet', 'dars', 'akademiya'], juftlik: 'korporativ-talim', kat: ['matn', 'karta'], ikonka: ['book', 'school', 'bulb', 'certificate', 'calendar'] },
  { nom: 'Bolalar', kalit: ['bolalar', 'bogcha', 'oyinchoq', 'bola'], juftlik: 'bolalar-olami', kat: ['karta', 'hero'], ikonka: ['puzzle', 'star', 'book', 'heart', 'calendar'] },
  { nom: 'Tibbiyot va salomatlik', kalit: ['tibbiyot', 'klinika', 'shifoxona', 'stomatologiya', 'salomatlik', 'dorixona', 'shifokor'], juftlik: 'yumshoq-ilova', kat: ['hero'], ikonka: ['heart', 'activity', 'first-aid-kit', 'calendar', 'phone'] },
  { nom: 'Qurilish va texnika', kalit: ['qurilish', 'tamir', 'avto', 'texnika', 'uskuna', 'mebel', 'dekor', 'zavod'], juftlik: 'kuchli-texnika', kat: ['rasm', '3d'], ikonka: ['building', 'hammer', 'tool', 'car', 'phone'] },
  { nom: 'Agentlik va portfolio', kalit: ['portfolio', 'agentlik', 'studiya', 'dizayn', 'ijod', 'fotograf'], juftlik: 'zamonaviy-agentlik', kat: ['rasm', 'matn'], ikonka: ['palette', 'stack-2', 'vector-bezier', 'mail', 'send'] },
  { nom: "Marosim va go'zallik", kalit: ['toy', 'taklifnoma', 'marosim', 'zargarlik', 'gozallik', 'salon', 'premium', 'hashamat'], juftlik: 'nozik-marosim', kat: ['rasm'], ikonka: ['heart', 'gift', 'calendar', 'map-pin', 'diamond'] },
  { nom: 'Sport', kalit: ['sport', 'fitnes', 'zal', 'musobaqa', 'trener'], juftlik: 'sport-afisha', kat: ['hero', 'matn'], ikonka: ['barbell', 'trophy', 'medal', 'calendar', 'clock'] },
  { nom: "O'yin va tadbir", kalit: ['oyin', 'kiber', 'web3', 'kripto', 'festival', 'tadbir', 'konsert'], juftlik: 'dadil-web3', kat: ['3d', 'hero'], ikonka: ['device-gamepad-2', 'diamond', 'bolt', 'rocket', 'calendar'] },
  { nom: 'Blog va media', kalit: ['blog', 'media', 'yangilik', 'jurnal', 'maqola', 'nashr'], juftlik: 'tahririy-jurnal', kat: ['matn'], ikonka: ['file-text', 'pencil', 'bookmark', 'quote', 'share'] },
  { nom: 'Huquq va maslahat', kalit: ['huquq', 'advokat', 'yurist', 'konsalting', 'maslahat', 'buxgalter', 'notarius', 'audit'], juftlik: 'korporativ-talim', kat: ['matn'], ikonka: ['briefcase', 'shield', 'file-text', 'calendar', 'phone'] },
  { nom: 'Servis va yetkazish', kalit: ['yetkazish', 'servis', 'xizmat', 'logistika', 'taksi', 'kuryer'], juftlik: 'mazali-servis', kat: ['karta', 'hero'], ikonka: ['truck', 'package', 'map-pin', 'clock', 'phone'] }
];
const QIYINLIK = { 'Oson': 0, "O'rta": 1, 'Murakkab': 2 };

// Apostrof va tinish belgilarisiz kichik harflar: «do'kon» -> «dokon»
function sodda(s) {
  return String(s).toLowerCase().replace(/['`‘’ʻʼ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function tanla(args) {
  const sozlar = sodda(args.filter((a) => !a.startsWith('--')).join(' ')).split(' ').filter((s) => s.length >= 2);
  if (!sozlar.length) {
    console.error('Ishlatish: node katalog.js tanla <soha va kayfiyat so\'zlari>   (masalan: tanla restoran premium)');
    process.exit(1);
  }
  const mosmi = (kalit) => sozlar.some((s) => s === kalit || (s.length >= 4 && (s.startsWith(kalit) || kalit.startsWith(s))));
  const ball = (matn) => { const m = sodda(matn); return sozlar.filter((s) => s.length >= 3 && m.includes(s)).length; };

  const efDb = yuklaJson(DATA_PATH);
  const anDb = yuklaJson(ANIM_PATH);
  const icDb = yuklaJson(ICON_PATH);
  const fnDb = yuklaJson(FONT_PATH);

  const sohalar = SOHALAR.filter((s) => s.kalit.some(mosmi));
  const soha = sohalar[0] || null;

  // 1. Shrift juftligi: avval soha, keyin matn bo'yicha eng mos, bo'lmasa universal
  const matnli = fnDb.juftliklar.map((j) => ({ j, b: ball([j.nom, j.kayfiyat, j.qayerda].join(' ')) })).sort((a, b) => b.b - a.b)[0];
  const juftlik = (soha && fnDb.juftliklar.find((j) => j.id === soha.juftlik)) ||
    (matnli.b > 0 ? matnli.j : fnDb.juftliklar.find((j) => j.id === 'texno-startap'));
  const shrift = (id) => { const s = fnDb.shriftlar.find((x) => x.id === id); return { id: s.id, nom: s.nom, vaznlar: s.vaznlar, kirill: s.kirill, css: s.css }; };

  // 2. WOW effekt: ko'pi bilan 2 ta. Matnga mos kelgani, so'ng soha kategoriyasidan eng yengili
  const katlar = soha ? soha.kat : ['hero', 'karta'];
  const efTartib = efDb.effektlar.map((e) => ({ e, b: ball([e.nom, e.en, e.qayerda].join(' ')) }))
    .sort((a, b) => (b.b - a.b) || (QIYINLIK[a.e.qiyinlik] - QIYINLIK[b.e.qiyinlik]) || (a.e.raqam - b.e.raqam));
  const effektlar = [];
  // Murakkab effekt faqat kamida ikki so'z mos kelganda taklif qilinadi
  for (const x of efTartib) {
    if (effektlar.length >= 1) break;
    if (x.b > 0 && (x.e.qiyinlik !== 'Murakkab' || x.b >= 2)) effektlar.push(x.e);
  }
  for (const kat of katlar) {
    if (effektlar.length >= 2) break;
    const nomzod = efTartib.find((x) => x.e.kategoriya === kat && !effektlar.includes(x.e));
    if (nomzod) effektlar.push(nomzod.e);
  }

  // 3. CSS animatsiya: kirish + tugma + fon (dadil sohalarda matn animatsiyasi ham)
  const anim = (slug) => anDb.animatsiyalar.find((a) => a.slug === slug);
  const sokin = soha && ['Fintech va bank', 'Tibbiyot va salomatlik', "Ta'lim", 'Blog va media', 'Huquq va maslahat'].includes(soha.nom);
  const dadil = soha && ['Sport', "O'yin va tadbir", "Onlayn do'kon"].includes(soha.nom);
  const animSluglar = sokin ? ['blur-rise', 'shine-sweep', 'breathing-halo']
    : dadil ? ['spring-pop', 'jelly-squish', 'cyber-grid-flow', 'gradient-shimmer']
      : ['blur-rise', 'shine-sweep', 'aurora-shift', 'marker-underline'];
  const animatsiyalar = animSluglar.map(anim).filter(Boolean);

  // 4. Ikonkalar: soha to'plami + so'zlar bo'yicha qidiruv (bazadagi har bir yozuv alohida ikonka)
  const asosiy = icDb.ikonkalar;
  const ikSet = new Map();
  for (const id of (soha ? soha.ikonka : [])) { const ik = asosiy.find((x) => x.id === id); if (ik) ikSet.set(ik.id, ik); }
  for (const s of sozlar) {
    if (s.length < 3) continue;
    for (const ik of asosiy) {
      if (ikSet.size >= 10) break;
      if (ik.id === s || sodda(ik.nom) === s || ik.en.split(' ').includes(s)) ikSet.set(ik.id, ik);
    }
  }
  for (const id of ['phone', 'map-pin', 'mail', 'arrow-right']) {
    if (ikSet.size >= 6) break;
    const ik = asosiy.find((x) => x.id === id); if (ik) ikSet.set(ik.id, ik);
  }

  console.log(JSON.stringify({
    sorov: sozlar,
    soha: soha ? soha.nom : 'Aniqlanmadi (universal to\'plam)',
    maket: { standart: "bitta bet — bitta bo'lim", betlar: '4-6 ta', shablon: 'skills/sahifa/references/maket-shablonlar.md' },
    juftlik: {
      id: juftlik.id, nom: juftlik.nom, kayfiyat: juftlik.kayfiyat,
      sarlavha: shrift(juftlik.sarlavha), matn: shrift(juftlik.matn),
      link: juftlik.link, css: juftlik.css
    },
    effektlar: effektlar.map((e) => ({ id: e.id, nom: e.nom, kategoriya: e.kategoriya, qiyinlik: e.qiyinlik, stek: e.stek, qayerda: e.qayerda })),
    animatsiyalar: animatsiyalar.map((a) => ({ id: a.id, slug: a.slug, klass: a.klass, nom: a.nom, uslub: a.uslub })),
    ikonkalar: [...ikSet.values()].map((ik) => ({ id: ik.id, nom: ik.nom, kat: ik.kat })),
    eslatma: "Bu boshlang'ich taklif. To'liq kod uchun: ol <id>, anim-ol <slug>, ikonka-ol <id>, juftlik-ol <id>. Brend ranglari va shrifti berilgan bo'lsa, o'shalar ustun turadi."
  }, null, 2));
}

// --- 6. Vitrina va Lokal Server (faqat 3000-port) ---
function vitrinaNusxa(args) {
  const chiqish = argOqi(args, '--chiqish') || path.resolve(process.cwd(), 'hi-neo-vitrina.html');
  fs.mkdirSync(path.dirname(path.resolve(chiqish)), { recursive: true });
  fs.copyFileSync(VITRINA_PATH, chiqish);
  console.log(JSON.stringify({ tayyor: true, fayl: path.resolve(chiqish) }, null, 2));
}

function port3000Boshat() {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano | findstr :3000', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        const m = line.trim().match(/LISTENING\s+(\d+)$/);
        if (m && m[1] !== '0') pids.add(m[1]);
      }
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      }
    } else {
      execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null || true', { stdio: 'ignore' });
    }
  } catch (_) {
    // Port bo'sh
  }
}

function serverIshgaTushir(args) {
  const PORT = 3000;
  if (args.includes('--boshat')) {
    port3000Boshat();
  }

  const srv = http.createServer((req, res) => {
    const u = req.url.split('?')[0];
    if (u === '/api/effektlar') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(fs.readFileSync(DATA_PATH, 'utf8'));
    }
    if (u === '/api/animatsiyalar') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(fs.readFileSync(ANIM_PATH, 'utf8'));
    }
    if (u === '/api/ikonkalar') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(fs.readFileSync(ICON_PATH, 'utf8'));
    }
    if (u === '/api/shriftlar') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(fs.readFileSync(FONT_PATH, 'utf8'));
    }
    if (u === '/assets/neo-animations.css') {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      return res.end(fs.readFileSync(ANIM_CSS_PATH, 'utf8'));
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(fs.readFileSync(VITRINA_PATH, 'utf8'));
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error("XATO: 3000-port band. Qayta ishga tushirish uchun --boshat bayrog'ini qo'shing: node katalog.js server --boshat");
      process.exit(1);
    }
    throw err;
  });

  srv.listen(PORT, () => {
    console.log(`Hi Neo vitrinasi ishga tushdi: http://localhost:${PORT}`);
  });
}

const [, , cmd, ...rest] = process.argv;
switch (cmd) {
  case 'royxat':
    royxat(rest);
    break;
  case 'ol':
    ol(rest);
    break;
  case 'anim-royxat':
    animRoyxat(rest);
    break;
  case 'anim-ol':
    animOl(rest);
    break;
  case 'ikonka-qidir':
    ikonkaQidir(rest);
    break;
  case 'ikonka-ol':
    ikonkaOl(rest);
    break;
  case 'shrift-royxat':
    shriftRoyxat(rest);
    break;
  case 'shrift-ol':
    shriftOl(rest);
    break;
  case 'juftlik-royxat':
    juftlikRoyxat(rest);
    break;
  case 'juftlik-ol':
    juftlikOl(rest);
    break;
  case 'tanla':
    tanla(rest);
    break;
  case 'vitrina':
    vitrinaNusxa(rest);
    break;
  case 'server':
    serverIshgaTushir(rest);
    break;
  default:
    console.log(
      [
        'Hi Neo CLI (hiworld.club)',
        '  node katalog.js royxat [--kategoriya K] [--stek S] [--qidiruv Q]',
        '  node katalog.js ol <01..31 yoki nom>',
        '  node katalog.js anim-royxat [--uslub U] [--qidiruv Q]',
        '  node katalog.js anim-ol <01..64 yoki slug>',
        '  node katalog.js ikonka-qidir <soz> [--kategoriya K] [--limit 24]',
        '  node katalog.js ikonka-ol <id_yoki_raqam> [--format svg|jsx|vue]',
        '  node katalog.js shrift-royxat [--uslub U] [--qidiruv Q]',
        '  node katalog.js shrift-ol <id, 01..60 yoki nom>',
        '  node katalog.js juftlik-royxat [--qidiruv Q]',
        '  node katalog.js juftlik-ol <id yoki 01..24>',
        '  node katalog.js tanla <soha va kayfiyat so\'zlari>',
        '  node katalog.js vitrina [--chiqish ./hi-neo-vitrina.html]',
        '  node katalog.js server [--boshat]'
      ].join('\n')
    );
}
