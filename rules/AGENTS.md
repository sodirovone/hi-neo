# Hi Neo — Dizayn, Maket, Animatsiya, Ikonka va Shrift Qoidalari

Ushbu plagin faol bo'lganda veb-sahifa, lending yoki interfeys yaratishda quyidagi yagona standartlarga amal qiling:

1. **Sayt qurilayotganda keraklisini o'zingiz tanlang (`sayt` skilli):**
   - Foydalanuvchi yangi sayt, lending yoki sahifa so'rasa, undan «qaysi shrift, qaysi effekt» deb so'ramang. `sayt` skilli oqimi bo'yicha arsenaldan loyihaga mosini o'zingiz tanlang: bitta shrift juftligi, betga 1–3 ta ikonka, butun saytga 3–4 xil CSS animatsiya va ko'pi bilan 1–2 ta WOW effekt.
   - Boshlang'ich to'plam uchun `node skills/effekt/scripts/katalog.js tanla <soha va kayfiyat>` buyrug'idan foydalaning. Oxirida nima tanlanganini va sababini qisqa jadvalda ko'rsating.
2. **Yagona Sahifa Maketi Standarti — bitta bet, bitta bo'lim (`sahifa` skilli):**
   - Har bir bo'lim o'z manziliga ega **alohida bet**. Ekranda doim faqat bitta bo'lim ko'rinadi.
   - **Kompyuter (`>= 1024px`):** bet ekranga to'liq sig'adi (`100vw × 100vh`), skroll yo'q. Betlar g'ildirak, strelkalar yoki menyu bilan almashadi.
   - **Telefon (`< 1024px`):** shu betning rasmi tepada, matni pastda (`width: 100%`, `min-height: 100svh`).
   - **Bir xil standart o'lcham va ichki tartib:** barcha betlar va ularning ichki ramkalari **aynan bir xil o'lchamda**. Har betda avval **o'zining rasmi/vizuali + jonli animatsiyasi**, yonida (telefonda pastida) **sarlavhasi va matni** turadi.
   - **Har betga o'ziga mos rasm:** har bet uchun shu bet mazmuniga atab alohida rasm yarating (rasm generatsiya vositasi, SVG illyustratsiya yoki Canvas sahna). Bo'sh quti yoki takror rasm qoldirilmaydi, hamma rasmlar bitta uslubda bo'ladi.
   - **«Tabletka» sarlavhalar yo'q:** sarlavha tepasiga kichik yumaloq yorliq (`✨ Yangi`, `01 / 05`, `Bizning xizmatlar` kabi pill-badge) qo'ymang. Bet to'g'ridan-to'g'ri aniq sarlavhadan boshlanadi.
   - **Yumshoq harakat:** animatsiyalar sekin va mayin (`0.5–0.9s`, `cubic-bezier(0.22, 1, 0.36, 1)`, `8–16px` siljish). Sakrash, silkinish va keskin miltillash ishlatilmaydi. Pastda alohida «Oldingi / Keyingi» paneli qo'yilmaydi.
   - **Matn markazda, skroll yo'q:** sarlavha, matn va tugmalar o'rtaga tekislanadi (faqat kod bloklari chapdan). Bet ichida `overflow: auto` ishlatilmaydi: kontent sig'masa qisqartiriladi, ro'yxat sahifalanadi yoki alohida betga chiqariladi.
3. **Yagona Minimalist SVG Ikonkalar (`3,054` ta):**
   - Loyihada turli stildagi ikonkalar aralashtirilmasin — `ikonka` skillidagi yagona `Neo Minimal Line 24` (`viewBox="0 0 24 24"`, `stroke-width="1.75"`, `round` uchlari) bazasidan foydalaning.
4. **Shriftlar (`60` ta shrift, `24` ta juftlik):**
   - Bitta saytda ko'pi bilan ikkita shrift oilasi (sarlavha + matn). `shrift` skillidagi tayyor juftliklardan oling va faqat bazada ko'rsatilgan vaznlarni ulang. Ikki tilli (uz/ru) saytda `kirill: true` shriftlarni tanlang.
5. **Jonlantirish (64 ta CSS Animatsiya + 31 ta WOW Effekt):**
   - Yengil mikro-harakatlar, kirish va fon effektlari uchun `animatsiya` skillidagi **64 ta toza CSS animatsiya**ni, kuchli interaktiv sahnalar uchun esa `effekt` skillidagi **31 ta WOW veb-effekt**ni qo'llang (`prefers-reduced-motion` doim saqlansin).
6. **Lokal port va til:**
   - Lokal server doim faqat **`3000`-portda (`http://localhost:3000`)** ishga tushiriladi. Muloqot — **lotin o'zbek tilida**.
