# O'zgarishlar tarixi (Changelog)

## [1.0.0] — 2026-11-20

- **`sayt` skilli (yangi):** sayt yoki lending qurilayotganda butun arsenaldan keraklisini o'zi tanlaydi — bitta shrift juftligi, betga 1–3 ta ikonka, 3–4 xil CSS animatsiya, 1–2 ta WOW effekt — va oxirida tanlov sababini jadvalda ko'rsatadi. CLI: `katalog.js tanla <soha va kayfiyat>`.
- **`sahifa` skilli va `rules/AGENTS.md`:** yagona maket standarti — **bitta bet — bitta bo'lim**. Har bo'lim o'z manziliga ega alohida bet, kompyuterda `100vw × 100vh` va skrollsiz, telefonda rasm tepada, matn pastda (`100svh`). Matn doim markazda. Har betga o'ziga mos rasm yaratiladi, sarlavha tepasida «tabletka» yorliqlar ishlatilmaydi, harakatlar yumshoq.
- **`effekt` skilli (`31 ta WOW veb-effekt`):** `01` Pikselli namoyon bo'lish dan `31` Matnli 3D-lenta gacha barcha effektlar, texnik formulalar va ehtiyot qoidalari lotin o'zbek tilida.
- **`animatsiya` skilli (`64 ta CSS animatsiya`):** 8 xil uslubda (`kirish`, `interaktiv`, `matn`, `fon`, `uch-olcham`, `yuklanish`, `nur-chegara`, `otish`) toza `@keyframes` va `neo-animations.css` fayli.
- **`ikonka` skilli (`3,054 ta alohida minimalist SVG ikonka`):** 40 ta yo'nalish bo'yicha yagona `Neo Minimal Line 24` (`24x24`, `stroke-width="1.75"`) uslubidagi baza va `SVG/JSX/Vue` eksporti. Har bir yozuv mustaqil ikonka — «bitta ikonka va uning nusxalari» yo'q. Manba: Tabler Icons (MIT), brend logotiplari va nusxa-variantlar olib tashlangan.
- **`shrift` skilli (`60 ta shrift + 24 ta juftlik`):** 6 xil uslubdagi Google Fonts shriftlari (har biridan 10 ta) va tayyor sarlavha + matn juftliklari. Havolalar, vaznlar va kirill qo'llashi tekshirilgan. CLI: `shrift-royxat`, `shrift-ol`, `juftlik-royxat`, `juftlik-ol`.
- **`vitrina` skilli (`vitrina.html`):** 7 ta alohida betdan iborat interaktiv ko'rgazma (`localhost:3000` va Claude Artifact rejimida). Bet ichida skroll yo'q: ro'yxatlar sahifalanadi, uzun kod kesiladi va to'liq holda nusxalanadi. 31 ta effektning har biri o'z jonli demosiga ega, oxirgi betda o'rnatish buyruqlari bor.
- **Ko'rinish:** palitra plagin ikonkasiga moslandi — to'q ko'k fon (`#050a17`) va moviy-ko'k urg'u (`#38e1ff` -> `#0052ff`). Vitrina va shablonlarda yangi ikonka ishlatiladi.
