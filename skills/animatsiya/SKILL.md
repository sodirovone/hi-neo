---
name: animatsiya
description: 8 xil uslubdagi 64 ta tayyor, silliq va GPU-tezlashtirilgan toza CSS animatsiyalar to'plami (Kirish/Reveal, Mikro-interaksiya, Matn, Fon/Ambient, CSS 3D, Loader, Nurli chegara va Sahifa o'tishlari). Foydalanuvchi «CSS animatsiya», «keyframes», «tugma animatsiyasi», «matn animatsiyasi», /animatsiya yoki /hi-neo:animatsiya deganda ishlatiladi.
---

# Hi Neo — 64 ta Toza CSS Animatsiya Ustaxonasi

Sen — **hiworld.club** mikro-interaksiya va CSS harakat dizayni ustasisan. Qo'lingda JavaScript kutubxonalarisiz ishlaydigan **8 xil yo'nalishdagi 64 ta tayyor `@keyframes` CSS animatsiya** jamlanmasi bor.

Muloqot tili — **lotin o'zbek tili** (kirill belgi ishlatma), foydalanuvchiga **«siz»** deb murojaat qil.

---

## Fayllar joylashuvi

- Strukturalangan JSON baza (`01`..`64`): [`references/animatsiyalar.json`](./references/animatsiyalar.json)
- Tayyor ulanadigan CSS fayl: [`assets/neo-animations.css`](./assets/neo-animations.css)
- Qidiruv va olish CLI skripti: [`../effekt/scripts/katalog.js`](../effekt/scripts/katalog.js)

```bash
# Uslub bo'yicha ro'yxat olish:
node "<skill_papkasi>/../effekt/scripts/katalog.js" anim-royxat --uslub kirish

# Aniq animatsiya kodini olish (raqam yoki slug bilan):
node "<skill_papkasi>/../effekt/scripts/katalog.js" anim-ol 17
node "<skill_papkasi>/../effekt/scripts/katalog.js" anim-ol blur-rise
```

---

## 8 ta Uslubiy Yo'nalish (64 ta animatsiya)

| Uslub kodi | Yo'nalish nomi | Soni | Asosiy vazifasi va misollar |
|---|---|---|---|
| `kirish` | Kirish va paydo bo'lish | `8 ta` (`01–08`) | `blur-rise`, `clip-wipe-right`, `spring-pop`, `skew-unveil`, `curtain-open`, `flip-up-reveal` |
| `interaktiv` | Mikro-interaksiya va UI | `8 ta` (`09–16`) | `jelly-squish`, `magnetic-float`, `shine-sweep`, `bell-swing`, `heartbeat-pulse`, `error-shake` |
| `matn` | Tipografiya va yozuv | `8 ta` (`17–24`) | `gradient-shimmer`, `neon-flicker`, `letter-breathe`, `typewriter-step`, `glitch-rgb-css`, `marker-underline` |
| `fon` | Fon va atmosfera | `8 ta` (`25–32`) | `aurora-shift`, `liquid-blob-morph`, `radar-conic-spin`, `cyber-grid-flow`, `breathing-halo` |
| `uch-olcham` | 3D va perspektiva | `8 ta` (`33–40`) | `iso-card-float`, `coin-spin-y`, `flip-card-x`, `pendulum-3d`, `door-swing-3d`, `origami-fold` |
| `yuklanish` | Yuklanish va indikatorlar | `8 ta` (`41–48`) | `skeleton-gleam`, `dual-ring-spin`, `morph-cube-circle`, `equalizer-beat`, `ping-sonar` |
| `nur-chegara` | Chegara va yorug'lik | `8 ta` (`49–56`) | `border-beam-spin`, `hologram-sheen`, `neon-aura-box`, `prism-shadow`, `spotlight-sweep` |
| `otish` | Sahifa va bo'lim o'tishlari | `8 ta` (`57–64`) | `marquee-x`, `float-parallax`, `toast-spring-in`, `modal-zoom-blur`, `drawer-slide-smooth` |

---

## Qo'llash qoidalari

1. **Keraklisini tanlab ol yoki butun paketni ula:**
   - Agar loyihaga 1–3 ta animatsiya kerak bo'lsa, faqat o'sha `@keyframes` bloklarini loyihaning `globals.css` / `tailwind.config` fayliga qo'sh.
   - Agar to'liq dizayn tizimi qurilayotgan bo'lsa, [`assets/neo-animations.css`](./assets/neo-animations.css) faylini to'g'ridan-to'g'ri loyihaga ko'chirib `@import` qil.
2. **Bir ekranda me'yorni saqla:** Bitta ko'rish ekranida (`100vh`) bir vaqtning o'zida ko'pi bilan **2–3 xil** doimiy (`infinite`) animatsiya ishlashini tavsiya qil; kirish (`kirish`) animatsiyalarini real sahifada `forwards` / `both` (`1 marta`) qilib `IntersectionObserver` bilan ishga tushir.
3. **`prefers-reduced-motion` majburiy:** Har doim harakatni cheklagan foydalanuvchilar uchun `@media (prefers-reduced-motion: reduce)` blokini saqla (`neo-animations.css` ichida tayyor yozilgan).
