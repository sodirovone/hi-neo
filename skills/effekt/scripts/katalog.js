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
 *   node katalog.js rang-royxat [--uslub U] [--rejim qorongi|yorug] [--qidiruv Q]
 *   node katalog.js rang-ol <id, 01..36 yoki nom>
 *   node katalog.js rang-mosla <#HEX> [--tur juft|yumshoq|yaqin|uchlik] [--rejim qorongi|yorug]
 *   node katalog.js gradient-royxat [--uslub U] [--tur linear|radial|conic] [--qidiruv Q]
 *   node katalog.js gradient-ol <id, 01..100 yoki nom>
 *   node katalog.js hero-royxat [--uslub U] [--qidiruv Q]
 *   node katalog.js hero-ol <id, 01..50 yoki nom>
 *   node katalog.js audit <fayl_yoki_papka> [--soha "saas fintech"]
 *   node katalog.js hidesign [loyiha_papkasi]
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
const RANG_PATH = path.resolve(SKILLS_DIR, 'rang', 'references', 'palitralar.json');
const GRAD_PATH = path.resolve(SKILLS_DIR, 'rang', 'references', 'gradientlar.json');
const HERO_PATH = path.resolve(SKILLS_DIR, 'sahifa', 'references', 'hero-maketlar.json');
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

// --- 5. Rang palitralari (36 ta tayyor + 1 rangdan 1-2 ta mos rang hisoblash) ---
function hexNorm(raw) {
  const s = String(raw || '').trim().replace(/^#/, '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return '#' + full.toLowerCase();
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexToHsl(hex) {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return [Math.round(h) % 360, Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

function luminans(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontrast(a, b) {
  const l1 = luminans(a), l2 = luminans(b);
  return Number(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2));
}

function palitraCss(fon, matn, ranglar) {
  const lines = [
    ':root {',
    `  --bg: ${fon};`,
    `  --text: ${matn};`,
    `  --primary: ${ranglar[0]};`,
    `  --accent: ${ranglar[1]};`
  ];
  if (ranglar[2]) lines.push(`  --accent-2: ${ranglar[2]};`);
  lines.push('}');
  return lines.join('\n');
}

function rangRoyxat(args) {
  const db = yuklaJson(RANG_PATH);
  const uslub = argOqi(args, '--uslub');
  const rejim = argOqi(args, '--rejim');
  const qidiruv = (argOqi(args, '--qidiruv') || '').toLowerCase().trim();

  const natija = db.palitralar.filter((p) => {
    if (uslub && p.uslub !== uslub.toLowerCase()) return false;
    if (rejim && p.rejim !== rejim.toLowerCase()) return false;
    if (!qidiruv) return true;
    return [p.id, p.nom, p.uslub, p.rejim, p.qayerda, ...p.ranglar].join(' ').toLowerCase().includes(qidiruv);
  });

  console.log(JSON.stringify({ soni: natija.length, palitralar: natija }, null, 2));
}

function rangOl(args) {
  const db = yuklaJson(RANG_PATH);
  const sorov = (args[0] || '').trim().toLowerCase();
  if (!sorov) {
    console.error('Ishlatish: node katalog.js rang-ol <id, 01..36 yoki nom>');
    process.exit(1);
  }
  let topildi = /^\d+$/.test(sorov) ? db.palitralar.find((x) => x.raqam === parseInt(sorov, 10)) : null;
  if (!topildi) {
    topildi = db.palitralar.find((x) => x.id === sorov || x.nom.toLowerCase() === sorov) ||
      db.palitralar.find((x) => x.nom.toLowerCase().includes(sorov));
  }
  if (!topildi) {
    console.error(`"${sorov}" bo'yicha rang palitrasi topilmadi.`);
    process.exit(1);
  }
  console.log(JSON.stringify({
    ...topildi,
    kontrast: kontrast(topildi.fon, topildi.matn),
    css: palitraCss(topildi.fon, topildi.matn, topildi.ranglar)
  }, null, 2));
}

function rangMosla(args) {
  const hex = hexNorm(args[0]);
  if (!hex) {
    console.error('Ishlatish: node katalog.js rang-mosla "#0052ff" [--tur juft|yumshoq|yaqin|uchlik] [--rejim qorongi|yorug]');
    process.exit(1);
  }
  const tur = (argOqi(args, '--tur') || 'yumshoq').toLowerCase();
  const rejim = (argOqi(args, '--rejim') || 'qorongi').toLowerCase();
  const [h, s, l] = hexToHsl(hex);
  const neytral = s < 12;
  const baseH = neytral ? 220 : h;
  const ms = neytral ? 78 : Math.max(46, Math.min(90, s));
  const ml1 = l < 28 ? 58 : l > 78 ? 44 : Math.max(44, Math.min(64, l + (l < 50 ? 10 : -8)));
  const ml2 = l < 28 ? 66 : l > 78 ? 52 : Math.max(48, Math.min(68, l + (l < 50 ? 16 : -14)));

  let mos = [];
  if (tur === 'juft') {
    mos = [hslToHex(neytral ? 218 : baseH + 180, ms, ml1)];
  } else if (tur === 'yaqin') {
    mos = [hslToHex(baseH - 32, ms, ml1), hslToHex(baseH + 32, Math.max(42, ms - 6), ml2)];
  } else if (tur === 'uchlik') {
    mos = [hslToHex(baseH + 120, ms, ml1), hslToHex(baseH + 240, Math.max(42, ms - 4), ml2)];
  } else {
    mos = [hslToHex(baseH + 150, ms, ml1), hslToHex(baseH + 210, Math.max(42, ms - 6), ml2)];
  }

  const ranglar = [hex, ...mos];
  const fon = rejim === 'yorug' ? hslToHex(baseH, neytral ? 12 : 26, 97) : hslToHex(baseH, neytral ? 16 : 36, 7);
  const matn = rejim === 'yorug' ? '#0f172a' : '#f1f5f9';

  console.log(JSON.stringify({
    asosiy: hex,
    tur,
    rejim,
    fon,
    matn,
    ranglar,
    kontrast: kontrast(fon, matn),
    css: palitraCss(fon, matn, ranglar)
  }, null, 2));
}

function gradientCss(g) {
  const stops = g.toxtashlar.map((t) => `${t.rang} ${t.joy}%`).join(', ');
  if (g.tur === 'radial') return `radial-gradient(circle at ${g.x}% ${g.y}%, ${stops})`;
  if (g.tur === 'conic') return `conic-gradient(from ${g.burchak}deg at ${g.x}% ${g.y}%, ${stops})`;
  return `linear-gradient(${g.burchak}deg, ${stops})`;
}

function gradientRoyxat(args) {
  const db = yuklaJson(GRAD_PATH);
  const uslub = argOqi(args, '--uslub');
  const tur = argOqi(args, '--tur');
  const qidiruv = (argOqi(args, '--qidiruv') || '').toLowerCase().trim();

  const natija = db.gradientlar.filter((g) => {
    if (uslub && g.uslub !== uslub.toLowerCase()) return false;
    if (tur && g.tur !== tur.toLowerCase()) return false;
    if (!qidiruv) return true;
    return [g.id, g.nom, g.uslub, g.tur, g.qayerda, ...g.toxtashlar.map((t) => t.rang)].join(' ').toLowerCase().includes(qidiruv);
  }).map((g) => ({
    raqam: g.raqam,
    id: g.id,
    nom: g.nom,
    uslub: g.uslub,
    tur: g.tur,
    css: gradientCss(g)
  }));

  console.log(JSON.stringify({ soni: natija.length, gradientlar: natija }, null, 2));
}

function gradientOl(args) {
  const db = yuklaJson(GRAD_PATH);
  const sorov = (args[0] || '').trim().toLowerCase();
  if (!sorov) {
    console.error('Ishlatish: node katalog.js gradient-ol <id, 01..100 yoki nom>');
    process.exit(1);
  }
  let topildi = /^\d+$/.test(sorov) ? db.gradientlar.find((x) => x.raqam === parseInt(sorov, 10)) : null;
  if (!topildi) {
    topildi = db.gradientlar.find((x) => x.id === sorov || x.nom.toLowerCase() === sorov) ||
      db.gradientlar.find((x) => x.nom.toLowerCase().includes(sorov));
  }
  if (!topildi) {
    console.error(`"${sorov}" bo'yicha gradient topilmadi.`);
    process.exit(1);
  }
  const bg = gradientCss(topildi);
  console.log(JSON.stringify({
    ...topildi,
    css: `background: ${bg};`
  }, null, 2));
}

// --- 5b. 50 ta Hero / Birinchi bet maketi (Supahero ilhomli) ---
function heroRoyxat(args) {
  const db = yuklaJson(HERO_PATH);
  const uslub = argOqi(args, '--uslub');
  const qidiruv = (argOqi(args, '--qidiruv') || '').toLowerCase().trim();

  const natija = db.maketlar.filter((h) => {
    if (uslub && h.uslub !== uslub.toLowerCase()) return false;
    if (!qidiruv) return true;
    return [h.id, h.nom, h.uslub, h.sxema, h.qayerda, ...h.tarkib].join(' ').toLowerCase().includes(qidiruv);
  }).map((h) => ({
    raqam: h.raqam,
    id: h.id,
    nom: h.nom,
    uslub: h.uslub,
    sxema: h.sxema,
    tarkib: h.tarkib,
    qayerda: h.qayerda
  }));

  console.log(JSON.stringify({ soni: natija.length, maketlar: natija }, null, 2));
}

function heroOl(args) {
  const db = yuklaJson(HERO_PATH);
  const sorov = (args[0] || '').trim().toLowerCase();
  if (!sorov) {
    console.error('Ishlatish: node katalog.js hero-ol <id, 01..50 yoki nom>');
    process.exit(1);
  }
  let topildi = /^\d+$/.test(sorov) ? db.maketlar.find((x) => x.raqam === parseInt(sorov, 10)) : null;
  if (!topildi) {
    topildi = db.maketlar.find((x) => x.id === sorov || x.nom.toLowerCase() === sorov) ||
      db.maketlar.find((x) => x.nom.toLowerCase().includes(sorov));
  }
  if (!topildi) {
    console.error(`"${sorov}" bo'yicha Hero maket topilmadi.`);
    process.exit(1);
  }
  console.log(JSON.stringify(topildi, null, 2));
}

// --- 5c. Avtomatik Dizayn Audit (har bir betda muammo topish + uslub taklifi + tuzatish rejasi) ---
function auditTekshir(args) {
  const nishon = args.find((a) => !a.startsWith('--'));
  const sohaSorov = argOqi(args, '--soha') || '';
  if (!nishon) {
    console.error('Ishlatish: node katalog.js audit <fayl_yoki_papka> [--soha "saas fintech"]');
    process.exit(1);
  }
  const toliqYol = path.resolve(process.cwd(), nishon);
  if (!fs.existsSync(toliqYol)) {
    console.error(`Topilmadi: ${toliqYol}`);
    process.exit(1);
  }

  const KENG = new Set(['.html', '.css', '.jsx', '.tsx', '.vue', '.svelte']);
  const fayllar = [];
  function yig(p) {
    const st = fs.statSync(p);
    if (st.isFile()) {
      if (KENG.has(path.extname(p).toLowerCase())) fayllar.push(p);
    } else if (st.isDirectory()) {
      for (const e of fs.readdirSync(p, { withFileTypes: true })) {
        if (['node_modules', '.git', 'dist', '.next', 'build'].includes(e.name)) continue;
        yig(path.join(p, e.name));
      }
    }
  }
  yig(toliqYol);

  let jamiMatn = '';
  for (const f of fayllar) jamiMatn += '\n' + fs.readFileSync(f, 'utf8');

  const muammolar = [];
  let ball = 100;

  // 1. Ortiqcha effektlar va neon shovqin
  const animSoni = (jamiMatn.match(/@keyframes\s+/g) || []).length;
  const shadowSoni = (jamiMatn.match(/box-shadow\s*:/g) || []).length;
  const neonBinafsha = (jamiMatn.match(/#(a855f7|9333ea|c026d3|d946ef|ec4899|ff00ff|7c3aed)/gi) || []).length;
  if (animSoni > 8 || shadowSoni > 18) {
    ball -= 18;
    muammolar.push({
      tur: 'effekt',
      daraja: 'yuqori',
      muammo: `Haddan tashqari effekt va soyalar (${animSoni} ta @keyframes, ${shadowSoni} ta box-shadow)`,
      yechim: "Bitta betda ko'pi bilan 1-2 ta yumshoq harakat qoldiring, qolgan bezak soyalarni olib tashlang."
    });
  }
  if (neonBinafsha >= 6) {
    ball -= 12;
    muammolar.push({
      tur: 'uslub',
      daraja: 'orta',
      muammo: `Shovqinli binafsha-neon urg'ular ko'p (${neonBinafsha} joyda)`,
      yechim: "Mahsulot ruhiga mos sokin, qat'iy palitraga o'ting (masalan, minimalist qorong'i yoki toza yorug' tizim)."
    });
  }

  // 2. O'qiluvchanlik: shriftlar, mayda matn, :root tokenlari
  const shriftlar = new Set(
    [...jamiMatn.matchAll(/font-family\s*:\s*([^;}{]+)/gi)].map((m) => m[1].trim().toLowerCase())
  );
  if (shriftlar.size > 3) {
    ball -= 14;
    muammolar.push({
      tur: 'oqiluvchanlik',
      daraja: 'yuqori',
      muammo: `Haddan ortiq shrift oilasi ishlatilgan (${shriftlar.size} xil)`,
      yechim: "Ko'pi bilan 2 ta shrift qoldiring: 1 ta sarlavha + 1 ta asosiy matn (`juftlik-royxat`)."
    });
  }
  const maydaMatn = (jamiMatn.match(/font-size\s*:\s*(9|10|11)px/g) || []).length;
  if (maydaMatn >= 4) {
    ball -= 10;
    muammolar.push({
      tur: 'oqiluvchanlik',
      daraja: 'orta',
      muammo: `Juda mayda o'qilishi qiyin matnlar topildi (${maydaMatn} joyda <= 11px)`,
      yechim: "Asosiy matnni kamida 15-16px, yordamchi matnni kamida 12-13px va line-height: 1.55 qiling."
    });
  }
  const hexRanglar = new Set((jamiMatn.match(/#[0-9a-fA-F]{6}\b/g) || []).map((x) => x.toLowerCase()));
  if (hexRanglar.size > 12 && !jamiMatn.includes(':root')) {
    ball -= 14;
    muammolar.push({
      tur: 'rang',
      daraja: 'yuqori',
      muammo: `Tarqoq ranglar (${hexRanglar.size} ta HEX) va :root tokenlar tizimi yo'q`,
      yechim: "60/30/10 qoidasi bo'yicha bitta :root palitrasiga o'tkazing (`rang-royxat` yoki `rang-mosla`)."
    });
  }

  // 3. Chalg'ituvchi unsurlar va tartibsiz joylashuv
  const ichkiSkroll = (jamiMatn.match(/overflow(-[xy])?\s*:\s*(auto|scroll)/g) || []).length;
  if (ichkiSkroll > 0) {
    ball -= 12;
    muammolar.push({
      tur: 'maket',
      daraja: 'orta',
      muammo: `Bet ichida skroll chiziqlari bor (${ichkiSkroll} joyda overflow: auto/scroll)`,
      yechim: "Matnni qisqartiring yoki ro'yxatni sahifalang — bet ichida skroll qoldirmang."
    });
  }
  const pillBadge = (jamiMatn.match(/class=["'][^"']*(badge|pill|eyebrow|kicker-pill)[^"']*["']/gi) || []).length;
  if (pillBadge >= 4) {
    ball -= 10;
    muammolar.push({
      tur: 'chalgituvchi',
      daraja: 'orta',
      muammo: `E'tiborni bo'luvchi ortiqcha yorliqlar (${pillBadge} ta badge/pill)`,
      yechim: "Sarlavha tepasidagi dekorativ yorliqlarni olib tashlang, asosiy sarlavha va bitta CTA ni ajrating."
    });
  }
  if (!jamiMatn.includes('@media')) {
    ball -= 10;
    muammolar.push({
      tur: 'maket',
      daraja: 'orta',
      muammo: "Mobil moslashuv (@media) topilmadi",
      yechim: "1024px dan kichik ekranlar uchun ustma-ust moslashuv (100svh) qo'shing."
    });
  }

  ball = Math.max(15, ball);
  const rgDb = yuklaJson(RANG_PATH);
  const fnDb = yuklaJson(FONT_PATH);
  const hmDb = yuklaJson(HERO_PATH);
  const soz = sodda(sohaSorov || path.basename(toliqYol));
  const mosSoha = SOHALAR.find((s) => s.kalit.some((k) => soz.includes(k))) || SOHALAR[2];

  const tavsiyaPalitra = rgDb.palitralar.find((p) => p.id === mosSoha.palitra) || rgDb.palitralar[0];
  const tavsiyaJuftlik = fnDb.juftliklar.find((j) => j.id === mosSoha.juftlik) || fnDb.juftliklar[0];
  const tavsiyaHero = hmDb.maketlar.find((h) => h.id === mosSoha.hero) || hmDb.maketlar[0];

  console.log(JSON.stringify({
    tekshirilgan_fayllar: fayllar.length,
    baho: `${ball} / 100`,
    holat: ball >= 85 ? 'Yaxshi' : ball >= 65 ? "O'rtacha (tuzatish tavsiya etiladi)" : 'Tuzatish zarur',
    bosqich_1_audit: muammolar.length ? muammolar : [{ tur: 'toza', daraja: 'past', muammo: 'Jiddiy muammo topilmadi', yechim: "Faqat yakuniy vizual ko'rikni bajaring." }],
    bosqich_2_uslub: {
      soha: mosSoha.nom,
      palitra: { id: tavsiyaPalitra.id, nom: tavsiyaPalitra.nom, fon: tavsiyaPalitra.fon, ranglar: tavsiyaPalitra.ranglar },
      shrift_juftlik: { id: tavsiyaJuftlik.id, nom: tavsiyaJuftlik.nom },
      hero_maket: { raqam: tavsiyaHero.raqam, id: tavsiyaHero.id, nom: tavsiyaHero.nom }
    },
    bosqich_3_kod_tuzatish: [
      "1. Masofalarni tekislash: yagona 8px ritm, o'rtaga tekislash va ichki skrollarni olib tashlash",
      "2. Rang va kontrast: yagona :root tokenlar, WCAG AA >= 4.5:1 va ortiqcha neonlarni o'chirish",
      "3. Shriftlar: bitta sarlavha va bitta matn shriftiga o'tkazish, qator oralig'ini 1.55+ qilish",
      "4. Asosiyni ajratish: chalg'ituvchi yorliqlarni olib tashlab, bitta aniq CTA tugmani ko'tarish"
    ]
  }, null, 2));
}

// --- 6. Sayt uchun to'plam tanlash (sayt skilli): hammasidan keraklisini oladi ---
const SOHALAR = [
  { nom: 'Restoran va kafe', kalit: ['restoran', 'kafe', 'taom', 'ovqat', 'qahva', 'choyxona', 'oshxona', 'menyu'], juftlik: 'premium-brend', palitra: 'qahva-qaymoq', hero: 'qahva-arka', kat: ['rasm', 'karta'], ikonka: ['tools-kitchen-2', 'coffee', 'clock', 'map-pin', 'phone'] },
  { nom: 'Fintech va bank', kalit: ['fintech', 'bank', 'tolov', 'moliya', 'kredit', 'hamyon', 'sugurta'], juftlik: 'fintech-ilova', palitra: 'kvant-yalpiz', hero: 'vertikal-fintech-karta', kat: ['karta', 'hero'], ikonka: ['credit-card', 'wallet', 'shield', 'trending-up', 'coin'] },
  { nom: 'Startap va IT', kalit: ['startap', 'saas', 'ai', 'dastur', 'texnologiya', 'platforma', 'ilova', 'bot'], juftlik: 'texno-startap', palitra: 'hi-neo-neon', hero: 'bento-ekotizim', kat: ['hero', 'karta'], ikonka: ['rocket', 'sparkles', 'code', 'cloud', 'shield'] },
  { nom: "Onlayn do'kon", kalit: ['dokon', 'savdo', 'magazin', 'mahsulot', 'kiyim', 'market', 'katalog'], juftlik: 'kocha-uslubi', palitra: 'kocha-uslubi', hero: 'dokon-uch-mahsulot', kat: ['rasm', 'karta'], ikonka: ['shopping-cart', 'shopping-bag', 'tag', 'truck', 'credit-card'] },
  { nom: "Ta'lim", kalit: ['talim', 'kurs', 'maktab', 'oquv', 'universitet', 'dars', 'akademiya'], juftlik: 'korporativ-talim', palitra: 'talim-markazi', hero: 'kurs-talim-hero', kat: ['matn', 'karta'], ikonka: ['book', 'school', 'bulb', 'certificate', 'calendar'] },
  { nom: 'Bolalar', kalit: ['bolalar', 'bogcha', 'oyinchoq', 'bola'], juftlik: 'bolalar-olami', palitra: 'rangli-bolalar', hero: 'uch-ekran-ilova', kat: ['karta', 'hero'], ikonka: ['puzzle', 'star', 'book', 'heart', 'calendar'] },
  { nom: 'Tibbiyot va salomatlik', kalit: ['tibbiyot', 'klinika', 'shifoxona', 'stomatologiya', 'salomatlik', 'dorixona', 'shifokor'], juftlik: 'yumshoq-ilova', palitra: 'yalpiz-tong', hero: 'b2b-kalendar-bron', kat: ['hero'], ikonka: ['heart', 'activity', 'first-aid-kit', 'calendar', 'phone'] },
  { nom: 'Qurilish va texnika', kalit: ['qurilish', 'tamir', 'avto', 'texnika', 'uskuna', 'mebel', 'dekor', 'zavod'], juftlik: 'kuchli-texnika', palitra: 'obsidiyan-mis', hero: 'gadjet-xususiyat', kat: ['rasm', '3d'], ikonka: ['building', 'hammer', 'tool', 'car', 'phone'] },
  { nom: 'Agentlik va portfolio', kalit: ['portfolio', 'agentlik', 'studiya', 'dizayn', 'ijod', 'fotograf'], juftlik: 'zamonaviy-agentlik', palitra: 'skandinaviya-oq', hero: 'pastki-kino-hero', kat: ['rasm', 'matn'], ikonka: ['palette', 'stack-2', 'vector-bezier', 'mail', 'send'] },
  { nom: "Marosim va go'zallik", kalit: ['toy', 'taklifnoma', 'marosim', 'zargarlik', 'gozallik', 'salon', 'premium', 'hashamat'], juftlik: 'nozik-marosim', palitra: 'shampan-oq', hero: 'hashamat-oltin', kat: ['rasm'], ikonka: ['heart', 'gift', 'calendar', 'map-pin', 'diamond'] },
  { nom: 'Sport', kalit: ['sport', 'fitnes', 'zal', 'musobaqa', 'trener'], juftlik: 'sport-afisha', palitra: 'sport-energiya', hero: 'diagonal-energiya', kat: ['hero', 'matn'], ikonka: ['barbell', 'trophy', 'medal', 'calendar', 'clock'] },
  { nom: "O'yin va tadbir", kalit: ['oyin', 'kiber', 'web3', 'kripto', 'festival', 'tadbir', 'konsert'], juftlik: 'dadil-web3', palitra: 'tun-binafsha', hero: 'kiber-neon-hud', kat: ['3d', 'hero'], ikonka: ['device-gamepad-2', 'diamond', 'bolt', 'rocket', 'calendar'] },
  { nom: 'Blog va media', kalit: ['blog', 'media', 'yangilik', 'jurnal', 'maqola', 'nashr'], juftlik: 'tahririy-jurnal', palitra: 'qogoz-siyoh', hero: 'jurnal-broadsheet', kat: ['matn'], ikonka: ['file-text', 'pencil', 'bookmark', 'quote', 'share'] },
  { nom: 'Huquq va maslahat', kalit: ['huquq', 'advokat', 'yurist', 'konsalting', 'maslahat', 'buxgalter', 'notarius', 'audit'], juftlik: 'korporativ-talim', palitra: 'safir-qirol', hero: 'korporativ-raqamlar', kat: ['matn'], ikonka: ['briefcase', 'shield', 'file-text', 'calendar', 'phone'] },
  { nom: 'Servis va yetkazish', kalit: ['yetkazish', 'servis', 'xizmat', 'logistika', 'taksi', 'kuryer'], juftlik: 'mazali-servis', palitra: 'yetkazish-tez', hero: 'telefon-orbita-xabar', kat: ['karta', 'hero'], ikonka: ['truck', 'package', 'map-pin', 'clock', 'phone'] }
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
  const rgDb = yuklaJson(RANG_PATH);
  const hmDb = yuklaJson(HERO_PATH);

  const sohalar = SOHALAR.filter((s) => s.kalit.some(mosmi));
  const soha = sohalar[0] || null;

  // 0. Rang palitrasi va Hero birinchi bet maketi
  const rgMatn = rgDb.palitralar.map((p) => ({ p, b: ball([p.nom, p.uslub, p.qayerda].join(' ')) })).sort((a, b) => b.b - a.b)[0];
  const palitra = (soha && rgDb.palitralar.find((p) => p.id === soha.palitra)) ||
    (rgMatn.b > 0 ? rgMatn.p : rgDb.palitralar[0]);
  const hmMatn = hmDb.maketlar.map((h) => ({ h, b: ball([h.nom, h.uslub, h.qayerda].join(' ')) })).sort((a, b) => b.b - a.b)[0];
  const hero = (soha && hmDb.maketlar.find((h) => h.id === soha.hero)) ||
    (hmMatn.b > 0 ? hmMatn.h : hmDb.maketlar[0]);

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
    maket: {
      standart: "bitta bet — bitta bo'lim",
      betlar: '4-6 ta',
      hero: { raqam: hero.raqam, id: hero.id, nom: hero.nom, uslub: hero.uslub, tarkib: hero.tarkib },
      shablon: 'skills/sahifa/references/maket-shablonlar.md'
    },
    palitra: {
      id: palitra.id, nom: palitra.nom, uslub: palitra.uslub, rejim: palitra.rejim,
      fon: palitra.fon, matn: palitra.matn, ranglar: palitra.ranglar,
      css: palitraCss(palitra.fon, palitra.matn, palitra.ranglar)
    },
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
    if (u === '/api/palitralar') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(fs.readFileSync(RANG_PATH, 'utf8'));
    }
    if (u === '/api/gradientlar') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(fs.readFileSync(GRAD_PATH, 'utf8'));
    }
    if (u === '/api/hero-maketlar') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(fs.readFileSync(HERO_PATH, 'utf8'));
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

// --- 7. /hidesign — hiworld plagini tekshiruvi + 8 bosqichli professional dizayn rejasi ---
function hidesignReja(args) {
  const papka = path.resolve(process.cwd(), args.find((a) => !a.startsWith('--')) || '.');
  const tek = (rel) => fs.existsSync(path.join(papka, rel));

  const hiworldHujjatlar = ['PRD.md', 'STACK.md', 'ROADMAP.md', 'DECISIONS.md', 'KENGASH.md', '.hiworld/tergov.md']
    .filter((f) => tek(f));
  const sprintsBor = tek('sprints');

  if (!tek('PRD.md')) {
    console.log(JSON.stringify({
      tayyor: false,
      sabab: "Loyihada hiworld plagini hujjatlari (PRD.md) topilmadi.",
      talab: "Avval hiworld plaginini (sodirovone/hiworld-plugin) ishlatib aniqla -> tergov -> prdla -> kengash bosqichlaridan o'ting va saytingiz asosini quring.",
      ornatish: [
        "/plugin marketplace add sodirovone/hiworld-plugin",
        "/plugin install hiworld@hiworld"
      ],
      topilgan_hujjatlar: hiworldHujjatlar
    }, null, 2));
    return;
  }

  const prdMatn = fs.readFileSync(path.join(papka, 'PRD.md'), 'utf8');
  const stackMatn = tek('STACK.md') ? fs.readFileSync(path.join(papka, 'STACK.md'), 'utf8') : '';

  // Loyihadagi mavjud sayt betlarini aniqlash
  const betlar = [];
  function betQidir(dir, chuqur) {
    if (chuqur > 4 || !fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', '.next', 'dist', 'build', '.hiworld'].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) betQidir(full, chuqur + 1);
      else if (/^(page\.(tsx|jsx|js)|index\.html|.*\.html)$/.test(e.name)) {
        betlar.push(path.relative(papka, full).replace(/\\/g, '/'));
      }
    }
  }
  betQidir(papka, 0);

  const soz = sodda(prdMatn.slice(0, 2000));
  const mosSoha = SOHALAR.find((s) => s.kalit.some((k) => soz.includes(k))) || SOHALAR[2];

  const rgDb = yuklaJson(RANG_PATH);
  const grDb = yuklaJson(GRAD_PATH);
  const fnDb = yuklaJson(FONT_PATH);
  const hmDb = yuklaJson(HERO_PATH);
  const efDb = yuklaJson(DATA_PATH);

  const palitra = rgDb.palitralar.find((p) => p.id === mosSoha.palitra) || rgDb.palitralar[0];
  const gradient = grDb.gradientlar.find((g) => g.uslub === 'xameleon') || grDb.gradientlar[0];
  const juftlik = fnDb.juftliklar.find((j) => j.id === mosSoha.juftlik) || fnDb.juftliklar[0];
  const hero = hmDb.maketlar.find((h) => h.id === mosSoha.hero) || hmDb.maketlar[0];
  const effekt = efDb.effektlar.find((e) => e.kategoriya === (mosSoha.kat[0] || 'hero')) || efDb.effektlar[0];

  console.log(JSON.stringify({
    tayyor: true,
    hiworld_hujjatlar: hiworldHujjatlar,
    sprints_papka: sprintsBor,
    aniqlangan_soha: mosSoha.nom,
    stek: stackMatn.includes('Next.js') ? 'Next.js + TypeScript + Tailwind CSS' : 'HTML / CSS / JS',
    topilgan_betlar: betlar.slice(0, 24),
    etaplar: [
      { bosqich: 1, nom: "Rang va Gradient (/rang)", tanlov: { palitra: palitra.id, nom: palitra.nom, fon: palitra.fon, ranglar: palitra.ranglar, gradient: gradient.id } },
      { bosqich: 2, nom: "Umumiy Uslub va DESIGN.md (/sahifa)", vazifa: "DESIGN.md yozish: 8px ritm, tabletkasiz sarlavha, markazlashgan matn, skrollsiz betlar" },
      { bosqich: 3, nom: "Shriftlar (/shrift)", tanlov: { id: juftlik.id, nom: juftlik.nom, link: juftlik.link } },
      { bosqich: 4, nom: "Ikonkalar (/ikonka)", tanlov: { uslub: "Neo Minimal Line 24 (1.75px)", boshlangich: mosSoha.ikonka } },
      { bosqich: 5, nom: "Animatsiyalar (/animatsiya)", tanlov: ["blur-rise", "shine-sweep", "aurora-shift"] },
      { bosqich: 6, nom: "1-bet Hero va WOW Effekt (/sahifa + /effekt)", tanlov: { hero: { raqam: hero.raqam, id: hero.id, nom: hero.nom }, effekt: { id: effekt.id, nom: effekt.nom } } },
      { bosqich: 7, nom: "Har Bir Bet Uchun Rasm Promptlari va Generatsiya", vazifa: "Har bir bet uchun bitta palitrada rasm promptini DESIGN.md ga yozish va mavjud vosita bilan generatsiya qilib ulash" },
      { bosqich: 8, nom: "Yakuniy Avtomatik Audit (/audit)", vazifa: "Har bir betda Audit -> Uslub -> Kodda tuzatish (node katalog.js audit .) va http://localhost:3000 da PC + Mobil tekshiruv" }
    ]
  }, null, 2));
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
  case 'rang-royxat':
    rangRoyxat(rest);
    break;
  case 'rang-ol':
    rangOl(rest);
    break;
  case 'rang-mosla':
    rangMosla(rest);
    break;
  case 'gradient-royxat':
    gradientRoyxat(rest);
    break;
  case 'gradient-ol':
    gradientOl(rest);
    break;
  case 'hero-royxat':
    heroRoyxat(rest);
    break;
  case 'hero-ol':
    heroOl(rest);
    break;
  case 'audit':
    auditTekshir(rest);
    break;
  case 'hidesign':
    hidesignReja(rest);
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
        '  node katalog.js rang-royxat [--uslub U] [--rejim qorongi|yorug] [--qidiruv Q]',
        '  node katalog.js rang-ol <id, 01..36 yoki nom>',
        '  node katalog.js rang-mosla "#0052ff" [--tur juft|yumshoq|yaqin|uchlik] [--rejim qorongi|yorug]',
        '  node katalog.js gradient-royxat [--uslub U] [--tur linear|radial|conic] [--qidiruv Q]',
        '  node katalog.js gradient-ol <id, 01..100 yoki nom>',
        '  node katalog.js hero-royxat [--uslub U] [--qidiruv Q]',
        '  node katalog.js hero-ol <id, 01..50 yoki nom>',
        '  node katalog.js audit <fayl_yoki_papka> [--soha "saas fintech"]',
        '  node katalog.js hidesign [loyiha_papkasi]',
        '  node katalog.js tanla <soha va kayfiyat so\'zlari>',
        '  node katalog.js vitrina [--chiqish ./hi-neo-vitrina.html]',
        '  node katalog.js server [--boshat]'
      ].join('\n')
    );
}
