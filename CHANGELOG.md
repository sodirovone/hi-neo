# O'zgarishlar tarixi (Changelog)

## [1.1.0] — 2026-11-20

- **`hidesign` skilli (`/hidesign`, yangi):** bitta umumiy buyruq bilan `hiworld` plagini (`PRD.md`, `STACK.md`, `ROADMAP.md`) asosida qurilgan saytni **8 bosqichda etapma-etap** professional dizaynga olib chiqadi: rang va gradient -> `DESIGN.md` uslubi -> shrift -> ikonka -> animatsiya -> 1-bet Hero va WOW effekt -> har bir bet uchun rasm promptlari va rasm generatsiya -> yakuniy avtomatik Audit. CLI: `katalog.js hidesign .`.
- **`rang` skilli (yangi):** Coolors uslubida 1 rangdan 1–2 mos rang hisoblash (`rang-mosla`), 36 ta tayyor palitra (`rang-royxat`), **100 ta premium gradient** (`gradient-royxat` / `gradient-ol`, rang va joyini sudrab o'zgartirish, tovlanuvchi **xameleon** va **prazrachniy shaffof shisha** tugmalar bilan) hamda kattalashtirilgan `Jonli ko'rinish`.
- **`sahifa` skilli (kengaytirildi):** Supahero ilhomli **50 ta birinchi bet (Hero) maketi** (`hero-maketlar.json`, 7 ta soha), PC / Telefon hamda to'liq ekranli (`⤢`) jonli ko'rish, tayyor HTML+CSS kod nusxalash. CLI: `hero-royxat`, `hero-ol`.
- **`audit` skilli (`/audit`, yangi):** har bir betda avtomatik bajariladigan 3 bosqichli sifat tizimi — Audit (ortiqcha effekt, past kontrast, chalg'ituvchi unsurlar) -> Mahsulotga mos uslub tanlash -> Kodda qadamma-qadam tuzatish. CLI: `katalog.js audit <yol>`.
- **Vitrina (`9 ta bet`) va navigatsiya:** trekpad/g'ildirak orqali tasodifan keyingi betga o'tib ketish (`wheel`) olib tashlandi; 06 Ranglar va 07 Maket betlari tozalandi va katta jonli ko'rinish qo'shildi.

## [1.0.0] — 2026-11-20

- **`sayt` skilli (yangi):** sayt yoki lending qurilayotganda butun arsenaldan keraklisini o'zi tanlaydi — bitta shrift juftligi, betga 1–3 ta ikonka, 3–4 xil CSS animatsiya, 1–2 ta WOW effekt — va oxirida tanlov sababini jadvalda ko'rsatadi. CLI: `katalog.js tanla <soha va kayfiyat>`.
- **`sahifa` skilli va `rules/AGENTS.md`:** yagona maket standarti — **bitta bet — bitta bo'lim**. Har bo'lim o'z manziliga ega alohida bet, kompyuterda `100vw × 100vh` va skrollsiz, telefonda rasm tepada, matn pastda (`100svh`). Matn doim markazda. Har betga o'ziga mos rasm yaratiladi, sarlavha tepasida «tabletka» yorliqlar ishlatilmaydi, harakatlar yumshoq.
- **`effekt` skilli (`31 ta WOW veb-effekt`):** `01` Pikselli namoyon bo'lish dan `31` Matnli 3D-lenta gacha barcha effektlar, texnik formulalar va ehtiyot qoidalari lotin o'zbek tilida.
- **`animatsiya` skilli (`64 ta CSS animatsiya`):** 8 xil uslubda (`kirish`, `interaktiv`, `matn`, `fon`, `uch-olcham`, `yuklanish`, `nur-chegara`, `otish`) toza `@keyframes` va `neo-animations.css` fayli.
- **`ikonka` skilli (`3,054 ta alohida minimalist SVG ikonka`):** 40 ta yo'nalish bo'yicha yagona `Neo Minimal Line 24` (`24x24`, `stroke-width="1.75"`) uslubidagi baza va `SVG/JSX/Vue` eksporti. Har bir yozuv mustaqil ikonka — «bitta ikonka va uning nusxalari» yo'q. Manba: Tabler Icons (MIT), brend logotiplari va nusxa-variantlar olib tashlangan.
- **`shrift` skilli (`60 ta shrift + 24 ta juftlik`):** 6 xil uslubdagi Google Fonts shriftlari (har biridan 10 ta) va tayyor sarlavha + matn juftliklari. Havolalar, vaznlar va kirill qo'llashi tekshirilgan. CLI: `shrift-royxat`, `shrift-ol`, `juftlik-royxat`, `juftlik-ol`.
- **`vitrina` skilli (`vitrina.html`):** 7 ta alohida betdan iborat interaktiv ko'rgazma (`localhost:3000` va Claude Artifact rejimida). Bet ichida skroll yo'q: ro'yxatlar sahifalanadi, uzun kod kesiladi va to'liq holda nusxalanadi. 31 ta effektning har biri o'z jonli demosiga ega, oxirgi betda o'rnatish buyruqlari bor.
- **Ko'rinish:** palitra plagin ikonkasiga moslandi — to'q ko'k fon (`#050a17`) va moviy-ko'k urg'u (`#38e1ff` -> `#0052ff`). Vitrina va shablonlarda yangi ikonka ishlatiladi.
