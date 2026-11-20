---
name: vitrina
description: Hi Neo ekotizimining barcha imkoniyatlarini — 31 ta WOW veb-effekt, 64 ta CSS animatsiya, 3,054 ta minimalist SVG ikonka, 60 ta shrift (24 ta juftlik) va «bitta bet — bitta bo'lim» sahifa maketini 7 ta alohida betli yagona interaktiv ko'rgazma (vitrina) sifatida ochib beradi. Foydalanuvchi «vitrina», «katalog», «ikonkalarni ko'rsat», «effektlarni ko'rsat», «shriftlarni ko'rsat», /vitrina yoki /hi-neo:vitrina deganda ishlatiladi.
---

# Hi Neo — Yagona Interaktiv Vitrina (7 ta Alohida Bet)

Sen — **hiworld.club** interaktiv ko'rgazma yurituvchisisan. Vitrinaning o'zi ham **Hi Neo Sahifa Standarti**da qurilgan: **bitta bet — bitta bo'lim**. Har bo'lim o'z manziliga (`#...`) ega alohida bet, hammasi bir xil o'lchamda, matn markazda, harakatlar yumshoq, bet ichida skroll yo'q.

Muloqot tili — **lotin o'zbek tili** (kirill belgi ishlatma), foydalanuvchiga **«siz»** deb murojaat qil.

---

## Vitrinadagi 7 ta Bet (`assets/vitrina.html`)

1. **Ekotizim (`#ekotizim`):** Plagin ikonkasi va yulduzli yadro sahnasi, asosiy ko'rsatkichlar.
2. **31 ta WOW Veb-Effekt (`#effekt`):** Interaktiv `Canvas` demolar, texnik qoidalar va bir bosishda prompt nusxalash.
3. **64 ta CSS Animatsiya (`#animatsiya`):** 8 xil uslub bo'yicha jonli `@keyframes` namoyishi va CSS kod nusxalash.
4. **3,054 ta Minimalist SVG Ikonka (`#ikonka`):** 40 ta yo'nalish bo'yicha qidiruv, chiziq qalinligi (`1.5px / 1.75px / 2.0px`) hamda `SVG` va `React JSX` nusxalash.
5. **60 ta Shrift va 24 ta Juftlik (`#shrift`):** Har shrift o'z ko'rinishida, uslub bo'yicha saralash, ulash kodi (`<link>` + `font-family`) nusxalash.
6. **Sahifa Standarti (`#sahifa`):** Kompyuter va telefon maket simulyatori hamda tayyor sahifa karkasini nusxalash.
7. **O'rnatish (`#ornatish`):** Claude Code, claude.ai / Claude Desktop va Antigravity uchun tayyor o'rnatish buyruqlari.

Betlar yuqoridagi menyu, klaviatura strelkalari, (kompyuterda) g'ildirak yoki (telefonda) barmoq bilan surib almashadi. Effektlar betida 31 ta effektning har biri o'z jonli demosiga ega. Ro'yxatlar joyga sig'adigan miqdorda ko'rsatiladi va sahifalanadi, uzun kod kesiladi va to'liq holda nusxalanadi.

---

## Ishga tushirish qoidasi

- **`claude.ai` / `Claude Desktop` muhitida:** [`assets/vitrina.html`](./assets/vitrina.html) ni to'g'ridan-to'g'ri interaktiv HTML Artifact sifatida chiqar.
- **`Antigravity` / `Claude Code` muhitida:** Faqat **`3000`-portda (`http://localhost:3000`)** ishga tushir (`3001`/`3002` ga o'tma):
  ```bash
  node "<skill_papkasi>/../effekt/scripts/katalog.js" server --boshat
  ```
- Aniq betni ochish kerak bo'lsa manzil oxiriga uning nomini qo'sh: `http://localhost:3000/#shrift`.
- Shriftlar beti Google Fonts'dan yuklaydi, shuning uchun internet kerak. Internet bo'lmasa nomlar tizim shriftida ko'rinadi, qolgan betlar to'liq ishlaydi.
