# Hi Neo — sayt qurayotganda keraklisini o'zi tanlaydigan dizayn plagini

**hiworld.club** tomonidan. Oddiy saytni zamonaviy veb-mahsulotga aylantiradigan plagin — **Antigravity**, **Claude Code** va **Claude Desktop / claude.ai** uchun. Ichida 31 ta WOW effekt, 64 ta CSS animatsiya, 3,054 ta SVG ikonka, 60 ta shrift va «bitta bet — bitta bo'lim» sahifa maketi bor. Siz «sayt yasa» deysiz — agent shulardan loyihaga mosini o'zi tanlab ishlatadi.

Butun muloqot va yo'riqnomalar — **lotin o'zbek tilida**.

```text
/sayt        ->  Sayt quradi va hammasidan keraklisini o'zi tanlaydi (shrift, ikonka, animatsiya, effekt, maket)
/sahifa      ->  «Bitta bet — bitta bo'lim» standart maketi: har bo'lim alohida bet, skroll yo'q
/effekt      ->  31 ta interaktiv WOW veb-effekt (Canvas, WebGL, GSAP, Three.js, CSS 3D)
/animatsiya  ->  8 xil uslubdagi 64 ta toza CSS @keyframes animatsiya
/ikonka      ->  40 ta yo'nalishdagi 3,054 ta alohida minimalist SVG ikonka (SVG / JSX / Vue)
/shrift      ->  6 xil uslubdagi 60 ta shrift va 24 ta tayyor sarlavha + matn juftligi (Google Fonts)
/vitrina     ->  Hammasini bitta interaktiv ko'rgazmada jonli ko'rish va nusxalash
```

---

## O'rnatish

### 1. Claude Code:

```bash
/plugin marketplace add sodirovone/hi-neo
/plugin install hi-neo@hi-neo
```

### 2. claude.ai yoki Claude Desktop:

- **Customize → Plugins → Add marketplace** → `sodirovone/hi-neo` → **hi-neo** → **Install**.
- Yoki plagin papkasini `.zip` qilib **Upload plugin** orqali yuklang.

### 3. Google Antigravity:

```bash
agy plugin install https://github.com/sodirovone/hi-neo
```

---

## 7 ta Skill

### 1. `sayt` — Sayt quruvchi, keraklisini o'zi tanlaydi (`/sayt`)
Yangi sayt yoki lending so'ralganda o'zi ishga tushadi. Soha va kayfiyatga qarab bitta shrift juftligi, bet uchun 1–3 ta ikonka, butun saytga 3–4 xil CSS animatsiya va 1–2 ta WOW effekt tanlaydi, ortiqchasini qo'shmaydi. Oxirida nima tanlanganini va sababini jadvalda ko'rsatadi.

```bash
node skills/effekt/scripts/katalog.js tanla restoran premium
```

### 2. `sahifa` — «Bitta bet — bitta bo'lim» maketi (`/sahifa`)
Har bir sahifa yagona kompozitsiya qonunida quriladi:
- **Bitta bet — bitta bo'lim:** har bo'lim o'z manziliga (`#...`) ega alohida bet, ekranda doim faqat bittasi ko'rinadi.
- **Kompyuter (`>= 1024px`):** bet ekranga to'liq sig'adi (`100vw × 100vh`), skroll yo'q. Betlar g'ildirak, strelkalar yoki menyu bilan almashadi.
- **Telefon (`< 1024px`):** shu betning rasmi tepada, matni pastda (`100svh`).
- **Bir xil standart o'lcham:** har betda avval **rasm + jonli animatsiya**, yonida **markazga tekislangan sarlavha va matn**.
- **Har betga o'ziga mos rasm** yaratiladi, sarlavha tepasida «tabletka» yorliqlar bo'lmaydi, harakatlar yumshoq.

### 3. `effekt` — 31 ta WOW Veb-Effekt (`/effekt`)
`01` *Pikselli namoyon bo'lish* dan `31` *Matnli 3D-lenta* gacha bo'lgan interaktiv effektlarni loyiha stekiga (`Next.js`, `React`, `Tailwind`, `Vue` yoki toza `HTML/CSS/JS`) moslab yozib ulaydi.

### 4. `animatsiya` — 64 ta Toza CSS Animatsiya (`/animatsiya`)
8 yo'nalishda JavaScript kutubxonalarisiz ishlaydigan `64 ta` tayyor `@keyframes` va `.neo-anim-*` klasslari (`neo-animations.css`): kirish, mikro-interaksiya, tipografiya, fon, CSS 3D, yuklanish, chegara va yorug'lik, sahifa o'tishlari (har biridan `8 ta`).

### 5. `ikonka` — 3,054 ta Alohida Minimalist SVG Ikonka (`/ikonka`)
- **Har biri mustaqil ikonka:** «bitta ikonka va uning 15 ta nusxasi» emas, 3,054 ta alohida chizma.
- **Yagona uslub (`Neo Minimal Line 24`):** `viewBox="0 0 24 24"`, `stroke-width="1.75"`, yumaloq uchlar, `currentColor`.
- **40 ta yo'nalish:** tizim va interfeys, strelkalar, dizayn, matn, qurilmalar, hujjatlar, xarita, savdo, media, aloqa, dasturlash, transport, taom, salomatlik, binolar, sport, ob-havo, diagrammalar va boshqalar.
- O'zbekcha va inglizcha so'z bilan qidiriladi, CLI orqali `SVG`, `React JSX` yoki `Vue` formatda chiqadi.
- Manba: [Tabler Icons](https://github.com/tabler/tabler-icons) (MIT). Brend logotiplari va nusxa-variantlar olib tashlangan.

### 6. `shrift` — 60 ta Shrift va 24 ta Juftlik (`/shrift`)
- **6 ta uslub, har biridan 10 ta:** zamonaviy grotesk, serif, yirik sarlavha, mono, qo'lyozma, yumaloq.
- **24 ta tayyor juftlik** (sarlavha + matn): «Texno startap», «Premium brend», «Fintech ilova», «Bolalar olami» va boshqalar.
- Hammasi Google Fonts'dagi ochiq litsenziyali shriftlar. Har birining havolasi, vaznlari va kirill qo'llashi tekshirilgan.

### 7. `vitrina` — Interaktiv Ko'rgazma (`/vitrina`)
7 ta alohida betda (Ekotizim, Effektlar, Animatsiyalar, Ikonkalar, Shriftlar, Sahifa standarti, O'rnatish) hammasini jonli ko'rsatadi va bir bosishda nusxalaydi. `http://localhost:3000` da yoki Claude Artifact oynasida ochiladi.

---

## Sifat tekshiruvi

```bash
node scripts/tekshir.js
```

---

## Aloqa va mualliflik

- Loyiha: [hiworld.club](https://hiworld.club)
- Telegram: [@Sodirov_U](https://t.me/Sodirov_U) · Buyurtma: [@hiworld_clubbot](https://t.me/hiworld_clubbot)
- Ikonkalar: [Tabler Icons](https://github.com/tabler/tabler-icons) (MIT), saralangan to'plam
- Shriftlar: [Google Fonts](https://fonts.google.com) (har bir shrift o'z ochiq litsenziyasi bilan)
- Litsenziya: [MIT](LICENSE)
