# Hi Neo — Standart Sahifa Maketi Shablonlari (Bitta Bet — Bitta Bo'lim)

Quyidagi tayyor karkas **«bitta bet — bitta bo'lim»** qonunini ta'minlaydi: har bir bo'lim o'z manziliga (`#...`) ega **alohida bet**, ekranda doim faqat bittasi ko'rinadi va hammasi bir xil standart o'lchamda. Kompyuterda bet ekranga to'liq sig'adi (`100vw × 100vh`, skroll yo'q), telefonda shu betning rasmi tepada, matni pastda turadi (`100svh`).

---

## 1. Toza HTML + CSS + JS Karkasi

```html
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loyiha nomi</title>
  <style>
    :root {
      --bg: #050a17;
      --card: #0a1223;
      --border: rgba(148, 163, 184, 0.15);
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #38e1ff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    /* Skroll chiziqlari ko'rinmaydi, bet ichida skroll bo'lmaydi */
    html { scrollbar-width: none; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }

    /* Yuqori panel: brend, betlar menyusi */
    .neo-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 64px;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 28px;
      backdrop-filter: blur(14px);
      background: rgba(5, 10, 23, 0.78);
      border-bottom: 1px solid var(--border);
    }
    .neo-menu { display: flex; gap: 6px; }
    .neo-menu a {
      padding: 6px 12px;
      border-radius: 999px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }
    .neo-menu a.is-active { background: var(--accent); color: #04122e; }

    /* BITTA BET — BITTA BO'LIM: faqat joriy bo'lim ko'rinadi */
    .neo-section { display: none; }
    .neo-section.is-active {
      display: flex;
      align-items: center;
      justify-content: center;
      /* Yumshoq ochilish: sekin, qisqa masofa, sakrashsiz */
      animation: neo-soft-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes neo-soft-in { from { opacity: 0; transform: translateY(16px); filter: blur(8px); } }
    @media (prefers-reduced-motion: reduce) { .neo-section.is-active { animation: none; } }

    /* PC (>=1024px): bet ekranga to'liq sig'adi, skroll yo'q */
    @media (min-width: 1024px) {
      body { overflow: hidden; }
      .neo-section.is-active {
        width: 100vw;
        height: 100vh;
        padding: 80px 4vw 48px;
      }

      /* Har bir betda 100% BIR XIL STANDART RAMKA */
      .neo-frame {
        width: min(1240px, 92vw);
        height: calc(100vh - 150px);
        min-height: 440px;
        max-height: 720px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 28px;
        padding: 36px;
        display: grid;
        grid-template-columns: 1.08fr 0.92fr;
        gap: 40px;
        align-items: stretch;
      }
    }

    /* TELEFON VA PLANSHET (<1024px): shu betning rasmi tepada, matni pastda */
    @media (max-width: 1023px) {
      .neo-menu a span { display: none; }
      .neo-section.is-active {
        width: 100%;
        min-height: 100svh;
        padding: 80px 16px 32px;
      }
      .neo-frame {
        width: 100%;
        min-height: calc(100svh - 112px);
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 22px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }
      .neo-visual {
        height: 270px;
        flex-shrink: 0;
      }
      .neo-copy { flex: 1; }
    }

    .neo-visual {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      background: #040916;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* Matn bloki doim markazga tekislanadi */
    .neo-copy {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      text-align: center;
      overflow: hidden;
    }
    .neo-copy h2 {
      font-size: clamp(26px, 3.2vw, 42px);
      line-height: 1.1;
      letter-spacing: -0.03em;
    }
    .neo-copy p {
      color: var(--muted);
      font-size: 16px;
      line-height: 1.6;
    }
    .neo-next {
      padding: 12px 22px;
      border-radius: 12px;
      background: var(--accent);
      color: #04122e;
      font-weight: 700;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <header class="neo-nav">
    <strong>Brend</strong>
    <nav class="neo-menu" id="neoMenu">
      <a href="#bosh">01<span> · Bosh</span></a>
      <a href="#xizmat">02<span> · Xizmatlar</span></a>
      <a href="#aloqa">03<span> · Aloqa</span></a>
    </nav>
  </header>

  <main id="neoDeck">
    <!-- 01-BET -->
    <section class="neo-section" id="bosh">
      <div class="neo-frame">
        <div class="neo-visual"><!-- 01-betga atab yaratilgan rasm + yumshoq animatsiya --></div>
        <div class="neo-copy">
          <h2>Birinchi bet sarlavhasi</h2>
          <p>Shu betga tegishli asosiy fikr va qisqa tushuntirish matni.</p>
          <a class="neo-next" href="#xizmat">Keyingi bet →</a>
        </div>
      </div>
    </section>

    <!-- 02-BET (xuddi shu standart o'lchamda) -->
    <section class="neo-section" id="xizmat">
      <div class="neo-frame">
        <div class="neo-visual"><!-- 02-betga atab yaratilgan rasm + yumshoq animatsiya --></div>
        <div class="neo-copy">
          <h2>Ikkinchi bet sarlavhasi</h2>
          <p>Keyingi bet o'zining rasmi, animatsiyasi va matni bilan ochiladi.</p>
          <a class="neo-next" href="#aloqa">Keyingi bet →</a>
        </div>
      </div>
    </section>

    <!-- 03-BET -->
    <section class="neo-section" id="aloqa">
      <div class="neo-frame">
        <div class="neo-visual"><!-- 03-betga atab yaratilgan rasm + yumshoq animatsiya --></div>
        <div class="neo-copy">
          <h2>Uchinchi bet sarlavhasi</h2>
          <p>Oxirgi betda aloqa yoki asosiy harakat tugmasi turadi.</p>
          <a class="neo-next" href="#bosh">← Bosh betga</a>
        </div>
      </div>
    </section>
  </main>

  <script>
    // Bitta bet — bitta bo'lim: manzildagi #... qaysi bet ko'rinishini belgilaydi
    const pages = [...document.querySelectorAll('.neo-section')];
    const links = [...document.querySelectorAll('#neoMenu a')];
    let current = -1;

    function show() {
      const idx = Math.max(0, pages.findIndex((p) => '#' + p.id === location.hash));
      if (idx === current) return;
      current = idx;
      pages.forEach((p, i) => p.classList.toggle('is-active', i === idx));
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + pages[idx].id));
      window.scrollTo(0, 0);
    }
    const go = (idx) => { location.hash = '#' + pages[Math.max(0, Math.min(pages.length - 1, idx))].id; };
    window.addEventListener('hashchange', show);
    show();

    // Kompyuterda klaviatura strelkalari va yuqori menyu betni almashtiradi
    // (trekpad/g'ildirak tasodifan keyingi betga o'tib ketmasligi uchun wheel o'chirilgan)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(current + 1);
      if (e.key === 'ArrowLeft') go(current - 1);
    });
  </script>
</body>
</html>
```

---

## 2. Next.js / React + Tailwind CSS Komponent Qoidasi

- **Har bo'lim — alohida marshrut (route):** `app/page.tsx`, `app/xizmatlar/page.tsx`, `app/aloqa/page.tsx`. Yuqori panel va betlar menyusi umumiy `app/layout.tsx` da turadi.
- Har bir bet (`<section>`) klassi:
  `w-full min-h-[100svh] lg:w-screen lg:h-screen lg:overflow-hidden flex items-center justify-center px-4 pt-20 pb-8 lg:px-[4vw] lg:pt-20 lg:pb-12`
- Har bir betning standart ichki ramkasi:
  `w-full lg:w-[min(1240px,92vw)] lg:h-[calc(100vh-150px)] lg:min-h-[440px] lg:max-h-[720px] rounded-[24px] lg:rounded-[28px] border border-slate-400/15 bg-[#0a1223] p-5 lg:p-9 flex flex-col lg:grid lg:grid-cols-[1.08fr_0.92fr] gap-6 lg:gap-10`
- Ichki ritm:
  1. Chap (telefonda yuqori) blok: `h-[270px] lg:h-full rounded-2xl overflow-hidden relative` — rasm + animatsiya;
  2. O'ng (telefonda pastki) blok: `flex flex-col items-center justify-center gap-4 text-center overflow-hidden` — sarlavha, matn va tugma (hammasi markazda, «tabletka» yorliqsiz).
- Betlar orasida `next/link` bilan o'tiladi; kompyuterda `body` ga `lg:overflow-hidden` beriladi.

---

## 3. Buzilmas qo'shimcha qoidalar

- **Bitta bet — bitta bo'lim:** bir ekranda ikki bo'lim ustma-ust yoki yonma-yon turmaydi. Yangi mavzu — yangi bet va yangi manzil.
- **Har betga o'ziga mos rasm:** `.neo-visual` bo'sh quti yoki takror rasm bilan qolmaydi. Har bet uchun shu bet mavzusiga atab alohida rasm yaratiladi (rasm generatsiya vositasi bo'lsa u bilan, bo'lmasa SVG illyustratsiya yoki Canvas sahna). Hamma rasmlar bitta uslub va bitta palitrada.
- **«Tabletka» sarlavhalar yo'q:** sarlavha tepasiga kichik yumaloq yorliq (`✨ Yangi`, `01 / 05`, `Bizning xizmatlar` kabi pill-badge) qo'yilmaydi. Bet to'g'ridan-to'g'ri sarlavhadan boshlanadi.
- **Yumshoq harakat:** animatsiyalar sekin va mayin (`0.5–0.9s`, `cubic-bezier(0.22, 1, 0.36, 1)`, `8–16px` siljish, yengil xiralikdan chiqish). Sakrash, silkinish va keskin miltillash ishlatilmaydi.
- **Matn markazda:** `.neo-copy` ichidagi sarlavha, matn va tugmalar `text-align: center` bilan o'rtaga tekislanadi. Faqat kod bloklari chapdan yoziladi.
- **Skroll yo'q:** bet ichida `overflow: auto` ishlatilmaydi va skroll chizig'i ko'rinmaydi. Kontent sig'masa matn qisqartiriladi, ro'yxat esa sahifalanadi («Oldingi / Keyingi») yoki alohida betga chiqariladi.
- **Palitra:** asosiy fon `#050a17`, karta `#0a1223`, urg'u `#38e1ff` -> `#0052ff` gradienti (Hi Neo ikonkasi ranglari). Loyihaning o'z brend ranglari bo'lsa, o'shalar ustun turadi.
