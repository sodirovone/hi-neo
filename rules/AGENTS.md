# Hi Neo — Dizayn, Maket, Animatsiya, Ikonka va Shrift Qoidalari

Ushbu plagin faol bo'lganda veb-sahifa, lending yoki interfeys yaratishda quyidagi yagona standartlarga amal qiling:

1. **Bitta umumiy buyruq `/hidesign` (avval `hiworld` plagini bilan qurilgan loyihalarda):**
   - Foydalanuvchi `/hidesign` desa, avval `hiworld` plagini (`sodirovone/hiworld-plugin`) hujjatlari (`PRD.md`, `STACK.md`, `ROADMAP.md`) va mavjud sayt betlarini o'qing (`PRD.md` yo'q bo'lsa avval `hiworld` plaginini ishlatishni so'rab to'xtang).
   - So'ng 8 bosqichni ketma-ket bajaring: `1. Rang & Gradient -> 2. Uslub (DESIGN.md) -> 3. Shrift -> 4. Ikonka -> 5. Animatsiya -> 6. 1-bet Hero & WOW Effekt -> 7. Har bir bet uchun rasm prompti va generatsiya -> 8. Yakuniy Avtomatik Audit`.
2. **Sayt qurilayotganda keraklisini o'zingiz tanlang (`sayt` skilli):**
   - Foydalanuvchi yangi sayt, lending yoki sahifa so'rasa, undan «qaysi shrift, qaysi effekt» deb so'ramang. `sayt` skilli oqimi bo'yicha arsenaldan loyihaga mosini o'zingiz tanlang: bitta birinchi bet (Hero) maketi, bitta rang palitrasi yoki gradient, bitta shrift juftligi, betga 1–3 ta ikonka, butun saytga 3–4 xil CSS animatsiya va ko'pi bilan 1–2 ta WOW effekt.
   - Boshlang'ich to'plam uchun `node skills/effekt/scripts/katalog.js tanla <soha va kayfiyat>` buyrug'idan foydalaning. Oxirida nima tanlanganini va sababini qisqa jadvalda ko'rsating.
2. **Har bir betda avtomatik Audit, Uslub Tanlash va Kodda Tuzatish (`audit` skilli — MAJBURIY):**
   - Har bir yaratilgan yoki yangilangan betni topshirishdan oldin avtomatik 3 bosqichni bajaring:
     1. **Audit:** muammolarni toping — qayerda effektlar haddan ko'p, nima yomon o'qilayapti (kontrast, mayda matn, ortiqcha shrift), qaysi elementlar e'tiborni chalg'itmoqda.
     2. **Uslub tanlash:** mahsulot turiga mos aniq yangi uslub tizimini qo'llang (masalan, shovqinli binafsha-neon panelni jiddiy minimalist qorong'i interfeysga aylantiring).
     3. **Kodda qadamma-qadam tuzatish:** masofalarni tekislang (`8px` ritm), rang va kontrastni moslang, shriftlarni to'g'rilang va asosiy harakat tugmasini (CTA) ajratib ko'rsating.
3. **Yagona Sahifa Maketi Standarti va 50 ta Hero Maket (`sahifa` skilli):**
   - Birinchi bet (Hero) uchun `skills/sahifa/references/hero-maketlar.json` bazasidagi **50 ta tayyor Hero maket**dan (`hero-royxat` / `hero-ol`) sohaga mosini tanlang.
   - Har bir bo'lim o'z manziliga ega **alohida bet**. Ekranda doim faqat bitta bo'lim ko'rinadi.
   - **Kompyuter (`>= 1024px`):** bet ekranga to'liq sig'adi (`100vw × 100vh`), skroll yo'q. Betlar menyu, tugmalar va klaviatura strelkalari bilan almashadi (trekpad/g'ildirak tasodifan keyingi betga o'tib ketmasligi uchun `wheel` o'tishi ishlatilmaydi).
   - **Telefon (`< 1024px`):** shu betning rasmi tepada, matni pastda (`width: 100%`, `min-height: 100svh`).
   - **Bir xil standart o'lcham va ichki tartib:** barcha betlar va ularning ichki ramkalari **aynan bir xil o'lchamda**. Har betda avval **o'zining rasmi/vizuali + jonli animatsiyasi**, yonida (telefonda pastida) **sarlavhasi va matni** turadi.
   - **Har betga o'ziga mos rasm:** har bet uchun shu bet mazmuniga atab alohida rasm yarating (rasm generatsiya vositasi, SVG illyustratsiya yoki Canvas sahna). Bo'sh quti yoki takror rasm qoldirilmaydi, hamma rasmlar bitta uslubda bo'ladi.
   - **«Tabletka» sarlavhalar yo'q:** sarlavha tepasiga kichik yumaloq yorliq (`✨ Yangi`, `01 / 05`, `Bizning xizmatlar` kabi pill-badge) qo'ymang. Bet to'g'ridan-to'g'ri aniq sarlavhadan boshlanadi.
   - **Yumshoq harakat:** animatsiyalar sekin va mayin (`0.5–0.9s`, `cubic-bezier(0.22, 1, 0.36, 1)`, `8–16px` siljish). Sakrash, silkinish va keskin miltillash ishlatilmaydi. Pastda alohida «Oldingi / Keyingi» paneli qo'yilmaydi.
   - **Matn markazda, skroll yo'q:** sarlavha, matn va tugmalar o'rtaga tekislanadi (faqat kod bloklari chapdan). Bet ichida `overflow: auto` ishlatilmaydi: kontent sig'masa qisqartiriladi, ro'yxat sahifalanadi yoki alohida betga chiqariladi.
4. **Yagona Minimalist SVG Ikonkalar (`3,054` ta):**
   - Loyihada turli stildagi ikonkalar aralashtirilmasin — `ikonka` skillidagi yagona `Neo Minimal Line 24` (`viewBox="0 0 24 24"`, `stroke-width="1.75"`, `round` uchlari) bazasidan foydalaning.
5. **Shriftlar (`60` ta shrift, `24` ta juftlik):**
   - Bitta saytda ko'pi bilan ikkita shrift oilasi (sarlavha + matn). `shrift` skillidagi tayyor juftliklardan oling va faqat bazada ko'rsatilgan vaznlarni ulang. Ikki tilli (uz/ru) saytda `kirill: true` shriftlarni tanlang.
6. **Rang Palitrasi (`36` ta) va Premium Gradientlar (`100` ta):**
   - `rang` skilli orqali foydalanuvchi tanlagan 1 ta HEX rangga mos 1 yoki 2 ta rang toping (`rang-mosla`), tayyor 36 ta palitra (`rang-royxat`) yoki 100 ta premium gradientdan (`gradient-royxat`, xameleon tovlanish va shaffof shisha tugmalar bilan) foydalaning. Kontrast WCAG AA (`>= 4.5:1`) dan past bo'lmasin.
7. **Jonlantirish (64 ta CSS Animatsiya + 31 ta WOW Effekt):**
   - Yengil mikro-harakatlar, kirish va fon effektlari uchun `animatsiya` skillidagi **64 ta toza CSS animatsiya**ni, kuchli interaktiv sahnalar uchun esa `effekt` skillidagi **31 ta WOW veb-effekt**ni qo'llang (`prefers-reduced-motion` doim saqlansin).
8. **Lokal port va til:**
   - Lokal server doim faqat **`3000`-portda (`http://localhost:3000`)** ishga tushiriladi. Muloqot — **lotin o'zbek tilida**.
