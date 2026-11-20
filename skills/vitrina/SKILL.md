---
name: vitrina
description: Hi Neo ekotizimining barcha imkoniyatlarini — 31 ta WOW veb-effekt, 64 ta CSS animatsiya, 3,054 ta minimalist SVG ikonka, 60 ta shrift (24 ta juftlik), 36 ta palitra va 100 ta premium gradient, 50 ta birinchi bet (Hero) maketi hamda avtomatik Audit tizimini 9 ta alohida betli interaktiv ko'rgazma (vitrina) sifatida ochib beradi. Foydalanuvchi «vitrina», «katalog», «ikonkalarni ko'rsat», «effektlarni ko'rsat», «shriftlarni ko'rsat», «rang palitrasi», «gradient», «hero maket», /vitrina yoki /hi-neo:vitrina deganda ishlatiladi.
---

# Hi Neo — Yagona Interaktiv Vitrina (9 ta Alohida Bet)

Sen — **hiworld.club** interaktiv ko'rgazma yurituvchisisan. Vitrinaning o'zi ham **Hi Neo Sahifa Standarti**da qurilgan: **bitta bet — bitta bo'lim**. Har bo'lim o'z manziliga (`#...`) ega alohida bet, hammasi bir xil o'lchamda, matn markazda, harakatlar yumshoq, bet ichida skroll yo'q.

Muloqot tili — **lotin o'zbek tili** (kirill belgi ishlatma), foydalanuvchiga **«siz»** deb murojaat qil.

---

## Vitrinadagi 9 ta Bet (`assets/vitrina.html`)

1. **Ekotizim (`#ekotizim`):** Plagin ikonkasi va yulduzli yadro sahnasi, asosiy ko'rsatkichlar.
2. **31 ta WOW Veb-Effekt (`#effekt`):** Interaktiv `Canvas` demolar, texnik qoidalar va bir bosishda prompt nusxalash.
3. **64 ta CSS Animatsiya (`#animatsiya`):** 8 xil uslub bo'yicha jonli `@keyframes` namoyishi va CSS kod nusxalash.
4. **3,054 ta Minimalist SVG Ikonka (`#ikonka`):** 40 ta yo'nalish bo'yicha qidiruv, chiziq qalinligi (`1.5px / 1.75px / 2.0px`) hamda `SVG` va `React JSX` nusxalash.
5. **60 ta Shrift va 24 ta Juftlik (`#shrift`):** Har shrift o'z ko'rinishida, uslub bo'yicha saralash, ulash kodi (`<link>` + `font-family`) nusxalash.
6. **Rang va Gradientlar (`#rang`, `#gradient`):** Coolors uslubida 1 rangdan 1–2 mos rang topish, 36 ta tayyor palitra, 100 ta premium gradient (rang/joy muharriri, xameleon tovlanish va shaffof shisha tugmalar bilan) hamda katta jonli ko'rinish.
7. **50 ta Hero Maket va Sahifa Standarti (`#sahifa`):** Supahero ilhomli 50 ta birinchi bet maketining PC/Telefon jonli ko'rigi va HTML+CSS kod nusxalash hamda «bitta bet — bitta bo'lim» karkasi.
8. **Avtomatik Audit (`#audit`):** Har bir betda avtomatik 3 bosqich — muammolarni topish, mahsulotga mos uslub tanlash va kodda qadamma-qadam tuzatish (jonli Oldin -> Keyin namoyishi).
9. **O'rnatish (`#ornatish`):** Claude Code, Gemini Antigravity va ChatGPT Codex uchun bitta qatorli o'rnatish buyrug'i.

Betlar yuqoridagi menyu, tugmalar va klaviatura strelkalari (telefonda barmoq bilan surib) almashadi; trekpad tasodifan keyingi betga o'tib ketmaydi. Ro'yxatlar sahifalanadi, uzun kod kesiladi va to'liq holda nusxalanadi.

---

## Ishga tushirish qoidasi

- **`claude.ai` / `Claude Desktop` muhitida:** [`assets/vitrina.html`](./assets/vitrina.html) ni to'g'ridan-to'g'ri interaktiv HTML Artifact sifatida chiqar.
- **`Antigravity` / `Claude Code` muhitida:** Faqat **`3000`-portda (`http://localhost:3000`)** ishga tushir (`3001`/`3002` ga o'tma):
  ```bash
  node "<skill_papkasi>/../effekt/scripts/katalog.js" server --boshat
  ```
- Aniq betni ochish kerak bo'lsa manzil oxiriga uning nomini qo'sh: `http://localhost:3000/#shrift`.
- Shriftlar beti Google Fonts'dan yuklaydi, shuning uchun internet kerak. Internet bo'lmasa nomlar tizim shriftida ko'rinadi, qolgan betlar to'liq ishlaydi.
