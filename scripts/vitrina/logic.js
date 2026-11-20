
    // Har bir yozuv alohida ikonka: [id, nom, qidiruv so'zlari, yo'nalish, chizma]
    const ICONS = ICONS_RAW.map(([id, nom, en, kat, svg]) => ({ id, nom, en, kat, svg }));

    const $ = (id) => document.getElementById(id);
    const NEO = '#38e1ff';
    const BLUE = '#0052ff';
    const STAGE = '#040916';

    function showToast(msg) {
      const t = $('toast');
      t.textContent = msg;
      t.classList.add('is-visible');
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => t.classList.remove('is-visible'), 2000);
    }

    async function copyText(txt, msg) {
      try { await navigator.clipboard.writeText(txt); }
      catch (_) {
        const ta = document.createElement('textarea');
        ta.value = txt; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
      showToast(msg || 'Nusxalandi ✓');
    }

    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // Tanlov o'zgarganda matn va sahna yumshoq almashadi
    function soften(...ids) {
      for (const id of ids) {
        const el = typeof id === 'string' ? $(id) : id;
        el.classList.remove('soft-swap');
        void el.offsetWidth;
        el.classList.add('soft-swap');
      }
    }

    // --- Skrollsiz, KETMA-KET va simmetrik ro'yxat ---
    // Elementlar sahifalarga tartib bilan, takrorsiz bo'linadi: 1-sahifa 1..k, 2-sahifa k+1..2k va h.k.
    // Har sahifa to'liq to'rtburchak bo'lib turadi: ustunlar soni elementlar soniga moslanadi,
    // oxirgi qatorda joy qolsa, oxirgi element uni egallaydi. Bitta sahifaga sig'sa, to'r markazda.
    const pagers = [];
    function makePager({ list, prev, next, info, minW, rowH, gap, pad, render, anchor, onDraw, noSpan }) {
      let items = [], page = 0, cols = 0, rows = 0;
      function fit() {
        const w = list.clientWidth - pad * 2, h = list.clientHeight - pad * 2;
        if (w <= 0 || h <= 0) return false;
        const c = Math.max(1, Math.floor((w + gap) / (minW + gap)));
        const r = Math.max(1, Math.floor((h + gap) / (rowH + gap)));
        if (c === cols && r === rows) return false;
        cols = c; rows = r;
        return true;
      }
      // m ta element uchun eng tekis to'r: oxirgi qatordagi bo'sh joy eng kam bo'ladigan ustunlar soni
      function grid(m, maxC, maxR) {
        let best = Math.min(maxC, Math.max(1, m)), bestGap = Infinity;
        for (let c = Math.min(maxC, m); c >= Math.max(1, Math.ceil(m / maxR)); c--) {
          const g = (c - (m % c)) % c;
          if (g < bestGap) { best = c; bestGap = g; }
        }
        return { cols: best, rows: Math.max(1, Math.ceil(m / best)), gap: bestGap === Infinity ? 0 : bestGap };
      }
      function plan() {
        const n = items.length, c = cols || 1, r = rows || 1, cap = c * r;
        if (n <= cap) return { per: Math.max(1, n), pages: 1 };
        const pages = Math.ceil(n / cap);
        // Sahifadagi elementlar soni shunday tanlanadiki, hamma sahifa iloji boricha to'liq
        // to'rtburchak bo'lsin va oxirgi sahifada bir-ikkita element yolg'iz qolmasin
        let per = cap, bestScore = Infinity;
        for (let k = Math.ceil(n / pages); k <= cap; k++) {
          if (Math.ceil(n / k) !== pages) continue;
          const last = n - (pages - 1) * k;
          const score = grid(k, c, r).gap * (pages - 1) + grid(last, c, r).gap + (last < k * 0.4 ? 100 : 0);
          if (score < bestScore) { bestScore = score; per = k; }
        }
        return { per, pages };
      }
      function draw() {
        const p = plan();
        page = Math.max(0, Math.min(page, p.pages - 1));
        const slice = items.slice(page * p.per, (page + 1) * p.per);
        const g = grid(slice.length, cols || 1, rows || 1);
        const rowPx = Math.round(rowH * 1.45);
        const fixed = p.pages === 1 && g.rows * (rowPx + gap) <= list.clientHeight - pad * 2;
        list.style.gridTemplateColumns = `repeat(${g.cols}, minmax(0, 1fr))`;
        list.style.gridTemplateRows = fixed ? `repeat(${g.rows}, ${rowPx}px)` : `repeat(${g.rows}, minmax(0, 1fr))`;
        list.style.alignContent = fixed ? 'center' : 'stretch';
        list.innerHTML = slice.map(render).join('');
        const rest = slice.length % g.cols;
        if (!noSpan && rest && list.lastElementChild) list.lastElementChild.style.gridColumn = 'span ' + (g.cols - rest + 1);
        info.textContent = (page + 1) + ' / ' + p.pages;
        prev.disabled = page === 0;
        next.disabled = page >= p.pages - 1;
        if (onDraw) onDraw(slice);
      }
      function toAnchor() {
        const i = anchor ? anchor(items) : -1;
        if (i >= 0) page = Math.floor(i / plan().per);
      }
      function refit() { if (fit()) { toAnchor(); draw(); } }
      prev.onclick = () => { page--; draw(); };
      next.onclick = () => { page++; draw(); };
      new ResizeObserver(refit).observe(list);
      fit();
      const api = {
        set(arr) { items = arr; page = 0; toAnchor(); draw(); },
        // Faqat tanlov belgisini yangilaydi (ro'yxat qayta chizilmaydi, animatsiya takrorlanmaydi)
        mark(id) { list.querySelectorAll('[data-id]').forEach((el) => el.classList.toggle('is-selected', el.dataset.id === id)); },
        redraw: draw,
        refit
      };
      pagers.push(api);
      return api;
    }

    // Kod oynasi: matn sig'masa pastki qismi so'nadi (to'liq matn nusxalash tugmasida)
    const clipWatch = new ResizeObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('is-clipped', e.target.scrollHeight > e.target.clientHeight + 2);
    });
    document.querySelectorAll('.code-box').forEach((el) => clipWatch.observe(el));
    function setCode(id, txt) {
      const el = $(id);
      el.textContent = txt;
      el.classList.toggle('is-clipped', el.scrollHeight > el.clientHeight + 2);
    }

    // --- Bitta bet — bitta bo'lim: har bo'lim o'z manziliga (#...) ega alohida bet ---
    const sections = [...document.querySelectorAll('.neo-section')];
    const SEC_N = sections.length;
    const BASE_TITLE = document.title;
    const two = (n) => String(n).padStart(2, '0');
    const isPc = () => window.innerWidth >= 1024;
    const clampSec = (i) => Math.max(0, Math.min(SEC_N - 1, i));
    const hashSec = () => {
      const h = location.hash;
      if (h === '#gradient' || h === '#rang-gradient') return Math.max(0, sections.findIndex((s) => s.id === 'rang'));
      if (h === '#hero' || h === '#maket' || h === '#karkas') return Math.max(0, sections.findIndex((s) => s.id === 'sahifa'));
      return Math.max(0, sections.findIndex((s) => '#' + s.id === h));
    };
    function syncSubHash() {
      const h = location.hash;
      if ((h === '#gradient' || h === '#rang-gradient') && window._rangTab) window._rangTab('gradient');
      else if (h === '#rang' && window._rangTab) window._rangTab('palitra');
      else if ((h === '#hero' || h === '#maket') && window._maketTab) window._maketTab('hero');
      else if (h === '#karkas' && window._maketTab) window._maketTab('karkas');
    }
    let curSec = -1;

    function showSec(idx) {
      const target = clampSec(idx);
      if (target === curSec) return;
      curSec = target;
      sections.forEach((s, i) => s.classList.toggle('is-active', i === curSec));
      document.querySelectorAll('.nav-tab').forEach((b, i) => {
        b.classList.toggle('is-active', i === curSec);
        if (i === curSec) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      });
      $('stepCounter').textContent = two(curSec + 1) + ' / ' + two(SEC_N);
      document.title = curSec === 0 ? BASE_TITLE : sections[curSec].dataset.title + ' · Hi Neo';
      window.scrollTo(0, 0);
      pagers.forEach((p) => p.refit());
      if (curSec === 0) countUp();
    }

    // Betga o'tadi va manzilni yangilaydi: brauzerning «Orqaga» tugmasi ham ishlaydi
    function goSec(idx) {
      const target = clampSec(idx);
      if (target === curSec) return;
      showSec(target);
      try { history.pushState(null, '', '#' + sections[target].id); } catch (_) { /* cheklangan muhit (artifact) */ }
    }
    window.goSec = goSec;
    window.addEventListener('popstate', () => { showSec(hashSec()); syncSubHash(); });
    window.addEventListener('hashchange', () => { showSec(hashSec()); syncSubHash(); });

    $('navTabs').addEventListener('click', (e) => {
      const b = e.target.closest('.nav-tab');
      if (b) goSec(Number(b.dataset.idx));
    });

    // Trekpad yoki g'ildirak tasodifan keyingi betga o'tib ketmasligi uchun wheel o'tishi o'chirilgan:
    // betlar yuqori menyu, tugmalar va klaviatura strelkalari bilan aniq almashadi.

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goSec(curSec + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goSec(curSec - 1); }
      if (e.code === 'Space' && sections[curSec] && sections[curSec].id === 'rang') {
        e.preventDefault();
        if (window._clShuffle) window._clShuffle();
      }
    });

    // Telefonda betlar barmoq bilan chapga-o'ngga surib almashadi
    let touch0 = null;
    window.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touch0 = e.target.closest('canvas, input, select, .gr-canvas, .gr-track') ? null : { x: t.clientX, y: t.clientY };
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (!touch0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touch0.x, dy = t.clientY - touch0.y;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 50) goSec(curSec + (dx < 0 ? 1 : -1));
      touch0 = null;
    }, { passive: true });

    // Bosh betdagi sonlar yumshoq sanab chiqadi
    function countUp() {
      const els = [...document.querySelectorAll('#heroStats [data-count]')];
      const fmt = (n) => Math.round(n).toLocaleString('en-US');
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min(1, (now - t0) / 1400);
        const e = 1 - Math.pow(1 - p, 4);
        els.forEach((el) => { el.textContent = fmt(+el.dataset.count * e); });
        if (p < 1 && curSec === 0) requestAnimationFrame(step);
        else els.forEach((el) => { el.textContent = fmt(+el.dataset.count); });
      })(t0);
    }

    // Mavzu (hiworld.club dagi kabi): yangi ko'rinish bosilgan nuqtadan doira bo'lib 1 soniyada
    // yoyiladi, tanlov shu brauzerda saqlanadi. Boshlang'ich mavzu <head> dagi skriptda qo'yiladi.
    const rootEl = document.documentElement;
    function setTheme(next) {
      try { localStorage.setItem('hw-theme', next); } catch (_) { /* saqlab bo'lmasa ham almashadi */ }
      rootEl.setAttribute('data-theme', next);
      rootEl.style.colorScheme = next;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#050a17' : '#eef2f8');
      $('themeBtn').setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    }
    $('themeBtn').setAttribute('aria-pressed', rootEl.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
    $('themeBtn').addEventListener('click', (e) => {
      const next = rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (!document.startViewTransition) { setTheme(next); return; }
      const w = rootEl.clientWidth, h = window.innerHeight, rect = e.currentTarget.getBoundingClientRect();
      // Sichqoncha yoki barmoq bilan bosilsa aynan shu nuqtadan, klaviaturada tugma markazidan
      const x = e.detail > 0 ? e.clientX : rect.left + rect.width / 2;
      const y = e.detail > 0 ? e.clientY : rect.top + rect.height / 2;
      const r0 = Math.hypot(Math.max(x - rect.left, rect.right - x), Math.max(y - rect.top, rect.bottom - y)) + 2;
      const r1 = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
      // Foizda: ekran masshtabi yoki zoom o'zgarsa ham doira markazi siljimaydi
      const diag = Math.hypot(w, h) / Math.SQRT2;
      rootEl.style.setProperty('--hw-x', (x / w * 100).toFixed(3) + '%');
      rootEl.style.setProperty('--hw-y', (y / h * 100).toFixed(3) + '%');
      rootEl.style.setProperty('--hw-r0', (r0 / diag * 100).toFixed(3) + '%');
      rootEl.style.setProperty('--hw-r', (r1 / diag * 100 + 1).toFixed(3) + '%');
      rootEl.classList.add('theme-switching');
      const done = () => rootEl.classList.remove('theme-switching');
      document.startViewTransition(() => setTheme(next)).finished.then(done, done);
    });

    // Canvas o'lchamini faqat o'zgarganda yangilaydi (ekran zichligini hisobga olib)
    function fitCanvas(c, ctx) {
      const r = c.parentElement.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (!w || !h) return null;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: r.width, h: r.height, dpr };
    }

    // --- 01-bet: yulduzli yadro ---
    (function initHeroCanvas() {
      const c = $('heroCanvas');
      const ctx = c.getContext('2d');
      function loop(now) {
        const t = now / 1000;
        const s = fitCanvas(c, ctx);
        if (s) {
          ctx.clearRect(0, 0, s.w, s.h);
          for (let i = 0; i < 56; i++) {
            const z = ((1 - ((t * 0.12 + i * 0.041) % 1)) || 0.02);
            const sx = Math.sin(i * 19.3) * 0.85, sy = Math.cos(i * 47.7) * 0.85;
            const x = s.w / 2 + (sx / z) * 95, y = s.h / 2 + (sy / z) * 65;
            ctx.fillStyle = i % 3 === 0 ? NEO : '#3b82f6';
            ctx.globalAlpha = Math.min(1, (1 - z) * 0.85);
            ctx.beginPath(); ctx.arc(x, y, (1 - z) * 2.6 + 0.6, 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    })();

    // --- 02-bet: 31 WOW effekt ---
    let selEf = EFFECTS[7]; // #08 Golografik karta
    const chip = (id, num, nom, on, i, style) => `<button class="item-chip${on ? ' is-selected' : ''}" data-id="${id}" title="${esc(nom)}" style="--i:${Math.min(i, 18)}"><span class="item-chip__num">${num}</span><span class="item-chip__name"${style || ''}>${esc(nom)}</span></button>`;
    const CHIP = { minW: 150, rowH: 44, gap: 7, pad: 10 };

    const efPager = makePager({
      list: $('efList'), prev: $('efPrev'), next: $('efNext'), info: $('efPage'), ...CHIP,
      render: (it, i) => chip(it.id, it.id, it.nom, it.id === selEf.id, i),
      anchor: (arr) => arr.indexOf(selEf)
    });

    function renderEfSelection(soft) {
      $('efDomain').textContent = selEf.ilhom;
      $('efMeta').textContent = '#' + selEf.id + ' · ' + selEf.qiyinlik + ' · ' + selEf.kategoriya;
      $('efTitle').textContent = selEf.nom + ' (' + selEf.en + ')';
      $('efWhere').textContent = 'Qayerda ishlatiladi: ' + selEf.qayerda;
      $('efTags').innerHTML = selEf.stek.map(s => `<span class="mini-pill">${esc(s)}</span>`).join('');
      $('efRules').innerHTML = selEf.qoidalar.map(q => `<div>${esc(q)}</div>`).join('');
      setCode('efPrompt', selEf.prompt);
      efPager.mark(selEf.id);
      if (soft) soften('efMeta', 'efTitle', 'efWhere', 'efTags', 'efPrompt', 'efRules', 'efStage');
    }
    $('efList').addEventListener('click', (e) => {
      const b = e.target.closest('.item-chip');
      if (!b || b.dataset.id === selEf.id) return;
      selEf = EFFECTS.find(x => x.id === b.dataset.id);
      renderEfSelection(true);
    });
    $('efCopyPrompt').onclick = () => copyText(selEf.prompt, '#' + selEf.id + ' prompti nusxalandi ✓');
    $('efCopyCmd').onclick = () => copyText(`/effekt ${selEf.id} — ${selEf.nom} effektini loyihamga qo'shib ber`, "/effekt buyrug'i nusxalandi ✓");
    efPager.set(EFFECTS);
    renderEfSelection(false);

    // ---------- 31 ta effektning har biri uchun alohida jonli demo ----------
    const TAU = Math.PI * 2;
    const lerp = (a, b, p) => a + (b - a) * p;
    const clamp01 = (p) => Math.max(0, Math.min(1, p));
    const ease = (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
    const pic = (nx, ny) => `hsl(${205 + 45 * Math.sin(nx * 5.1) + 30 * Math.cos(ny * 4.3)},88%,${40 + 20 * Math.sin((nx + ny) * 3.4)}%)`;
    const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); };
    const box = (w, h, k = 0.8) => { const H = Math.min(h * k, w * 0.5), W = Math.min(w * 0.72, H * 1.7); return { x: (w - W) / 2, y: (h - H) / 2, W, H }; };
    function label(c, txt, x, y, size, color, weight = 800, align = 'center') {
      c.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(txt, x, y);
    }
    function spark(c, x, y, r) {
      c.beginPath(); c.moveTo(x, y - r);
      c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
      c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
    }
    // «Rasm» o'rnida ishlatiladigan manzara: osmon, quyosh va tog'lar
    function scene(c, x, y, w, h, gray) {
      const g = c.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, gray ? '#334155' : BLUE); g.addColorStop(0.55, gray ? '#64748b' : NEO); g.addColorStop(1, gray ? '#94a3b8' : '#8b5cf6');
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = gray ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)';
      c.beginPath(); c.arc(x + w * 0.72, y + h * 0.3, Math.min(w, h) * 0.13, 0, TAU); c.fill();
      c.fillStyle = gray ? 'rgba(15,23,42,0.5)' : 'rgba(4,9,22,0.55)';
      c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h * 0.72); c.lineTo(x + w * 0.28, y + h * 0.45); c.lineTo(x + w * 0.5, y + h * 0.7);
      c.lineTo(x + w * 0.7, y + h * 0.52); c.lineTo(x + w, y + h * 0.8); c.lineTo(x + w, y + h); c.closePath(); c.fill();
    }
    const offCv = document.createElement('canvas');
    const offCx = offCv.getContext('2d', { willReadFrequently: true });
    function sceneToOff(W, H, gray) {
      offCv.width = Math.max(1, Math.round(W)); offCv.height = Math.max(1, Math.round(H));
      scene(offCx, 0, 0, offCv.width, offCv.height, gray);
    }
    function uiMock(c, b, light) {
      c.fillStyle = light ? '#eef2f8' : '#0a1223'; c.fillRect(b.x, b.y, b.W, b.H);
      c.fillStyle = light ? '#ffffff' : '#101b36'; rr(c, b.x + b.W * 0.08, b.y + b.H * 0.2, b.W * 0.84, b.H * 0.62, 12); c.fill();
      c.fillStyle = light ? '#0f172a' : '#f1f5f9'; rr(c, b.x + b.W * 0.16, b.y + b.H * 0.32, b.W * 0.4, b.H * 0.08, 6); c.fill();
      c.fillStyle = light ? 'rgba(15,23,42,0.25)' : 'rgba(241,245,249,0.25)';
      rr(c, b.x + b.W * 0.16, b.y + b.H * 0.47, b.W * 0.62, b.H * 0.05, 5); c.fill();
      rr(c, b.x + b.W * 0.16, b.y + b.H * 0.57, b.W * 0.5, b.H * 0.05, 5); c.fill();
      c.fillStyle = light ? BLUE : NEO; rr(c, b.x + b.W * 0.16, b.y + b.H * 0.67, b.W * 0.22, b.H * 0.09, 8); c.fill();
    }

    const DEMOS = {
      // 01 Pikselli namoyon bo'lish
      1: (c, w, h, t) => {
        const b = box(w, h), p = (t % 4.5) / 4.5;
        const px = [56, 40, 28, 18, 10, 5, 1, 1, 1][Math.min(8, Math.floor(p * 9))];
        sceneToOff(b.W / px, b.H / px);
        c.save(); rr(c, b.x, b.y, b.W, b.H, 16); c.clip();
        c.imageSmoothingEnabled = px === 1;
        c.drawImage(offCv, b.x, b.y, b.W, b.H);
        c.restore(); c.imageSmoothingEnabled = true;
      },
      // 02 Nuqtali rastr
      2: (c, w, h, t, mx, my) => {
        const u = Math.min(w, h), st = Math.max(14, u / 13);
        for (let y = st / 2; y < h; y += st) for (let x = st / 2; x < w; x += st) {
          const d = Math.hypot(x - mx, y - my);
          const r = st * 0.48 * (0.5 + 0.5 * Math.sin(d * 0.035 - t * 2.2));
          c.fillStyle = d < u * 0.34 ? NEO : '#2563eb';
          c.beginPath(); c.arc(x, y, Math.max(0.8, r), 0, TAU); c.fill();
        }
      },
      // 03 Aylana bo'ylab matn
      3: (c, w, h, t) => {
        const R = Math.min(w, h) * 0.36, txt = 'HI NEO • WOW EFFEKT • AYLANA MATN • ';
        c.save(); c.translate(w / 2, h / 2); c.rotate(t * 0.45);
        c.font = `800 ${R * 0.21}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (let i = 0; i < txt.length; i++) {
          c.save(); c.rotate(i / txt.length * TAU);
          c.fillStyle = i % 2 ? '#f1f5f9' : NEO; c.fillText(txt[i], 0, -R); c.restore();
        }
        c.restore();
        const g = c.createLinearGradient(w / 2 - R, h / 2 - R, w / 2 + R, h / 2 + R);
        g.addColorStop(0, NEO); g.addColorStop(1, BLUE); c.fillStyle = g;
        spark(c, w / 2, h / 2, R * (0.42 + 0.05 * Math.sin(t * 2)));
      },
      // 04 Plitkalar aylanishi
      4: (c, w, h, t) => {
        const b = box(w, h), cols = 7, rows = 4, tw = b.W / cols, th = b.H / rows;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const a = Math.cos(t * 1.5 - (q + r) * 0.38), sx = Math.max(0.03, Math.abs(a));
          const x = b.x + q * tw + tw / 2, y = b.y + r * th + th / 2;
          c.fillStyle = a > 0 ? pic(q / cols, r / rows) : ((q + r) % 2 ? '#0b1530' : '#13224a');
          rr(c, x - tw * sx / 2 + 1.5, y - th / 2 + 1.5, tw * sx - 3, th - 3, 6); c.fill();
        }
      },
      // 05 Kattalashtiruvchi lupa
      5: (c, w, h, t, mx, my) => {
        const u = Math.min(w, h), st = u / 6;
        const draw = (k) => {
          c.save(); c.translate(mx, my); c.scale(k, k); c.translate(-mx, -my);
          for (let y = st / 2, j = 0; y < h; y += st, j++) for (let x = st / 2, i = 0; x < w; x += st, i++) {
            c.fillStyle = (i + j) % 3 === 0 ? NEO : (i + j) % 3 === 1 ? '#2563eb' : '#1e293b';
            rr(c, x - st * 0.33, y - st * 0.33, st * 0.66, st * 0.66, st * 0.14); c.fill();
          }
          c.restore();
        };
        draw(1);
        const R = u * 0.3;
        c.save(); c.beginPath(); c.arc(mx, my, R, 0, TAU); c.clip();
        c.fillStyle = STAGE; c.fillRect(0, 0, w, h); draw(2.2); c.restore();
        c.lineWidth = 4; c.strokeStyle = '#f1f5f9'; c.beginPath(); c.arc(mx, my, R, 0, TAU); c.stroke();
        c.lineWidth = 7; c.lineCap = 'round'; c.beginPath();
        c.moveTo(mx + R * 0.72, my + R * 0.72); c.lineTo(mx + R * 1.15, my + R * 1.15); c.stroke();
      },
      // 06 Kursordan suv to'lqini
      6: (c, w, h, t, mx, my) => {
        const u = Math.min(w, h), st = Math.max(11, h / 16);
        c.lineWidth = 1.8;
        for (let y = st / 2; y < h; y += st) {
          c.beginPath();
          for (let x = 0; x <= w; x += 8) {
            const d = Math.hypot(x - mx, y - my);
            const o = Math.sin(d * 0.045 - t * 4) * u * 0.05 * Math.exp(-d / (u * 0.95));
            if (x === 0) c.moveTo(x, y + o); else c.lineTo(x, y + o);
          }
          c.strokeStyle = `rgba(56,225,255,${0.2 + 0.55 * (y / h)})`; c.stroke();
        }
        for (let i = 0; i < 3; i++) {
          const rad = ((t * 0.5 + i / 3) % 1) * u * 0.6;
          c.strokeStyle = `rgba(241,245,249,${0.5 * (1 - rad / (u * 0.6))})`; c.lineWidth = 2;
          c.beginPath(); c.arc(mx, my, rad, 0, TAU); c.stroke();
        }
      },
      // 07 Kartochkalar og'ishi
      7: (c, w, h, t, mx, my) => {
        const cw = Math.min(w * 0.22, h * 0.52), ch = cw * 1.32;
        for (let i = -1; i <= 1; i++) {
          const x = w / 2 + i * cw * 1.22, y = h / 2, dx = (mx - x) / w, dy = (my - y) / h;
          c.save(); c.translate(x, y); c.transform(1 - Math.abs(dx) * 0.3, dx * 0.32, -dy * 0.12, 1 - Math.abs(dy) * 0.25, 0, 0);
          const g = c.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2);
          g.addColorStop(0, ['#0052ff', '#22d3ee', '#8b5cf6'][i + 1]); g.addColorStop(1, '#0b1530');
          c.fillStyle = g; rr(c, -cw / 2, -ch / 2, cw, ch, cw * 0.1); c.fill();
          const s = c.createRadialGradient(dx * cw * 2, dy * ch * 2, 0, dx * cw * 2, dy * ch * 2, cw);
          s.addColorStop(0, 'rgba(255,255,255,0.45)'); s.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = s; rr(c, -cw / 2, -ch / 2, cw, ch, cw * 0.1); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.85)'; rr(c, -cw * 0.34, ch * 0.2, cw * 0.5, ch * 0.05, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.4)'; rr(c, -cw * 0.34, ch * 0.3, cw * 0.36, ch * 0.04, 4); c.fill();
          c.restore();
        }
      },
      // 08 Golografik karta
      8: (c, w, h, t, mx, my) => {
        const cw = Math.min(w * 0.56, h * 1.15), ch = cw * 0.58;
        const dx = (mx / w - 0.5), dy = (my / h - 0.5);
        c.save(); c.translate(w / 2, h / 2); c.transform(1, dy * 0.16, dx * 0.2, 1, 0, 0);
        const g = c.createLinearGradient(-cw / 2 + dx * cw, -ch / 2, cw / 2 - dx * cw * 0.6, ch / 2);
        g.addColorStop(0, '#6366f1'); g.addColorStop(0.35, '#ec4899'); g.addColorStop(0.7, '#22d3ee'); g.addColorStop(1, BLUE);
        c.fillStyle = g; rr(c, -cw / 2, -ch / 2, cw, ch, cw * 0.06); c.fill();
        const s = c.createLinearGradient(-cw / 2 + (dx + 0.5) * cw - cw * 0.3, 0, -cw / 2 + (dx + 0.5) * cw + cw * 0.3, 0);
        s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,0.4)'); s.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = s; rr(c, -cw / 2, -ch / 2, cw, ch, cw * 0.06); c.fill();
        label(c, 'GOLOGRAFIK KARTA', -cw * 0.42, -ch * 0.28, cw * 0.058, '#fff', 800, 'left');
        label(c, 'HI NEO · 8427 2026', -cw * 0.42, ch * 0.3, cw * 0.058, '#fff', 700, 'left');
        c.fillStyle = 'rgba(255,255,255,0.75)'; rr(c, cw * 0.26, -ch * 0.36, cw * 0.15, ch * 0.2, 6); c.fill();
        c.restore();
      },
      // 09 Cheksiz skroll (yuguruvchi qatorlar)
      9: (c, w, h, t) => {
        const rows = 3, fs = h / (rows + 0.9), txt = 'HI NEO ✦ CHEKSIZ ✦ SKROLL ✦ ';
        c.font = `900 ${fs}px system-ui, sans-serif`; c.textBaseline = 'middle'; c.textAlign = 'left';
        const tw = c.measureText(txt).width;
        for (let r = 0; r < rows; r++) {
          const off = (t * 80 * (1 + r * 0.35)) % tw, y = (r + 0.72) * h / (rows + 0.45);
          let x = r % 2 ? off - tw : -off;
          c.lineWidth = 1.6; c.strokeStyle = 'rgba(241,245,249,0.45)'; c.fillStyle = NEO;
          for (; x < w; x += tw) { if (r === 1) c.fillText(txt, x, y); else c.strokeText(txt, x, y); }
        }
      },
      // 10 Oldin / keyin slayderi
      10: (c, w, h, t, mx) => {
        const b = box(w, h), sx = Math.max(b.x + 8, Math.min(b.x + b.W - 8, mx));
        c.save(); rr(c, b.x, b.y, b.W, b.H, 16); c.clip();
        scene(c, b.x, b.y, b.W, b.H, true);
        c.save(); c.beginPath(); c.rect(sx, b.y, b.x + b.W - sx, b.H); c.clip(); scene(c, b.x, b.y, b.W, b.H); c.restore();
        label(c, 'OLDIN', b.x + 16, b.y + 20, 12, 'rgba(255,255,255,0.85)', 800, 'left');
        label(c, 'KEYIN', b.x + b.W - 16, b.y + 20, 12, 'rgba(255,255,255,0.95)', 800, 'right');
        c.restore();
        c.fillStyle = '#fff'; c.fillRect(sx - 1.5, b.y, 3, b.H);
        c.beginPath(); c.arc(sx, b.y + b.H / 2, 16, 0, TAU); c.fill();
        c.fillStyle = BLUE; c.beginPath();
        c.moveTo(sx - 9, b.y + b.H / 2); c.lineTo(sx - 3, b.y + b.H / 2 - 5); c.lineTo(sx - 3, b.y + b.H / 2 + 5);
        c.moveTo(sx + 9, b.y + b.H / 2); c.lineTo(sx + 3, b.y + b.H / 2 - 5); c.lineTo(sx + 3, b.y + b.H / 2 + 5); c.fill();
      },
      // 11 Tasmalarga kesib ochish
      11: (c, w, h, t) => {
        const b = box(w, h), n = 9, sw = b.W / n, p = (t % 5) / 5, k = p < 0.5 ? p * 2 : (1 - p) * 2;
        c.save(); rr(c, b.x, b.y, b.W, b.H, 16); c.clip(); scene(c, b.x, b.y, b.W, b.H);
        for (let i = 0; i < n; i++) {
          const e = ease(clamp01(k * 2.1 - i * 0.11));
          c.fillStyle = i % 2 ? '#0b1530' : '#13224a';
          c.fillRect(b.x + i * sw, b.y + (i % 2 ? 1 : -1) * e * b.H, sw + 0.6, b.H);
        }
        c.restore();
      },
      // 12 Gravitatsiya
      12: (c, w, h, t, mx, my, mem) => {
        const u = Math.min(w, h);
        if (!mem.b || mem.w !== w || mem.h !== h) {
          mem.w = w; mem.h = h; mem.t = t;
          mem.b = Array.from({ length: 13 }, (_, i) => ({ x: w * (0.08 + 0.84 * hash(i)), y: h * 0.3 * hash(i + 9), vx: (hash(i + 3) - 0.5) * 160, vy: 0, r: u * (0.045 + 0.05 * hash(i + 5)), k: i }));
        }
        const dt = Math.min(0.033, Math.max(0, t - mem.t)); mem.t = t;
        for (const b of mem.b) {
          b.vy += 950 * dt;
          const dx = b.x - mx, dy = b.y - my, d = Math.hypot(dx, dy) || 1;
          if (d < u * 0.3) { b.vx += dx / d * 1700 * dt; b.vy += dy / d * 1700 * dt; }
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y > h - b.r) { b.y = h - b.r; b.vy *= -0.72; b.vx *= 0.985; }
          if (b.y < b.r) { b.y = b.r; b.vy *= -0.6; }
          if (b.x < b.r) { b.x = b.r; b.vx *= -0.8; }
          if (b.x > w - b.r) { b.x = w - b.r; b.vx *= -0.8; }
          const g = c.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
          g.addColorStop(0, '#fff'); g.addColorStop(0.25, [NEO, '#3b82f6', '#8b5cf6'][b.k % 3]); g.addColorStop(1, '#0b1530');
          c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
        }
      },
      // 13 Jele elementlar
      13: (c, w, h, t) => {
        const u = Math.min(w, h), lt = t % 2.4, k = Math.exp(-lt * 1.7) * Math.sin(lt * 13);
        const bw = u * 0.62, bh = u * 0.42;
        c.fillStyle = 'rgba(56,225,255,0.12)'; c.beginPath(); c.ellipse(w / 2, h / 2 + bh * 0.72, bw * 0.5 * (1 + k * 0.25), u * 0.035, 0, 0, TAU); c.fill();
        c.save(); c.translate(w / 2, h / 2 + bh * 0.5); c.scale(1 + k * 0.3, 1 - k * 0.3); c.translate(0, -bh * 0.5);
        const g = c.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2); g.addColorStop(0, NEO); g.addColorStop(1, BLUE);
        c.fillStyle = g; rr(c, -bw / 2, -bh / 2, bw, bh, bh * 0.32); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-bw * 0.18, -bh * 0.24, bw * 0.2, bh * 0.09, -0.2, 0, TAU); c.fill();
        label(c, 'JELE', 0, bh * 0.05, bh * 0.34, '#fff', 900);
        c.restore();
      },
      // 14 Fonarik
      14: (c, w, h, t, mx, my) => {
        const u = Math.min(w, h), R = u * 0.42;
        c.save(); c.beginPath(); c.arc(mx, my, R, 0, TAU); c.clip();
        c.fillStyle = '#0b1f4d'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 40; i++) { c.fillStyle = i % 2 ? 'rgba(56,225,255,0.5)' : 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(hash(i) * w, hash(i + 50) * h, 2 + hash(i + 7) * 3, 0, TAU); c.fill(); }
        label(c, 'HI NEO', w / 2, h / 2 - u * 0.04, u * 0.3, NEO, 900);
        label(c, 'yashirin matn faqat yorug\'likda ko\'rinadi', w / 2, h / 2 + u * 0.2, u * 0.06, '#f1f5f9', 600);
        c.restore();
        const g = c.createRadialGradient(mx, my, R * 0.15, mx, my, R);
        g.addColorStop(0, 'rgba(4,9,22,0)'); g.addColorStop(1, 'rgba(4,9,22,1)');
        c.fillStyle = g; c.beginPath(); c.arc(mx, my, R + 1, 0, TAU); c.fill();
      },
      // 15 Qatlamni o'chirish (skretch)
      15: (c, w, h, t, mx, my, mem) => {
        const b = box(w, h);
        if (!mem.off || mem.w !== w || mem.h !== h || t - mem.t0 > 9) {
          mem.off = document.createElement('canvas'); mem.off.width = Math.round(w); mem.off.height = Math.round(h);
          mem.w = w; mem.h = h; mem.t0 = t; mem.last = null;
          const o = mem.off.getContext('2d');
          const g = o.createLinearGradient(b.x, b.y, b.x + b.W, b.y + b.H);
          g.addColorStop(0, '#94a3b8'); g.addColorStop(0.5, '#e2e8f0'); g.addColorStop(1, '#64748b');
          o.fillStyle = g; o.beginPath(); o.roundRect(b.x, b.y, b.W, b.H, 16); o.fill();
          o.font = `800 ${b.H * 0.13}px system-ui, sans-serif`; o.textAlign = 'center'; o.textBaseline = 'middle';
          o.fillStyle = 'rgba(15,23,42,0.5)'; o.fillText('SHU YERNI ISHQALANG', w / 2, h / 2);
        }
        const o = mem.off.getContext('2d'), l = mem.last || [mx, my];
        o.globalCompositeOperation = 'destination-out'; o.lineWidth = Math.min(w, h) * 0.17; o.lineCap = 'round';
        o.beginPath(); o.moveTo(l[0], l[1]); o.lineTo(mx, my); o.stroke(); mem.last = [mx, my];
        c.save(); rr(c, b.x, b.y, b.W, b.H, 16); c.clip();
        const g = c.createLinearGradient(b.x, b.y, b.x + b.W, b.y + b.H); g.addColorStop(0, BLUE); g.addColorStop(1, '#8b5cf6');
        c.fillStyle = g; c.fillRect(b.x, b.y, b.W, b.H);
        label(c, '−50%', w / 2, h / 2 - b.H * 0.06, b.H * 0.44, '#fff', 900);
        label(c, "SOVG'A CHEGIRMA", w / 2, h / 2 + b.H * 0.3, b.H * 0.1, 'rgba(255,255,255,0.85)', 700);
        c.restore();
        c.drawImage(mem.off, 0, 0, w, h);
      },
      // 16 Setkani qayta taxlash
      16: (c, w, h, t, mx, my, mem) => {
        const b = box(w, h), cols = 4, rows = 3, n = cols * rows, per = 1.9, step = Math.floor(t / per);
        if (mem.step !== step) {
          mem.from = mem.to || [...Array(n).keys()];
          mem.to = [...Array(n).keys()].sort((a, d) => hash(a * 3.1 + step * 7.7) - hash(d * 3.1 + step * 7.7));
          mem.step = step;
        }
        const p = ease(clamp01((t / per - step) * 1.5)), tw = b.W / cols, th = b.H / rows;
        for (let i = 0; i < n; i++) {
          const a = mem.from[i], d = mem.to[i];
          const x = lerp(a % cols, d % cols, p) * tw + b.x, y = lerp(Math.floor(a / cols), Math.floor(d / cols), p) * th + b.y;
          c.fillStyle = pic(i / n, (i % 3) / 3); rr(c, x + 4, y + 4, tw - 8, th - 8, 10); c.fill();
          label(c, two(i + 1), x + tw / 2, y + th / 2, th * 0.3, 'rgba(255,255,255,0.92)', 800);
        }
      },
      // 17 Glitch effekti
      17: (c, w, h, t, mx, my, mem, dpr) => {
        const fs = Math.min(w * 0.2, h * 0.52), on = Math.sin(t * 23) > 0.55 || Math.sin(t * 7.3) > 0.88;
        const j = on ? Math.sin(t * 91) * fs * 0.08 : fs * 0.014;
        c.globalCompositeOperation = 'screen';
        label(c, 'GLITCH', w / 2 - j, h / 2, fs, '#ff0055', 900);
        label(c, 'GLITCH', w / 2 + j, h / 2 + j * 0.3, fs, '#00f0ff', 900);
        label(c, 'GLITCH', w / 2, h / 2, fs, '#f1f5f9', 900);
        c.globalCompositeOperation = 'source-over';
        if (on) for (let k = 0; k < 4; k++) {
          const sy = h / 2 - fs / 2 + hash(k + Math.floor(t * 14)) * fs, sh = fs * 0.1, dx = Math.sin(t * 60 + k * 2) * fs * 0.2;
          c.drawImage(c.canvas, 0, sy * dpr, w * dpr, sh * dpr, dx, sy, w, sh);
        }
      },
      // 18 Shakllar morfingi
      18: (c, w, h, t) => {
        const R = Math.min(w, h) * 0.36;
        const poly = (n) => (a) => Math.cos(Math.PI / n) / Math.cos(((a % (TAU / n)) + TAU / n) % (TAU / n) - Math.PI / n);
        const shapes = [() => 0.86, poly(3), poly(4), (a) => 0.68 + 0.3 * Math.cos(5 * a), poly(6)];
        const k = t / 1.7, i = Math.floor(k) % shapes.length, p = ease(clamp01((k % 1) * 1.6));
        const A = shapes[i], B = shapes[(i + 1) % shapes.length];
        c.save(); c.translate(w / 2, h / 2); c.rotate(-Math.PI / 2 + t * 0.2);
        c.beginPath();
        for (let s = 0; s <= 160; s++) { const a = s / 160 * TAU, r = lerp(A(a), B(a), p) * R; if (s) c.lineTo(Math.cos(a) * r, Math.sin(a) * r); else c.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.closePath();
        const g = c.createLinearGradient(-R, -R, R, R); g.addColorStop(0, NEO); g.addColorStop(0.6, BLUE); g.addColorStop(1, '#8b5cf6');
        c.fillStyle = g; c.fill(); c.restore();
      },
      // 19 Yorug'lik tezligiga sakrash
      19: (c, w, h, t) => {
        const m = Math.hypot(w, h) / 2, sp = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 0.8));
        c.lineCap = 'round';
        for (let i = 0; i < 130; i++) {
          const a = hash(i) * TAU, z = (hash(i + 200) + t * (0.25 + sp * 0.5)) % 1, r0 = z * z * m, r1 = r0 + z * sp * m * 0.3 + 1;
          c.strokeStyle = i % 4 ? `rgba(241,245,249,${z})` : `rgba(56,225,255,${z})`; c.lineWidth = 0.6 + z * 2.6;
          c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0); c.lineTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1); c.stroke();
        }
      },
      // 20 Rasmlardan 3D-sfera
      20: (c, w, h, t, mx, my) => {
        const u = Math.min(w, h), N = 54, R = u * 0.4, ax = (my / h - 0.5) * 1.2, pts = [];
        for (let i = 0; i < N; i++) {
          const y0 = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y0 * y0), th = i * 2.39996 + t * 0.55 + (mx / w - 0.5) * 2;
          const x = Math.cos(th) * rad, z0 = Math.sin(th) * rad;
          pts.push({ x, y: y0 * Math.cos(ax) - z0 * Math.sin(ax), z: y0 * Math.sin(ax) + z0 * Math.cos(ax), i });
        }
        pts.sort((a, b) => a.z - b.z);
        for (const p of pts) {
          const d = (p.z + 1) / 2, s = u * 0.085 * (0.5 + 0.6 * d);
          c.globalAlpha = 0.3 + 0.7 * d; c.fillStyle = pic(p.i / N, p.i % 5 / 5);
          rr(c, w / 2 + p.x * R - s / 2, h / 2 + p.y * R - s * 0.36, s, s * 0.72, s * 0.14); c.fill();
        }
        c.globalAlpha = 1;
      },
      // 21 Spiral galereya
      21: (c, w, h, t) => {
        const u = Math.min(w, h), N = 16, cards = [];
        for (let i = 0; i < N; i++) {
          const a = i * 0.72 + t * 0.8, yy = (((i / N + t * 0.06) % 1) - 0.5) * h * 1.15;
          cards.push({ x: w / 2 + Math.cos(a) * Math.min(w * 0.34, u * 0.7), y: h / 2 + yy, z: Math.sin(a), i });
        }
        cards.sort((a, b) => a.z - b.z);
        for (const k of cards) {
          const d = (k.z + 1) / 2, cw = u * 0.34 * (0.5 + 0.5 * d), ch = cw * 0.64;
          c.globalAlpha = 0.25 + 0.75 * d; c.fillStyle = pic(k.i / N, 0.3); rr(c, k.x - cw / 2, k.y - ch / 2, cw, ch, cw * 0.08); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.75)'; rr(c, k.x - cw * 0.38, k.y + ch * 0.2, cw * 0.4, ch * 0.09, 3); c.fill();
        }
        c.globalAlpha = 1;
      },
      // 22 3D-tunnel
      22: (c, w, h, t, mx, my) => {
        const N = 14;
        for (let i = 0; i < N; i++) {
          const z = (i / N + t * 0.22) % 1, s = z * z, rw = s * w * 1.25, rh = s * h * 1.25;
          const x = lerp(mx, w / 2, s), y = lerp(my, h / 2, s);
          c.strokeStyle = i % 2 ? `rgba(56,225,255,${0.15 + 0.85 * s})` : `rgba(59,130,246,${0.15 + 0.85 * s})`; c.lineWidth = 1 + 4 * s;
          rr(c, x - rw / 2, y - rh / 2, rw, rh, Math.min(rw, rh) * 0.14); c.stroke();
        }
      },
      // 23 Kartochkalar dastasi
      23: (c, w, h, t) => {
        const u = Math.min(w, h), N = 5, cw = Math.min(w * 0.42, u * 0.78), ch = cw * 0.6, cyc = t / 1.7, arr = [];
        for (let j = 0; j < N; j++) {
          const pos = (((j - cyc) % N) + N) % N, q = pos - (N - 1), moving = q > 0, d = Math.min(pos, N - 1);
          arr.push({ j, d, key: moving && q > 0.5 ? -1 : pos, slide: moving ? Math.sin(q * Math.PI) * cw * 0.95 : 0 });
        }
        arr.sort((a, b) => b.key - a.key);
        for (const k of arr) {
          const s = 1 - k.d * 0.05;
          c.save(); c.translate(w / 2 - (N - 1) * u * 0.02 + k.d * u * 0.04 + k.slide, h / 2 + (N - 1) * u * 0.02 - k.d * u * 0.045); c.scale(s, s); c.rotate(k.slide ? k.slide / cw * 0.25 : 0);
          c.fillStyle = pic(k.j / N, 0.6); rr(c, -cw / 2, -ch / 2, cw, ch, cw * 0.07); c.fill();
          c.strokeStyle = 'rgba(4,9,22,0.55)'; c.lineWidth = 2; c.stroke();
          label(c, 'KARTA ' + two(k.j + 1), -cw * 0.4, -ch * 0.24, ch * 0.14, '#fff', 800, 'left');
          c.fillStyle = 'rgba(255,255,255,0.55)'; rr(c, -cw * 0.4, ch * 0.16, cw * 0.5, ch * 0.08, 4); c.fill();
          c.restore();
        }
      },
      // 24 Kursor ortidan suyuqlik
      24: (c, w, h, t, mx, my, mem) => {
        const u = Math.min(w, h);
        mem.tr = mem.tr || []; mem.tr.unshift({ x: mx, y: my }); if (mem.tr.length > 34) mem.tr.pop();
        c.globalCompositeOperation = 'lighter';
        mem.tr.forEach((p, i) => {
          const k = 1 - i / mem.tr.length, R = u * 0.26 * k + 6;
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
          g.addColorStop(0, `hsla(${190 + i * 4.5 + t * 30},95%,60%,${0.2 * k})`); g.addColorStop(1, 'hsla(220,90%,50%,0)');
          c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, R, 0, TAU); c.fill();
        });
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#fff'; c.beginPath(); c.arc(mx, my, 5, 0, TAU); c.fill();
      },
      // 25 Parchalarga sochilish
      25: (c, w, h, t) => {
        const b = box(w, h, 0.62), cols = 9, rows = 5, cw = b.W / cols, ch = b.H / rows, p = (t % 5) / 5;
        const k = ease(clamp01((p < 0.5 ? p * 2 : (1 - p) * 2) * 1.5 - 0.25));
        sceneToOff(b.W, b.H);
        const sw = offCv.width / cols, sh = offCv.height / rows;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const i = r * cols + q, cx = b.x + q * cw + cw / 2, cy = b.y + r * ch + ch / 2;
          const dx = cx - w / 2, dy = cy - h / 2, far = 0.5 + hash(i) * 1.1;
          c.save(); c.translate(cx + dx * k * far, cy + dy * k * far * 1.3 + k * hash(i + 4) * 30);
          c.rotate(k * (hash(i + 8) - 0.5) * 3); c.globalAlpha = 1 - k * 0.35;
          c.drawImage(offCv, q * sw, r * sh, sw, sh, -cw / 2, -ch / 2, cw + 0.6, ch + 0.6); c.restore();
        }
        c.globalAlpha = 1;
      },
      // 26 Yopishqoq tomchilar
      26: (c, w, h, t, mx, my) => {
        const u = Math.min(w, h), cell = Math.max(5, Math.round(u / 52)), balls = [{ x: mx, y: my, r: u * 0.17 }];
        for (let i = 0; i < 5; i++) balls.push({ x: w / 2 + Math.cos(t * (0.5 + i * 0.17) + i * 2) * w * 0.3, y: h / 2 + Math.sin(t * (0.7 + i * 0.13) + i) * h * 0.3, r: u * (0.1 + 0.03 * i) });
        for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
          let f = 0;
          for (const b of balls) { const dx = x - b.x, dy = y - b.y; f += b.r * b.r / (dx * dx + dy * dy + 1); }
          if (f > 1) { c.fillStyle = f > 1.7 ? NEO : f > 1.25 ? '#3b82f6' : BLUE; c.fillRect(x, y, cell + 0.5, cell + 0.5); }
        }
      },
      // 27 Svetodiodli tablo matni
      27: (c, w, h, t, mx, my, mem) => {
        if (!mem.d) {
          const o = document.createElement('canvas'), x = o.getContext('2d'), txt = 'HI NEO  *  WOW EFFEKT  *  LED TABLO  *  ';
          x.font = 'bold 10px monospace'; const tw = Math.ceil(x.measureText(txt).width);
          o.width = tw; o.height = 11; x.font = 'bold 10px monospace'; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(txt, 0, 1);
          mem.d = x.getImageData(0, 0, tw, 11).data; mem.tw = tw;
        }
        const rows = 11, pitch = Math.min(h / (rows + 2), w / 28), cols = Math.ceil(w / pitch) + 1, sc = Math.floor(t * 13), y0 = (h - rows * pitch) / 2;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const lit = mem.d[(r * mem.tw + ((q + sc) % mem.tw)) * 4 + 3] > 110;
          c.fillStyle = lit ? NEO : '#0b1530';
          c.beginPath(); c.arc(q * pitch + pitch / 2, y0 + r * pitch + pitch / 2, pitch * (lit ? 0.4 : 0.26), 0, TAU); c.fill();
        }
      },
      // 28 Obyekt ortidagi matn
      28: (c, w, h, t, mx) => {
        const u = Math.min(w, h), fs = Math.min(w * 0.3, h * 0.72), R = u * 0.3, by = h / 2 + Math.sin(t * 1.4) * u * 0.05;
        label(c, 'NEO', w / 2 - (mx / w - 0.5) * u * 0.25, h / 2, fs, '#f1f5f9', 900);
        c.strokeStyle = 'rgba(56,225,255,0.9)'; c.lineWidth = 4;
        c.beginPath(); c.ellipse(w / 2, by, R * 1.6, R * 0.42, -0.25, Math.PI, TAU); c.stroke();
        const g = c.createRadialGradient(w / 2 - R * 0.35, by - R * 0.35, R * 0.1, w / 2, by, R);
        g.addColorStop(0, '#7dd3fc'); g.addColorStop(0.45, BLUE); g.addColorStop(1, '#0b1530');
        c.fillStyle = g; c.beginPath(); c.arc(w / 2, by, R, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(w / 2, by, R * 1.6, R * 0.42, -0.25, 0, Math.PI); c.stroke();
      },
      // 29 Sahifalarni varaqlash
      29: (c, w, h, t) => {
        const PW = Math.min(w * 0.3, h * 0.58), PH = PW * 1.3, sx = w / 2, top = h / 2 - PH / 2;
        const lines = (x, dir, n) => { for (let i = 0; i < n; i++) { c.fillStyle = 'rgba(15,23,42,0.22)'; const lw = PW * (0.72 - (i % 3) * 0.1); c.fillRect(dir > 0 ? x + PW * 0.12 : x - PW * 0.12 - lw, top + PH * (0.16 + i * 0.1), lw, PH * 0.035); } };
        c.fillStyle = '#e2e8f0'; rr(c, sx - PW, top, PW, PH, 8); c.fill(); lines(sx, -1, 7);
        c.fillStyle = '#f1f5f9'; rr(c, sx, top, PW, PH, 8); c.fill(); lines(sx, 1, 7);
        const a = ((t % 2.8) / 2.8) * Math.PI, k = Math.cos(a), lift = Math.sin(a) * PH * 0.08;
        const g = c.createLinearGradient(sx, 0, sx + PW * k, 0); g.addColorStop(0, k > 0 ? '#cbd5e1' : '#94a3b8'); g.addColorStop(1, '#ffffff');
        c.fillStyle = g; c.beginPath(); c.moveTo(sx, top); c.lineTo(sx + PW * k, top - lift); c.lineTo(sx + PW * k, top + PH - lift); c.lineTo(sx, top + PH); c.closePath(); c.fill();
        c.fillStyle = BLUE; c.fillRect(sx - 2, top - 2, 4, PH + 4);
      },
      // 30 Doira bo'ylab tema almashinuvi
      30: (c, w, h, t) => {
        const b = box(w, h), per = 3.4, ph = Math.floor(t / per) % 2, p = ease(clamp01(((t % per) / per) * 1.7));
        const bx = b.x + b.W - 30, by = b.y + 30;
        c.save(); rr(c, b.x, b.y, b.W, b.H, 16); c.clip();
        uiMock(c, b, ph === 1);
        c.save(); c.beginPath(); c.arc(bx, by, p * Math.hypot(b.W, b.H), 0, TAU); c.clip(); uiMock(c, b, ph === 0); c.restore();
        c.fillStyle = ph === 0 ? BLUE : NEO; c.beginPath(); c.arc(bx, by, 13, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by, 5.5, 0, TAU); c.fill();
        c.restore();
      },
      // 31 Matnli 3D-lenta
      31: (c, w, h, t) => {
        const u = Math.min(w, h), txt = 'HI NEO • 3D LENTA • WOW EFFEKT • ', N = Math.max(18, Math.round(w / 26)), bh = u * 0.34, sw = w / (N - 1);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${bh * 0.62}px system-ui, sans-serif`;
        for (let i = 0; i < N; i++) {
          const x = i * sw, ph = i * 0.36 - t * 2, k = Math.cos(ph), y = h / 2 + Math.sin(i * 0.3 + t * 0.9) * h * 0.14;
          c.fillStyle = k > 0 ? `hsl(${205 + i * 2},92%,${30 + k * 26}%)` : `hsl(225,60%,${10 + (-k) * 10}%)`;
          c.fillRect(x - sw / 2 - 0.5, y - bh * Math.abs(k) / 2, sw + 1, bh * Math.abs(k));
          if (Math.abs(k) > 0.18) {
            c.save(); c.translate(x, y); c.scale(1, k);
            c.fillStyle = k > 0 ? '#fff' : 'rgba(56,225,255,0.35)';
            c.fillText(txt[(i + Math.floor(t * 4)) % txt.length], 0, 0); c.restore();
          }
        }
      }
    };

    // Tanlangan effektning jonli demosi (kursor bilan boshqariladi)
    (function initEfCanvas() {
      const stage = $('efStage');
      const canvas = $('efCanvas');
      const ctx = canvas.getContext('2d');
      let hx = 0.5, hy = 0.5, hover = false, sx = 0.5, sy = 0.5, mem = {}, memFor = null;
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        hx = (e.clientX - r.left) / r.width; hy = (e.clientY - r.top) / r.height; hover = true;
      });
      stage.addEventListener('pointerleave', () => { hover = false; });

      function loop(now) {
        const s = fitCanvas(canvas, ctx);
        if (s) {
          const t = now / 1000;
          if (memFor !== selEf.id) { mem = {}; memFor = selEf.id; }
          // Kursor bo'lmasa, nuqta o'zi ravon aylanib yuradi
          const tx = hover ? hx : 0.5 + 0.3 * Math.cos(t * 0.9), ty = hover ? hy : 0.5 + 0.26 * Math.sin(t * 1.3);
          sx += (tx - sx) * 0.12; sy += (ty - sy) * 0.12;
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = STAGE; ctx.fillRect(0, 0, s.w, s.h);
          ctx.save();
          DEMOS[selEf.raqam](ctx, s.w, s.h, t, sx * s.w, sy * s.h, mem, s.dpr);
          ctx.restore();
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    })();

    // --- 03-bet: 64 CSS animatsiya ---
    let curAnStyle = 'all';
    let selAn = ANIMS[0];
    const anFilterEl = $('anStyleFilter');
    const anItems = () => curAnStyle === 'all' ? ANIMS : ANIMS.filter(a => a.uslub === curAnStyle);

    anFilterEl.innerHTML = `<button class="mini-pill is-active" data-st="all">Barchasi (${ANIMS.length})</button>` +
      Object.entries(ANIM_STYLES).map(([k, v]) => `<button class="mini-pill" data-st="${k}">${v.split(' ')[0]}</button>`).join('');

    const anPager = makePager({
      list: $('anList'), prev: $('anPrev'), next: $('anNext'), info: $('anPage'), ...CHIP,
      render: (a, i) => chip(a.id, a.id, a.nom, a.id === selAn.id, i),
      anchor: (arr) => arr.indexOf(selAn)
    });

    function selectAnim(a, soft) {
      selAn = a;
      const box = $('anPreviewBox');
      box.className = 'anim-preview';
      void box.offsetWidth;
      box.className = 'anim-preview ' + a.klass;
      $('anClassLabel').textContent = '.' + a.klass;
      $('anMeta').textContent = '#' + a.id + ' · ' + a.davomiylik + ' · ' + a.uslub;
      $('anTitle').textContent = a.nom + ' (' + a.en + ')';
      setCode('anCode', a.css);
      anPager.mark(a.id);
      if (soft) soften('anMeta', 'anTitle', 'anCode');
    }

    anFilterEl.addEventListener('click', e => {
      const b = e.target.closest('.mini-pill');
      if (!b) return;
      curAnStyle = b.dataset.st;
      anFilterEl.querySelectorAll('.mini-pill').forEach(p => p.classList.toggle('is-active', p === b));
      const arr = anItems();
      $('anCount').textContent = arr.length + ' ta animatsiya';
      anPager.set(arr);
    });
    $('anList').addEventListener('click', e => {
      const b = e.target.closest('.item-chip');
      if (b) selectAnim(ANIMS.find(x => x.id === b.dataset.id), true);
    });
    $('anCopyCss').onclick = () => copyText(selAn.css, '.' + selAn.klass + ' CSS nusxalandi ✓');
    $('anCopyCmd').onclick = () => copyText(`/animatsiya ${selAn.slug} — shu CSS animatsiyani loyihamga ula`, "/animatsiya buyrug'i nusxalandi ✓");
    anPager.set(ANIMS);
    selectAnim(ANIMS[0], false);

    // --- 04-bet: 3,040 minimalist SVG ikonka ---
    const icCatEl = $('icCat');
    const icGridEl = $('icGrid');
    const icSearchEl = $('icSearch');
    const icStrokeEl = $('icStroke');
    let selIcon = ICONS.find(x => x.id === 'home') || ICONS[0];

    icCatEl.innerHTML = `<option value="all">Barcha yo'nalishlar (${ICONS.length.toLocaleString('en-US')})</option>` +
      Object.entries(ICON_CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

    function buildRawSvg(ic, sw, sz) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ic.svg}</svg>`;
    }

    const icPager = makePager({
      list: icGridEl, prev: $('icPrev'), next: $('icNext'), info: $('icPageInfo'),
      minW: 78, rowH: 72, gap: 8, pad: 12,
      render: (ic, i) => `<button class="icon-cell${ic.id === selIcon.id ? ' is-selected' : ''}" data-id="${ic.id}" title="${esc(ic.nom)} (${ic.id})" style="--i:${Math.min(i, 18)}">${buildRawSvg(ic, icStrokeEl.value, 28)}<span>${ic.id}</span></button>`
    });

    function selectIcon(ic, soft) {
      selIcon = ic;
      const sw = icStrokeEl.value;
      $('icBigPreview').innerHTML = buildRawSvg(ic, sw, 44);
      $('icTitle').textContent = ic.nom;
      $('icIdLabel').textContent = 'id: ' + ic.id + " · bo'lim: " + ic.kat;
      setCode('icCode', buildRawSvg(ic, sw, 24));
      icPager.mark(ic.id);
      if (soft) soften('icBigPreview', 'icTitle', 'icIdLabel', 'icCode');
    }

    function filterIcons() {
      const q = icSearchEl.value.trim().toLowerCase();
      const cat = icCatEl.value;
      const arr = ICONS.filter(ic => {
        if (cat !== 'all' && ic.kat !== cat) return false;
        if (!q) return true;
        return ic.id.includes(q) || ic.nom.toLowerCase().includes(q) || ic.en.includes(q.replace(/['-]/g, ''));
      });
      $('icCountInfo').textContent = arr.length.toLocaleString('en-US') + ' ta ikonka';
      icPager.set(arr);
    }

    icSearchEl.addEventListener('input', filterIcons);
    icCatEl.addEventListener('change', filterIcons);
    icStrokeEl.addEventListener('change', () => { icPager.redraw(); selectIcon(selIcon, true); });
    icGridEl.addEventListener('click', e => {
      const cell = e.target.closest('.icon-cell');
      if (!cell) return;
      const found = ICONS.find(x => x.id === cell.dataset.id);
      if (found) selectIcon(found, true);
    });
    $('icCopySvg').onclick = () => copyText(buildRawSvg(selIcon, icStrokeEl.value, 24), selIcon.id + '.svg nusxalandi ✓');
    $('icCopyJsx').onclick = () => {
      const jsx = buildRawSvg(selIcon, icStrokeEl.value, 24)
        .replace(/stroke-width=/g, 'strokeWidth=')
        .replace(/stroke-linecap=/g, 'strokeLinecap=')
        .replace(/stroke-linejoin=/g, 'strokeLinejoin=');
      copyText(jsx, selIcon.id + ' JSX nusxalandi ✓');
    };
    filterIcons();
    selectIcon(selIcon, false);

    // --- 05-bet: 60 shrift va 24 juftlik (Google Fonts) ---
    const FONT_BY_ID = Object.fromEntries(FONTS.map(f => [f.id, f]));
    const fnFilterEl = $('fnFilter');
    let curFnFilter = 'all';
    let selFont = FONTS[0];   // shrift yoki juftlik
    const isPair = (x) => !!x.sarlavha;
    const loadedCss = new Set();
    function loadCss(href) {
      if (loadedCss.has(href)) return;
      loadedCss.add(href);
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      document.head.appendChild(l);
    }
    const famCss = (f) => `'${f.nom}', ${f.css.split(', ').slice(1).join(', ').replace(/;$/, '')}`;
    // Ro'yxatdagi nomlar o'z shriftida ko'rinadi: faqat kerakli harflar yuklanadi
    function loadNameFonts(fonts) {
      if (!fonts.length) return;
      const chars = [...new Set(fonts.map(f => f.nom).join(''))].join('');
      loadCss('https://fonts.googleapis.com/css2?' + fonts.map(f => 'family=' + f.nom.replace(/ /g, '+')).join('&') +
        '&text=' + encodeURIComponent(chars) + '&display=swap');
    }

    fnFilterEl.innerHTML = `<button class="mini-pill is-active" data-st="all">Barchasi (${FONTS.length})</button>` +
      Object.entries(FONT_STYLES).map(([k, v]) => `<button class="mini-pill" data-st="${k}">${v.split(' (')[0].split(' va ')[0]}</button>`).join('') +
      `<button class="mini-pill" data-st="juft">Juftliklar (${FONT_PAIRS.length})</button>`;

    const fnItems = () => curFnFilter === 'juft' ? FONT_PAIRS
      : curFnFilter === 'all' ? FONTS : FONTS.filter(f => f.uslub === curFnFilter);

    const fnPager = makePager({
      list: $('fnList'), prev: $('fnPrev'), next: $('fnNext'), info: $('fnPage'), ...CHIP,
      render: (x, i) => {
        const f = isPair(x) ? FONT_BY_ID[x.sarlavha] : x;
        return chip(x.id, two(x.raqam), x.nom, x === selFont, i, ` style="font-family:${esc(famCss(f))}"`);
      },
      anchor: (arr) => arr.indexOf(selFont),
      onDraw: (slice) => loadNameFonts(slice.map(x => isPair(x) ? FONT_BY_ID[x.sarlavha] : x))
    });

    function selectFont(x, soft) {
      selFont = x;
      const head = isPair(x) ? FONT_BY_ID[x.sarlavha] : x;
      const body = isPair(x) ? FONT_BY_ID[x.matn] : x;
      loadCss(x.link);
      $('fnHead').style.fontFamily = famCss(head);
      $('fnHead').style.fontWeight = head.vaznlar.includes(700) ? 700 : head.vaznlar[head.vaznlar.length - 1];
      $('fnBody').style.fontFamily = famCss(body);
      $('fnLabel').textContent = isPair(x) ? head.nom + ' + ' + body.nom : x.nom;
      $('fnTitle').textContent = x.nom;
      if (isPair(x)) {
        $('fnMeta').textContent = 'Juftlik #' + two(x.raqam) + ' · ' + x.kayfiyat;
        $('fnWhere').textContent = 'Qayerda ishlatiladi: ' + x.qayerda + '.';
        $('fnTags').innerHTML = `<span class="mini-pill">Sarlavha: ${esc(head.nom)}</span><span class="mini-pill">Matn: ${esc(body.nom)}</span>`;
      } else {
        $('fnMeta').textContent = '#' + two(x.raqam) + ' · ' + x.uslub;
        $('fnWhere').textContent = x.qayerda;
        $('fnTags').innerHTML = x.vaznlar.map(w => `<span class="mini-pill">${w}</span>`).join('') +
          `<span class="mini-pill">Lotin</span>` + (x.kirill ? `<span class="mini-pill">Kirill</span>` : '');
      }
      setCode('fnCode', `<link href="${x.link}" rel="stylesheet">\n\n${x.css}`);
      fnPager.mark(x.id);
      if (soft) soften('fnMeta', 'fnTitle', 'fnWhere', 'fnTags', 'fnCode');
    }

    fnFilterEl.addEventListener('click', e => {
      const b = e.target.closest('.mini-pill');
      if (!b) return;
      curFnFilter = b.dataset.st;
      fnFilterEl.querySelectorAll('.mini-pill').forEach(p => p.classList.toggle('is-active', p === b));
      const arr = fnItems();
      $('fnCount').textContent = arr.length + (curFnFilter === 'juft' ? ' ta juftlik' : ' ta shrift');
      fnPager.set(arr);
    });
    $('fnList').addEventListener('click', e => {
      const b = e.target.closest('.item-chip');
      if (!b) return;
      const found = fnItems().find(x => x.id === b.dataset.id);
      if (found) selectFont(found, true);
    });
    $('fnCopyCode').onclick = () => copyText(`<link href="${selFont.link}" rel="stylesheet">\n\n${selFont.css}`, selFont.nom + ' ulash kodi nusxalandi ✓');
    $('fnCopyCmd').onclick = () => copyText(isPair(selFont)
      ? `/shrift ${selFont.id} — shu shrift juftligini loyihamga ula`
      : `/shrift ${selFont.id} — ${selFont.nom} shriftini loyihamga ula`, "/shrift buyrug'i nusxalandi ✓");
    fnPager.set(FONTS);
    selectFont(FONTS[0], false);

    // --- 06-bet: rang palitrasi, 100 ta premium gradient, xameleon va shaffof tugmalar ---
    (function initRang() {
      const MODE_NOM = {
        juft: '1 + 1 mos (Komplementar)',
        yumshoq: '1 + 2 mos (Yumshoq kontrast)',
        yaqin: '1 + 2 mos (Yaqin ohanglar)',
        uchlik: '1 + 2 mos (Uchlik muvozanat)'
      };
      const TUR_NOM = { linear: 'Chiziqli', radial: 'Markaziy', conic: 'Aylana' };
      const LOCK_ON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
      const LOCK_OFF = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.6-1.6"/></svg>';
      const PICK_IC = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>';

      const clNorm = (raw) => {
        const s = String(raw || '').trim().replace(/^#/, '');
        const full = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
        return /^[0-9a-fA-F]{6}$/.test(full) ? '#' + full.toLowerCase() : null;
      };
      const clRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
      const clHsl = (hex) => {
        const [r, g, b] = clRgb(hex).map(v => v / 255);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0; const l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          else if (max === g) h = ((b - r) / d + 2) * 60;
          else h = ((r - g) / d + 4) * 60;
        }
        return [Math.round(h) % 360, Math.round(s * 100), Math.round(l * 100)];
      };
      const clFromHsl = (h, s, l) => {
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
        return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
      };
      const clLum = (hex) => {
        const [r, g, b] = clRgb(hex).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const clContrast = (a, b) => {
        const l1 = clLum(a), l2 = clLum(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };
      const clInk = (hex) => clContrast(hex, '#ffffff') >= clContrast(hex, '#0f172a') ? '#ffffff' : '#0f172a';
      const clBgFor = (baseHex, isLight) => {
        const [h, s] = clHsl(baseHex);
        const neytral = s < 12;
        return {
          fon: isLight ? clFromHsl(neytral ? 220 : h, neytral ? 10 : 26, 97) : clFromHsl(neytral ? 220 : h, neytral ? 16 : 36, 7),
          matn: isLight ? '#0f172a' : '#f1f5f9'
        };
      };
      const clMatch = (baseHex, mode, shift = 0) => {
        const [h, s, l] = clHsl(baseHex);
        const neytral = s < 12;
        const bh = neytral ? (220 + shift) % 360 : (h + shift) % 360;
        const ms = neytral ? 78 : Math.max(46, Math.min(90, s));
        const ml1 = l < 28 ? 58 : l > 78 ? 44 : Math.max(44, Math.min(64, l + (l < 50 ? 10 : -8)));
        const ml2 = l < 28 ? 66 : l > 78 ? 52 : Math.max(48, Math.min(68, l + (l < 50 ? 16 : -14)));
        if (mode === 'juft') return [baseHex, clFromHsl(neytral ? bh : bh + 180, ms, ml1)];
        if (mode === 'yaqin') return [baseHex, clFromHsl(bh - 32, ms, ml1), clFromHsl(bh + 32, Math.max(42, ms - 6), ml2)];
        if (mode === 'uchlik') return [baseHex, clFromHsl(bh + 120, ms, ml1), clFromHsl(bh + 240, Math.max(42, ms - 4), ml2)];
        return [baseHex, clFromHsl(bh + 150, ms, ml1), clFromHsl(bh + 210, Math.max(42, ms - 6), ml2)];
      };
      const gradExpr = (g) => {
        const s = g.toxtashlar.map(t => `${t.rang} ${t.joy}%`).join(', ');
        if (g.tur === 'radial') return `radial-gradient(circle at ${g.x}% ${g.y}%, ${s})`;
        if (g.tur === 'conic') return `conic-gradient(from ${g.burchak}deg at ${g.x}% ${g.y}%, ${s})`;
        return `linear-gradient(${g.burchak}deg, ${s})`;
      };
      const linearBar = (stops) => `linear-gradient(90deg, ${stops.map(t => `${t.rang} ${t.joy}%`).join(', ')})`;

      // --- Umumiy tab: 'palitra' | 'gradient' ---
      let activeTab = (location.hash === '#gradient' || location.hash === '#rang-gradient') ? 'gradient' : 'palitra';

      // --- 1. PALITRALAR HOLATI ---
      let curMode = 'yumshoq';
      let curFilter = 'all';
      let selPal = PALETTES[0];
      let isCustom = false;
      let isLight = selPal.rejim === 'yorug';
      let fon = selPal.fon;
      let matn = selPal.matn;
      let cols = [...selPal.ranglar];
      let locks = [false, false, false];

      const clFilterEl = $('clFilter');
      clFilterEl.innerHTML = `<button class="mini-pill is-active" data-st="all">Barchasi (${PALETTES.length})</button>` +
        Object.entries(PALETTE_STYLES).map(([k, v]) => `<button class="mini-pill" data-st="${k}">${v.split(' va ')[0]}</button>`).join('');

      const clItems = () => curFilter === 'all' ? PALETTES : PALETTES.filter(p => p.uslub === curFilter);
      const clPager = makePager({
        list: $('clList'), prev: $('clPrev'), next: $('clNext'), info: $('clPage'),
        minW: 170, rowH: 54, gap: 8, pad: 10, noSpan: true,
        render: (p, i) => `<button class="pal-chip${!isCustom && selPal && selPal.id === p.id ? ' is-selected' : ''}" data-id="${p.id}" title="${esc(p.nom)}" style="--i:${Math.min(i, 18)}"><span class="pal-bar"><i style="background:${p.fon}"></i>${p.ranglar.map(c => `<i style="background:${c}"></i>`).join('')}</span><span class="pal-name">${esc(p.nom)}</span></button>`,
        anchor: (arr) => selPal ? arr.indexOf(selPal) : -1
      });

      function palCssText() {
        const lines = [':root {', `  --bg: ${fon};`, `  --text: ${matn};`, `  --primary: ${cols[0]};`, `  --accent: ${cols[1]};`];
        if (cols[2]) lines.push(`  --accent-2: ${cols[2]};`);
        lines.push('}', '.btn-glass {',
          `  background: ${isLight ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.12)'};`,
          '  backdrop-filter: blur(16px);',
          `  border: 1px solid ${isLight ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.28)'};`,
          '}');
        return lines.join('\n');
      }

      function renderPalitra(soft) {
        const base = cols[0];
        $('clPicker').value = base;
        $('clSwatch').style.background = base;
        if (document.activeElement !== $('clHex')) $('clHex').value = base.toUpperCase();
        $('clModes').querySelectorAll('.mini-pill').forEach(b => b.classList.toggle('is-active', b.dataset.mode === curMode));

        const rollar = cols.length === 2 ? ['Asosiy', 'Mos rang'] : ['Asosiy', 'Mos 1', 'Mos 2'];
        $('clCols').innerHTML = cols.map((hex, i) => {
          const ink = clInk(hex);
          const locked = !!locks[i];
          return `<div class="cl-col" data-i="${i}" style="background:${hex};color:${ink}" title="Bosing — ${hex.toUpperCase()} nusxalanadi">` +
            `<span class="cl-col__role">${rollar[i]}</span>` +
            `<div class="cl-col__mid"><span class="cl-col__hex">${hex.toUpperCase()}</span><span class="cl-col__hint">nusxalash</span></div>` +
            `<div class="cl-col__acts">` +
              `<button type="button" class="cl-act${locked ? ' is-locked' : ''}" data-lock="${i}" title="${locked ? 'Qulfni ochish' : 'Rangni qulflash'}" aria-label="${locked ? 'Qulfni ochish' : 'Rangni qulflash'}">${locked ? LOCK_ON : LOCK_OFF}</button>` +
              `<label class="cl-act" title="Rangni o'zgartirish" aria-label="Rangni o'zgartirish">${PICK_IC}<input type="color" data-pick="${i}" value="${hex}"></label>` +
            `</div></div>`;
        }).join('');

        // Katta Jonli ko'rinish: Palitralar
        const demo = $('clDemo');
        demo.style.background = fon;
        demo.style.color = matn;
        demo.style.borderColor = isLight ? 'rgba(15,23,42,0.14)' : 'rgba(148,163,184,0.22)';
        $('clDot').style.background = cols[0];
        $('clBgToggle').textContent = isLight ? "Yorug' fon" : "Qorong'i fon";
        $('clDemoGlow').style.background = `radial-gradient(circle at 30% 30%, ${cols[0]}, transparent 60%), radial-gradient(circle at 75% 70%, ${cols[1]}, transparent 60%)`;

        const btn = $('clDemoBtn');
        btn.style.background = cols[0];
        btn.style.color = clInk(cols[0]);

        const glass = $('clDemoGlass');
        glass.style.background = isLight ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.12)';
        glass.style.borderColor = isLight ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.34)';
        glass.style.color = matn;

        const cham = $('clDemoCham');
        const c3 = cols[2] || cols[0];
        cham.style.background = `linear-gradient(125deg, ${cols[0]}, ${cols[1]}, ${c3})`;
        cham.style.color = clInk(cols[1]);

        const cr = clContrast(fon, matn);
        $('clContrast').textContent = `${cr.toFixed(1)}:1 · ${cr >= 7 ? 'AAA ✓' : cr >= 4.5 ? 'AA ✓' : 'Past'}`;

        if (activeTab === 'palitra') {
          if (isCustom || !selPal) {
            $('clMeta').textContent = 'Moslash · ' + MODE_NOM[curMode];
            $('clTitle').textContent = base.toUpperCase() + ' uchun mos ranglar';
            $('clDesc').textContent = "1 ta asosiy rangga " + (cols.length - 1) + " ta uyg'un rang topildi. Qulflab Space bosing yoki Gradientlar bo'limiga o'ting.";
          } else {
            $('clMeta').textContent = '#' + two(selPal.raqam) + ' · ' + PALETTE_STYLES[selPal.uslub] + ' · ' + (isLight ? "Yorug'" : "Qorong'i");
            $('clTitle').textContent = selPal.nom;
            $('clDesc').textContent = 'Qayerda ishlatiladi: ' + selPal.qayerda + '.';
          }
          setCode('clCode', palCssText());
          if (soft) soften('clMeta', 'clTitle', 'clDesc', 'clCode');
        }
        clPager.mark(!isCustom && selPal ? selPal.id : '');
      }

      function applyFromBase(hex, soft, shift = 0) {
        const fresh = clMatch(hex, curMode, shift);
        cols = fresh.map((c, i) => (i > 0 && locks[i] && cols[i]) ? cols[i] : c);
        if (cols.length === 2) locks[2] = false;
        const bg = clBgFor(cols[0], isLight);
        fon = bg.fon; matn = bg.matn;
        isCustom = true;
        renderPalitra(soft);
      }

      function selectPalette(p, soft) {
        selPal = p;
        isCustom = false;
        isLight = p.rejim === 'yorug';
        fon = p.fon; matn = p.matn;
        cols = [...p.ranglar];
        locks = [false, false, false];
        curMode = 'yumshoq';
        renderPalitra(soft);
      }

      // --- 2. 100 PREMIUM GRADIENT + INTERAKTIV MUHARRIR + XAMELEON ---
      let grFilter = 'all';
      let selGr = GRADIENTS[0];
      let grCustom = false;
      let grBtnStyle = 'shisha'; // 'shisha' | 'toldirilgan' | 'xameleon'
      let grState = {
        tur: selGr.tur,
        burchak: selGr.burchak,
        x: selGr.x,
        y: selGr.y,
        tovlanish: !!selGr.tovlanish,
        toxtashlar: selGr.toxtashlar.map(t => ({ rang: t.rang, joy: t.joy }))
      };

      const grFilterEl = $('grFilter');
      grFilterEl.innerHTML = `<button class="mini-pill is-active" data-st="all">Barchasi (${GRADIENTS.length})</button>` +
        Object.entries(GRADIENT_STYLES).map(([k, v]) => `<button class="mini-pill" data-st="${k}">${v.split(' va ')[0]}</button>`).join('');

      const grItems = () => grFilter === 'all' ? GRADIENTS : GRADIENTS.filter(g => g.uslub === grFilter);
      const grPager = makePager({
        list: $('grList'), prev: $('grPrev'), next: $('grNext'), info: $('grPage'),
        minW: 170, rowH: 54, gap: 8, pad: 10, noSpan: true,
        render: (g, i) => `<button class="gr-chip${!grCustom && selGr && selGr.id === g.id ? ' is-selected' : ''}" data-id="${g.id}" title="${esc(g.nom)}" style="--i:${Math.min(i, 18)}"><span class="gr-swatch-bar${g.tovlanish ? ' is-shimmer' : ''}" style="background:${gradExpr(g)}"></span><span class="pal-name">${g.tovlanish ? '✦ ' : ''}${esc(g.nom)}</span></button>`,
        anchor: (arr) => selGr ? arr.indexOf(selGr) : -1
      });

      function gradCssText() {
        const expr = gradExpr(grState);
        const lines = [`background: ${expr};`];
        if (grState.tovlanish || grBtnStyle === 'xameleon') {
          lines.push('background-size: 220% 220%;', 'animation: neo-xameleon 6s ease-in-out infinite;');
        }
        if (grBtnStyle === 'shisha') {
          lines.push('', '.btn-glass {', '  background: rgba(255, 255, 255, 0.16);', '  backdrop-filter: blur(18px) saturate(1.5);', '  border: 1px solid rgba(255, 255, 255, 0.42);', '}');
        } else if (grBtnStyle === 'xameleon') {
          lines.push('', '@keyframes neo-xameleon {', '  0%, 100% { background-position: 0% 50%; filter: hue-rotate(0deg); }', '  50% { background-position: 100% 50%; filter: hue-rotate(48deg); }', '}');
        }
        return lines.join('\n');
      }

      function renderGradient(soft) {
        const expr = gradExpr(grState);
        const shimmer = !!grState.tovlanish || grBtnStyle === 'xameleon';
        const midHex = grState.toxtashlar[Math.min(1, grState.toxtashlar.length - 1)].rang;
        const avgLum = grState.toxtashlar.reduce((s, t) => s + clLum(t.rang), 0) / grState.toxtashlar.length;
        const ink = avgLum > 0.42 ? '#0f172a' : '#ffffff';

        // Toolbar holati
        $('grTypes').querySelectorAll('.mini-pill').forEach(b => b.classList.toggle('is-active', b.dataset.tur === grState.tur));
        $('grShimmerBtn').classList.toggle('is-active', !!grState.tovlanish);
        $('grAngleWrap').hidden = grState.tur === 'radial';
        $('grAngle').value = grState.burchak;
        $('grAngleVal').textContent = grState.burchak + '°';

        // Jonli gradient sahnasi + markaz/burchak tutqichi
        const cv = $('grCanvas');
        cv.style.background = expr;
        cv.classList.toggle('is-shimmer', !!grState.tovlanish);
        const handle = $('grHandle');
        if (grState.tur === 'linear') {
          const rad = (grState.burchak - 90) * Math.PI / 180;
          handle.style.left = (50 + Math.cos(rad) * 32) + '%';
          handle.style.top = (44 + Math.sin(rad) * 28) + '%';
          $('grHint').textContent = `Burchak: ${grState.burchak}° · surib aylantiring`;
        } else {
          handle.style.left = grState.x + '%';
          handle.style.top = grState.y + '%';
          $('grHint').textContent = `Joy: ${grState.x}% / ${grState.y}% · surib ko'chiring`;
        }

        // Rang to'xtash nuqtalari (suriladigan tugmalar)
        const track = $('grTrack');
        track.style.background = linearBar(grState.toxtashlar);
        track.innerHTML = grState.toxtashlar.map((t, i) =>
          `<div class="gr-knob" data-stop="${i}" style="left:${t.joy}%;background:${t.rang}" title="${t.rang.toUpperCase()} (${t.joy}%) — surib joyini o'zgartiring"></div>`
        ).join('');

        // Pastki rang tanlash tugmalari
        const stopsHtml = grState.toxtashlar.map((t, i) =>
          `<div class="gr-stop">` +
            `<label class="gr-stop__dot" style="background:${t.rang}" title="Rangni o'zgartirish"><input type="color" data-gpick="${i}" value="${t.rang}"></label>` +
            `<span>${t.rang.toUpperCase()}</span><span class="gr-stop__pct">${t.joy}%</span>` +
            (grState.toxtashlar.length > 2 ? `<button type="button" class="gr-stop__del" data-gdel="${i}" title="Olib tashlash" aria-label="Rangni olib tashlash">×</button>` : '') +
          `</div>`
        ).join('') + (grState.toxtashlar.length < 3 ? `<button type="button" class="mini-pill" id="grAddStop" style="padding:4px 10px;font-size:11.5px">+ Rang</button>` : '');
        $('grStops').innerHTML = stopsHtml;

        // O'ng taraf: KATTA Jonli ko'rinish (shaffof shisha + tovlanuvchi xameleon)
        const hero = $('grDemoHero');
        hero.style.background = expr;
        hero.style.color = ink;
        hero.classList.toggle('is-shimmer', shimmer);
        $('grDemoTag').textContent = grState.tovlanish ? 'Xameleon · Tovlanuvchi ✦' : `${TUR_NOM[grState.tur]} Gradient`;
        $('grBtnModes').querySelectorAll('.gr-btn-mode').forEach(b => b.classList.toggle('is-active', b.dataset.bstyle === grBtnStyle));

        const gBtn = $('grPrevGlass');
        const cBtn = $('grPrevCham');
        if (grBtnStyle === 'shisha') {
          gBtn.textContent = 'Shaffof shisha tugma →';
          gBtn.style.background = avgLum > 0.42 ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.18)';
          gBtn.style.borderColor = avgLum > 0.42 ? 'rgba(15,23,42,0.28)' : 'rgba(255,255,255,0.48)';
          gBtn.style.color = ink;
          cBtn.textContent = 'Tovlanuvchi ramka ✦';
          cBtn.style.background = 'rgba(5,10,23,0.34)';
          cBtn.style.color = '#fff';
        } else if (grBtnStyle === 'toldirilgan') {
          gBtn.textContent = 'To\'ldirilgan tugma →';
          gBtn.style.background = avgLum > 0.42 ? '#0f172a' : '#ffffff';
          gBtn.style.borderColor = 'transparent';
          gBtn.style.color = avgLum > 0.42 ? '#ffffff' : '#0f172a';
          cBtn.textContent = 'Shaffof ikkinchi';
          cBtn.style.background = 'rgba(255,255,255,0.16)';
          cBtn.style.color = ink;
        } else {
          gBtn.textContent = 'Xameleon shisha ✦';
          gBtn.style.background = 'rgba(255,255,255,0.22)';
          gBtn.style.borderColor = 'rgba(255,255,255,0.65)';
          gBtn.style.color = '#fff';
          cBtn.textContent = 'Tovlanuvchi nur →';
          cBtn.style.background = expr;
          cBtn.style.color = clInk(midHex);
        }

        if (activeTab === 'gradient') {
          const info = `${TUR_NOM[grState.tur]}${grState.tur === 'radial' ? ` (${grState.x}%, ${grState.y}%)` : ' ' + grState.burchak + '°'}${grState.tovlanish ? ' · Xameleon ✦' : ''}`;
          if (grCustom || !selGr) {
            $('clMeta').textContent = 'Moslangan gradient · ' + info;
            $('clTitle').textContent = grState.tovlanish ? 'Tovlanuvchi xameleon gradient' : 'Shaxsiy premium gradient';
            $('clDesc').textContent = "Rang nuqtalarini bosing yoki shkalada surib joyini o'zgartiring. Tovlanish tugmasi xameleon effektini yoqadi.";
          } else {
            $('clMeta').textContent = '#' + two(selGr.raqam) + ' · ' + GRADIENT_STYLES[selGr.uslub] + ' · ' + info;
            $('clTitle').textContent = selGr.nom;
            $('clDesc').textContent = 'Qayerda ishlatiladi: ' + selGr.qayerda + '.';
          }
          setCode('clCode', gradCssText());
          if (soft) soften('clMeta', 'clTitle', 'clDesc', 'clCode');
        }
        grPager.mark(!grCustom && selGr ? selGr.id : '');
      }

      function selectGradient(g, soft) {
        selGr = g;
        grCustom = false;
        grState = {
          tur: g.tur,
          burchak: g.burchak,
          x: g.x,
          y: g.y,
          tovlanish: !!g.tovlanish,
          toxtashlar: g.toxtashlar.map(t => ({ rang: t.rang, joy: t.joy }))
        };
        renderGradient(soft);
      }

      function switchTab(tab, soft) {
        activeTab = tab;
        const isGr = tab === 'gradient';
        $('rangSwitch').querySelectorAll('.mini-pill').forEach(b => {
          const on = b.dataset.tab === tab;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $('clPane').hidden = isGr;
        $('grPane').hidden = !isGr;
        $('clDemo').hidden = isGr;
        $('grDemo').hidden = !isGr;
        if (isGr) {
          grPager.refit();
          grPager.redraw();
          renderGradient(soft);
        } else {
          clPager.refit();
          clPager.redraw();
          renderPalitra(soft);
        }
      }

      // --- Canvas sudrab joy/burchak o'zgartirish ---
      let canvasDrag = false;
      function moveCanvas(e) {
        const r = $('grCanvas').getBoundingClientRect();
        const px = Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / r.width * 100)));
        const py = Math.max(0, Math.min(100, Math.round((e.clientY - r.top) / r.height * 100)));
        if (grState.tur === 'linear') {
          const deg = Math.round(Math.atan2(py - 50, px - 50) * 180 / Math.PI + 90);
          grState.burchak = ((deg % 360) + 360) % 360;
        } else {
          grState.x = px;
          grState.y = py;
        }
        grCustom = true;
        renderGradient(false);
      }
      $('grCanvas').addEventListener('pointerdown', (e) => {
        if (e.target.closest('.gr-track-wrap')) return;
        canvasDrag = true;
        $('grCanvas').setPointerCapture(e.pointerId);
        moveCanvas(e);
      });
      $('grCanvas').addEventListener('pointermove', (e) => { if (canvasDrag) moveCanvas(e); });
      $('grCanvas').addEventListener('pointerup', () => { canvasDrag = false; });
      $('grCanvas').addEventListener('pointercancel', () => { canvasDrag = false; });

      // --- Shkalada rang to'xtash nuqtalarini surish (0%..100%) ---
      let dragStop = -1;
      function moveStop(e) {
        if (dragStop < 0) return;
        const r = $('grTrack').getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / r.width * 100)));
        grState.toxtashlar[dragStop].joy = pct;
        grCustom = true;
        renderGradient(false);
      }
      $('grTrack').addEventListener('pointerdown', (e) => {
        const knob = e.target.closest('.gr-knob');
        if (!knob) return;
        e.stopPropagation();
        dragStop = Number(knob.dataset.stop);
        knob.classList.add('is-drag');
        $('grTrack').setPointerCapture(e.pointerId);
        moveStop(e);
      });
      $('grTrack').addEventListener('pointermove', moveStop);
      $('grTrack').addEventListener('pointerup', () => { dragStop = -1; });
      $('grTrack').addEventListener('pointercancel', () => { dragStop = -1; });

      // --- Tavsiya / Space ---
      let shuffleStep = 0;
      function shuffleRang() {
        shuffleStep++;
        if (activeTab === 'gradient') {
          const pool = grItems();
          const next = pool[Math.floor(Math.random() * pool.length)];
          selectGradient(next, true);
          return;
        }
        const hasLock = locks.slice(0, cols.length).some(Boolean);
        if (hasLock) {
          const base = locks[0] ? cols[0] : clFromHsl(Math.floor(Math.random() * 360), 62 + Math.floor(Math.random() * 28), 44 + Math.floor(Math.random() * 16));
          const shift = locks[0] ? ((shuffleStep * 25) % 90) - 45 : 0;
          applyFromBase(base, true, shift);
          showToast("Qulflangan rang saqlandi, qolgani yangilandi ✓");
          return;
        }
        const h = Math.floor(Math.random() * 360);
        const s = 60 + Math.floor(Math.random() * 28);
        const l = 42 + Math.floor(Math.random() * 18);
        applyFromBase(clFromHsl(h, s, l), true, 0);
      }
      window._clShuffle = shuffleRang;

      // --- Hodisalar ---
      $('rangSwitch').addEventListener('click', (e) => {
        const b = e.target.closest('[data-tab]');
        if (b && b.dataset.tab !== activeTab) switchTab(b.dataset.tab, true);
      });
      $('clPicker').addEventListener('input', (e) => applyFromBase(e.target.value, false));
      $('clHex').addEventListener('input', (e) => { const n = clNorm(e.target.value); if (n) applyFromBase(n, false); });
      $('clHex').addEventListener('blur', () => { $('clHex').value = cols[0].toUpperCase(); });
      $('clModes').addEventListener('click', (e) => {
        const b = e.target.closest('.mini-pill');
        if (!b) return;
        curMode = b.dataset.mode;
        applyFromBase(cols[0], true);
      });
      $('clCols').addEventListener('click', (e) => {
        const lockBtn = e.target.closest('[data-lock]');
        if (lockBtn) {
          e.stopPropagation();
          const idx = Number(lockBtn.dataset.lock);
          locks[idx] = !locks[idx];
          renderPalitra(false);
          return;
        }
        if (e.target.closest('label.cl-act')) return;
        const col = e.target.closest('.cl-col');
        if (col) copyText(cols[Number(col.dataset.i)].toUpperCase(), cols[Number(col.dataset.i)].toUpperCase() + ' nusxalandi ✓');
      });
      $('clCols').addEventListener('input', (e) => {
        const inp = e.target.closest('input[data-pick]');
        if (!inp) return;
        const idx = Number(inp.dataset.pick);
        if (idx === 0) applyFromBase(inp.value, false);
        else { cols[idx] = inp.value.toLowerCase(); locks[idx] = true; isCustom = true; renderPalitra(false); }
      });
      $('clRandBtn').onclick = shuffleRang;
      $('clBgToggle').onclick = () => {
        isLight = !isLight;
        const bg = clBgFor(cols[0], isLight);
        fon = bg.fon; matn = bg.matn;
        renderPalitra(false);
      };
      clFilterEl.addEventListener('click', (e) => {
        const b = e.target.closest('.mini-pill');
        if (!b) return;
        curFilter = b.dataset.st;
        clFilterEl.querySelectorAll('.mini-pill').forEach(p => p.classList.toggle('is-active', p === b));
        const arr = clItems();
        $('clCount').textContent = arr.length + ' ta palitra';
        clPager.set(arr);
      });
      $('clList').addEventListener('click', (e) => {
        const b = e.target.closest('.pal-chip');
        if (!b) return;
        const found = PALETTES.find(p => p.id === b.dataset.id);
        if (found) selectPalette(found, true);
      });

      // Gradient hodisalari
      $('grTypes').addEventListener('click', (e) => {
        const b = e.target.closest('[data-tur]');
        if (!b) return;
        grState.tur = b.dataset.tur;
        grCustom = true;
        renderGradient(true);
      });
      $('grShimmerBtn').onclick = () => {
        grState.tovlanish = !grState.tovlanish;
        grCustom = true;
        renderGradient(false);
      };
      $('grAngle').addEventListener('input', (e) => {
        grState.burchak = Number(e.target.value);
        grCustom = true;
        renderGradient(false);
      });
      $('grFlip').onclick = () => {
        grState.toxtashlar = grState.toxtashlar.slice().reverse().map(t => ({ rang: t.rang, joy: 100 - t.joy }));
        grCustom = true;
        renderGradient(false);
      };
      $('grStops').addEventListener('input', (e) => {
        const inp = e.target.closest('input[data-gpick]');
        if (!inp) return;
        grState.toxtashlar[Number(inp.dataset.gpick)].rang = inp.value.toLowerCase();
        grCustom = true;
        renderGradient(false);
      });
      $('grStops').addEventListener('click', (e) => {
        const del = e.target.closest('[data-gdel]');
        if (del && grState.toxtashlar.length > 2) {
          grState.toxtashlar.splice(Number(del.dataset.gdel), 1);
          grCustom = true;
          renderGradient(false);
          return;
        }
        if (e.target.id === 'grAddStop' && grState.toxtashlar.length < 3) {
          const [h, s, l] = clHsl(grState.toxtashlar[0].rang);
          const mid = clFromHsl((h + 48) % 360, Math.max(55, s), Math.max(46, Math.min(64, l)));
          grState.toxtashlar.splice(1, 0, { rang: mid, joy: 50 });
          grCustom = true;
          renderGradient(false);
        }
      });
      $('grBtnModes').addEventListener('click', (e) => {
        const b = e.target.closest('[data-bstyle]');
        if (!b) return;
        grBtnStyle = b.dataset.bstyle;
        renderGradient(false);
      });
      grFilterEl.addEventListener('click', (e) => {
        const b = e.target.closest('.mini-pill');
        if (!b) return;
        grFilter = b.dataset.st;
        grFilterEl.querySelectorAll('.mini-pill').forEach(p => p.classList.toggle('is-active', p === b));
        const arr = grItems();
        $('grCount').textContent = arr.length + ' ta gradient';
        grPager.set(arr);
      });
      $('grList').addEventListener('click', (e) => {
        const b = e.target.closest('.gr-chip');
        if (!b) return;
        const found = GRADIENTS.find(g => g.id === b.dataset.id);
        if (found) selectGradient(found, true);
      });

      $('clCopyCss').onclick = () => copyText(activeTab === 'gradient' ? gradCssText() : palCssText(),
        activeTab === 'gradient' ? 'CSS gradient va tugma kodi nusxalandi ✓' : 'CSS palitra va shaffof tugma kodi nusxalandi ✓');
      $('clCopyCmd').onclick = () => copyText(
        activeTab === 'gradient'
          ? (grCustom ? `/rang gradient — ${gradExpr(grState)}${grState.tovlanish ? ' (xameleon tovlanish)' : ''} va shaffof tugmalarni loyihamga ula`
            : `/rang gradient ${selGr.id} — "${selGr.nom}" gradientini va shaffof tugmalarni loyihamga ula`)
          : (isCustom ? `/rang ${cols[0].toUpperCase()} — shu asosiy rangga mos (${cols.map(c => c.toUpperCase()).join(', ')}) palitrani loyihamga ula`
            : `/rang ${selPal.id} — "${selPal.nom}" rang palitrasini loyihamga ula`),
        "/rang buyrug'i nusxalandi ✓"
      );

      window._rangTab = (tab) => switchTab(tab, false);
      clPager.set(PALETTES);
      grPager.set(GRADIENTS);
      selectPalette(PALETTES[0], false);
      selectGradient(GRADIENTS[0], false);
      switchTab(activeTab, false);
    })();

    // --- 07-bet: 50 ta Hero maket (Supahero ilhomli) va sahifa karkasi ---
    (function initMaket() {
      const SPLIT_SCHEMAS = new Set([
        'split-dashboard', 'split-code', 'showreel-split', 'index-list', 'fintech-card',
        'split-bars', 'split-calc', 'split-booking', 'lookbook-split', 'drop-countdown',
        'phone-split', 'telegram-bot', 'qr-split', 'course-split', 'diagonal-cut', 'deck-stack'
      ]);
      let maketTab = location.hash === '#karkas' ? 'karkas' : 'hero';
      let isMobile = false;
      let hmFilter = 'all';
      let selHero = HERO_LAYOUTS[0];

      const hmFilterEl = $('hmFilter');
      hmFilterEl.innerHTML = `<button class="mini-pill is-active" data-st="all">Barchasi (${HERO_LAYOUTS.length})</button>` +
        Object.entries(HERO_STYLES).map(([k, v]) => `<button class="mini-pill" data-st="${k}">${v.split(' va ')[0]}</button>`).join('');

      const hmItems = () => hmFilter === 'all' ? HERO_LAYOUTS : HERO_LAYOUTS.filter(h => h.uslub === hmFilter);

      const hmPager = makePager({
        list: $('hmList'), prev: $('hmPrev'), next: $('hmNext'), info: $('hmPage'),
        minW: 192, rowH: 40, gap: 8, pad: 10, noSpan: true,
        render: (h, i) => {
          const bCol = h.tema.btnInk || (h.tema.light ? '#ffffff' : '#04122e');
          const bBg = `linear-gradient(135deg, ${h.tema.accent}, ${h.tema.accent2})`;
          const cat = HERO_STYLES[h.uslub].split(' va ')[0];
          return `<button class="hm-chip${selHero && selHero.id === h.id ? ' is-selected' : ''}" data-id="${h.id}" title="#${two(h.raqam)} ${esc(h.nom)}" style="--i:${Math.min(i, 18)}"><span class="hm-badge" style="background:${bBg};color:${bCol}">${two(h.raqam)}</span><span class="hm-chip__text"><b>${esc(h.nom)}</b><small>${esc(cat)}</small></span></button>`;
        },
        anchor: (arr) => selHero ? arr.indexOf(selHero) : -1
      });

      function btn1Html(h) {
        const t = h.tema;
        const cls = t.btn === 'glass' ? 'hm-b1 is-glass' : t.btn === 'cham' ? 'hm-b1 is-cham' : 'hm-b1';
        const bg = t.btn === 'cham'
          ? `linear-gradient(125deg,${t.accent},${t.accent2},${t.accent})`
          : t.accent;
        const col = t.btnInk || (t.light ? '#ffffff' : '#04122e');
        const brut = h.sxema === 'brutalist-grid' ? ' hm-brut-box' : '';
        return `<span class="${cls}${brut}" style="background:${bg};color:${col}">${esc(h.tugma1)}</span>`;
      }
      function btnsHtml(h) {
        return `<div class="hm-acts">${btn1Html(h)}${h.tugma2 ? `<span class="hm-b2" style="color:${h.tema.ink}">${esc(h.tugma2)}</span>` : ''}</div>`;
      }
      function navHtml(h) {
        return `<div class="hm-nav" style="color:${h.tema.ink}"><span>${esc(h.id.split('-')[0].toUpperCase())}</span><div class="hm-nav__links"><span>Mahsulot</span><span>Narx</span><span>Aloqa</span></div></div>`;
      }

      function renderHeroVisual(h) {
        const t = h.tema, s = h.sxema;
        const serif = ['moda-lookbook', 'hashamat-soat', 'jurnal-muqova', 'qahva-brend', 'kursor-kollaj'].includes(h.id) ? ' hm-h1--serif' : '';
        const h1 = `<div class="hm-h1${s === 'giant-type' ? ' hm-h1--xl' : ''}${serif}">${esc(h.sarlavha)}</div>`;
        const sub = `<div class="hm-sub" style="color:${t.muted}">${esc(h.matn)}</div>`;
        const splitWrap = (rightHtml) =>
          `${navHtml(h)}<div class="hm-split"><div class="hm-split__copy">${h1}${sub}${btnsHtml(h)}</div><div>${rightHtml}</div></div>`;

        if (s === 'center-browser') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}${btnsHtml(h)}` +
            `<div class="hm-win" style="background:${t.card}"><div class="hm-win__side"><i style="background:${t.accent}"></i><i></i><i></i><i></i></div>` +
            `<div class="hm-win__main"><div class="hm-win__tile"><small>Faol mijozlar</small><b style="color:${t.accent}">+148%</b></div>` +
            `<div class="hm-win__tile"><small>Oylik daromad</small><b style="color:${t.accent2}">$84.2K</b></div></div></div></div>`;
        }
        if (s === 'ai-prompt') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}` +
            `<div class="hm-bar" style="background:${t.card}"><span>"Qahvaxona uchun zamonaviy sayt yasa..."</span>${btn1Html(h)}</div>` +
            `<div class="hm-chips"><i>SaaS</i><i>Do'kon</i><i>Portfolio</i><i>Telegram bot</i></div></div>`;
        }
        if (s === 'split-dashboard') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};color:${t.ink}"><div style="display:flex;justify-content:space-between;font-size:8px;font-weight:800"><span>Konversiya</span><span style="color:${t.accent}">+42.8%</span></div>` +
            `<div class="hm-bars"><i style="height:35%;background:${t.accent};opacity:.35"></i><i style="height:52%;background:${t.accent};opacity:.55"></i><i style="height:68%;background:${t.accent};opacity:.75"></i><i style="height:95%;background:linear-gradient(180deg,${t.accent},${t.accent2})"></i></div></div>`);
        }
        if (s === 'bento-grid') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-bento"><div style="background:${t.card}"><small>Tezlik</small><b style="color:${t.accent}">0.4s</b></div>` +
            `<div style="background:${t.card}"><small>AI tahlil</small><b style="color:${t.accent2}">99.8%</b></div>` +
            `<div style="background:${t.card}"><small>Foydalanuvchi</small><b>120K+</b></div></div></div>`;
        }
        if (s === 'cmd-palette') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}` +
            `<div class="hm-cmd" style="background:${t.card}"><div class="hm-cmd__row" style="border:1px solid ${t.accent}"><span>Qidirish yoki buyruq...</span><kbd>⌘K</kbd></div>` +
            `<div class="hm-cmd__row"><span>Yangi loyiha ochish</span><kbd>↵</kbd></div><div class="hm-cmd__row"><span>Jamoaga ulash</span><kbd>⌘S</kbd></div></div></div>`;
        }
        if (s === 'split-code') {
          return splitWrap(`<div class="hm-code"><div>$ npx create-neo-api</div><div><b>✓</b> PostgreSQL ulandi</div><div><b>✓</b> Auth + JWT tayyor</div><div><b>→</b> https://api.loyiha.uz</div></div>`);
        }
        if (s === 'aurora-glass' || s === 'chameleon-prism') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}${btnsHtml(h)}` +
            `<div class="hm-box" style="background:${t.card};margin-top:4px;font-size:8.5px;display:flex;justify-content:space-between"><span>✦ Prazrachniy shisha panel</span><span style="opacity:.8">60 FPS</span></div></div>`;
        }
        if (s === 'video-card') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-vid" style="background:linear-gradient(135deg,${t.accent},${t.accent2})"><div class="hm-play">▶</div></div></div>`;
        }
        if (s === 'workflow-nodes') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}${btnsHtml(h)}` +
            `<div class="hm-flow"><span class="hm-node" style="background:${t.card};border-color:${t.accent}">Kirish</span><span class="hm-line" style="background:${t.accent}"></span>` +
            `<span class="hm-node" style="background:${t.card};border-color:${t.accent2}">AI Agent</span><span class="hm-line" style="background:${t.accent2}"></span>` +
            `<span class="hm-node" style="background:${t.card}">Natija ✓</span></div></div>`;
        }
        if (s === 'waitlist-glow') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}` +
            `<div class="hm-bar" style="background:${t.card}"><span>email@manzilingiz.uz</span>${btn1Html(h)}</div>` +
            `<div style="font-size:8px;opacity:.75">2,480 kishi navbatda · Yopiq Beta</div></div>`;
        }
        if (s === 'giant-type') {
          return `${navHtml(h)}<div class="hm-in" style="max-width:100%">${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'showreel-split') {
          return splitWrap(`<div class="hm-vid" style="height:108px;background:linear-gradient(135deg,${t.card},${t.accent})"><div class="hm-play">▶</div></div>`);
        }
        if (s === 'fan-cards') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-fan"><div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff">01 · Fintech</div>` +
            `<div style="background:linear-gradient(135deg,#111827,#334155);color:#fff">02 · AI App</div>` +
            `<div style="background:linear-gradient(135deg,#f43f5e,#fb923c);color:#fff">03 · Do'kon</div></div></div>`;
        }
        if (s === 'creator-bio') {
          return `${navHtml(h)}<div class="hm-in">` +
            `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);border:2px solid #fff;position:relative"><i style="position:absolute;right:0;bottom:0;width:9px;height:9px;border-radius:50%;background:#16a34a;border:2px solid #fff"></i></div>` +
            `${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'brutalist-grid') {
          return `${navHtml(h)}<div class="hm-in"><div class="hm-box hm-brut-box" style="background:#fff;padding:12px">${h1}${sub}${btnsHtml(h)}</div></div>`;
        }
        if (s === 'corner-collage') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}${btnsHtml(h)}` +
            `<div class="hm-chips"><i style="background:${t.accent};color:#fff">Art 01</i><i style="background:${t.accent2};color:#051022">Film 02</i><i>Foto 03</i><i>3D 04</i></div></div>`;
        }
        if (s === 'index-list') {
          return splitWrap(`<div class="hm-feed"><div class="hm-feed__item" style="background:${t.card}"><span>01 · UzPay Rebrand</span><b>↗</b></div>` +
            `<div class="hm-feed__item" style="background:${t.card}"><span>02 · Qadam AI</span><b>↗</b></div><div class="hm-feed__item" style="background:${t.card}"><span>03 · Nur Arxitektura</span><b>↗</b></div></div>`);
        }
        if (s === 'fintech-card') {
          return splitWrap(`<div class="hm-card3d" style="background:linear-gradient(135deg,#064e3b,#10b981 55%,#042f2e)"><div style="display:flex;justify-content:space-between;font-size:8px;font-weight:800"><span>NEO BANK</span><span>PLATINUM</span></div><div class="hm-card3d__num">4820 •••• •••• 9026</div><div style="font-size:10px;font-weight:900">$48,920.00</div></div>`);
        }
        if (s === 'split-bars') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};color:${t.ink}"><div style="display:flex;justify-content:space-between;font-size:8.5px;font-weight:800"><span>Sof foyda</span><span style="color:${t.accent}">+38.4%</span></div>` +
            `<div class="hm-bars"><i style="height:28%;background:${t.accent};opacity:.35"></i><i style="height:46%;background:${t.accent};opacity:.55"></i><i style="height:64%;background:${t.accent};opacity:.75"></i><i style="height:82%;background:${t.accent}"></i><i style="height:100%;background:${t.accent2}"></i></div></div>`);
        }
        if (s === 'split-calc') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};color:#0f172a;text-align:left;font-size:8.5px"><div style="opacity:.6">Yuborasiz</div><div style="font-size:13px;font-weight:900;margin-bottom:5px">1,000 USD</div>` +
            `<div style="opacity:.6">Qabul qiladi (0% komissiya)</div><div style="font-size:13px;font-weight:900;color:#059669">12,850,000 UZS</div></div>`);
        }
        if (s === 'metrics-band') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}${btnsHtml(h)}` +
            `<div class="hm-bento"><div style="background:${t.card};text-align:center"><b style="color:${t.accent}">99.99%</b><small>Uptime</small></div>` +
            `<div style="background:${t.card};text-align:center"><b style="color:${t.accent2}">140+</b><small>Davlat</small></div>` +
            `<div style="background:${t.card};text-align:center"><b>$4.2B</b><small>Aylanma</small></div></div></div>`;
        }
        if (s === 'crypto-wallet') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-box" style="background:${t.card};max-width:260px;display:flex;justify-content:space-between;align-items:center"><div style="text-align:left"><div style="font-size:7.5px;opacity:.7">Jami balans</div><div style="font-size:13px;font-weight:900">$24,610.50</div></div><span style="color:${t.accent2};font-size:10px;font-weight:800">+14.2% ↑</span></div></div>`;
        }
        if (s === 'split-booking') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};color:${t.ink};font-size:8px;text-align:left"><div style="font-weight:800;margin-bottom:6px">15 daqiqa · Qulay vaqt</div>` +
            `<div class="hm-chips" style="justify-content:flex-start"><i style="background:${t.accent2};color:#fff">10:00</i><i>11:30</i><i>14:00</i><i>16:30</i></div></div>`);
        }
        if (s === 'feed-stack') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-feed" style="max-width:290px"><div class="hm-feed__item" style="background:${t.card}"><span>Stripe tushumi</span><b style="color:${t.accent2}">+$3,450</b></div>` +
            `<div class="hm-feed__item" style="background:${t.card}"><span>Cloud server</span><span>-$120</span></div></div></div>`;
        }
        if (s === 'product-stage') {
          return `${navHtml(h)}<div class="hm-in">${h1}${sub}${btnsHtml(h)}` +
            `<div style="width:140px;height:44px;border-radius:999px;background:linear-gradient(135deg,${t.accent},${t.accent2});box-shadow:0 14px 30px rgba(56,225,255,.35);margin-top:4px"></div></div>`;
        }
        if (s === 'lookbook-split') {
          return splitWrap(`<div style="height:126px;border-radius:11px;background:linear-gradient(160deg,#d6c5b3,#8c6d53);display:flex;align-items:flex-end;justify-content:space-between;padding:8px;color:#fff;font-size:8.5px;font-weight:800"><span>PALTO 01</span><span>$290</span></div>`);
        }
        if (s === 'gadget-callouts') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-chips"><i style="border:1px solid ${t.accent}">48 soat</i><i>Titanium</i><i>120Hz</i><i>5G</i></div></div>`;
        }
        if (s === 'shop-trio') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-bento"><div style="background:${t.card}"><small>Kreslo</small><b>$189</b></div>` +
            `<div style="background:${t.card}"><small>Chiroq</small><b>$74</b></div>` +
            `<div style="background:${t.card}"><small>Stol</small><b>$320</b></div></div></div>`;
        }
        if (s === 'artisan-review') {
          return `${navHtml(h)}<div class="hm-in"><div style="font-size:8.5px;font-weight:800;color:${t.accent2}">★★★★★ 4.9 · 1,240 sharh</div>${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'drop-countdown') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};text-align:center"><div style="font-size:8px;opacity:.8;margin-bottom:6px">TUGASHIGA QOLDI</div><div class="hm-count"><span>02K</span><span>14S</span><span>38D</span></div></div>`);
        }
        if (s === 'luxury-frame') {
          return `<div class="hm-lux-border"></div>${navHtml(h)}<div class="hm-in"><div style="font-size:8px;letter-spacing:.18em;color:${t.accent}">LIMITED · 250</div>${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'phone-center') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-phone" style="background:${t.card};height:78px"><div class="hm-phone__notch"></div><div class="hm-phone__row"><b style="color:${t.accent}">87%</b><span>Kunlik maqsad</span></div></div></div>`;
        }
        if (s === 'phone-trio') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-fan"><div style="height:56px;background:${t.card};color:${t.ink}">Dars 1</div><div style="height:68px;background:linear-gradient(135deg,${t.accent},${t.accent2});color:#fff">Jonli mashq</div><div style="height:56px;background:${t.card};color:${t.ink}">Reyting</div></div></div>`;
        }
        if (s === 'phone-split') {
          return splitWrap(`<div class="hm-phone" style="background:${t.card}"><div class="hm-phone__notch"></div><div class="hm-phone__row"><b style="color:${t.accent}">15 daq</b><span>Kuryer yo'lda</span></div><div class="hm-phone__row"><span>Buyurtma #408</span></div></div>`);
        }
        if (s === 'telegram-bot') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};text-align:left;font-size:8px;display:flex;flex-direction:column;gap:5px">` +
            `<div style="background:rgba(56,189,248,.16);padding:5px 7px;border-radius:8px">Assalomu alaykum! Buyurtmani tanlang:</div>` +
            `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px"><span style="text-align:center;padding:4px;border-radius:6px;background:${t.accent};color:#04182b;font-weight:800">Katalog</span><span style="text-align:center;padding:4px;border-radius:6px;background:rgba(255,255,255,.12)">Savat (2)</span></div></div>`);
        }
        if (s === 'qr-split') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};text-align:center"><div class="hm-qr"><i></i><i></i><i class="w"></i><i></i><i></i><i class="w"></i><i></i><i></i><i class="w"></i><i></i><i></i><i class="w"></i><i></i><i></i><i class="w"></i><i></i></div><div style="font-size:7.5px;margin-top:4px;font-weight:700">Kamera bilan skanerlang</div></div>`);
        }
        if (s === 'notif-cascade') {
          return `${navHtml(h)}<div class="hm-in">${h1}${btnsHtml(h)}` +
            `<div class="hm-feed" style="max-width:290px"><div class="hm-feed__item" style="background:${t.card}"><span>✦ Yangi to'lov qabul qilindi</span><small>Hozir</small></div>` +
            `<div class="hm-feed__item" style="background:${t.card};opacity:.78"><span>Jamoa uchrashuvi 15:00 da</span><small>5 daq</small></div></div></div>`;
        }
        if (s === 'swiss-grid') {
          return `<div class="hm-swiss-bg"></div>${navHtml(h)}<div class="hm-in" style="align-items:flex-start;text-align:left"><span style="width:18px;height:18px;background:${t.accent};display:block"></span>${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'magazine-cover') {
          return `${navHtml(h)}<div class="hm-in"><div style="width:100%;border-top:2px solid ${t.ink};border-bottom:1px solid ${t.ink};padding:2px 0;font-size:8px;letter-spacing:.2em;font-weight:800">HIWORLD JOURNAL · SON 14</div>${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'mono-manifesto') {
          return `${navHtml(h)}<div class="hm-in" style="gap:10px">${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'course-split') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};color:${t.ink}"><div class="hm-vid" style="height:72px;background:linear-gradient(135deg,${t.accent},${t.accent2})"><div class="hm-play">▶</div></div><div style="font-size:8px;font-weight:700;margin-top:5px">1,800+ bitiruvchi · 8 hafta</div></div>`);
        }
        if (s === 'event-summit') {
          return `${navHtml(h)}<div class="hm-in"><div style="font-size:8.5px;font-weight:800;color:${t.accent}">15-OKTABR · TOSHKENT</div>${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'docs-search') {
          return `${navHtml(h)}<div class="hm-in">${h1}<div class="hm-bar" style="background:${t.card}"><span>Hujjatlardan qidirish (⌘K)...</span>${btn1Html(h)}</div>` +
            `<div class="hm-bento"><div style="background:${t.card};min-height:42px"><small>Tezkor start</small></div><div style="background:${t.card};min-height:42px"><small>API</small></div><div style="background:${t.card};min-height:42px"><small>Misollar</small></div></div></div>`;
        }
        if (s === 'vision-glass') {
          return `${navHtml(h)}<div class="hm-in"><div class="hm-box" style="background:${t.card};padding:14px 16px;border-radius:16px">${h1}${sub}${btnsHtml(h)}</div></div>`;
        }
        if (s === 'cyber-horizon') {
          return `<div class="hm-cyber-grid"></div>${navHtml(h)}<div class="hm-in">${h1}${sub}${btnsHtml(h)}</div>`;
        }
        if (s === 'orbit-3d') {
          return `${navHtml(h)}<div class="hm-in"><div class="hm-orbit" style="background:radial-gradient(circle at 30% 30%,${t.accent},${t.accent2} 55%,#030712)"></div>${h1}${btnsHtml(h)}</div>`;
        }
        if (s === 'diagonal-cut') {
          return splitWrap(`<div class="hm-box" style="background:${t.card};text-align:center"><div style="font-size:18px;font-weight:900">0 → 100</div><div style="font-size:8px;opacity:.85">Maksimal tezlik va natija</div></div>`);
        }
        if (s === 'deck-stack') {
          return splitWrap(`<div class="hm-fan"><div style="background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff">01</div><div style="background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#fff">02</div><div style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff">03</div></div>`);
        }
        return `${navHtml(h)}<div class="hm-in">${h1}${sub}${btnsHtml(h)}</div>`;
      }

      function syncModal(h) {
        if ($('hmModal').hidden) return;
        const mcv = $('hmModalCanvas');
        mcv.style.background = h.tema.bg;
        mcv.style.color = h.tema.ink;
        mcv.classList.toggle('is-shimmer', !!h.tema.shimmer);
        mcv.innerHTML = renderHeroVisual(h);
        $('hmModalUrl').textContent = h.id + '.uz';
        $('hmModalTitle').textContent = '#' + two(h.raqam) + ' · ' + h.nom + ' (' + HERO_STYLES[h.uslub] + ')';
      }

      function renderHero(h, soft) {
        selHero = h;
        const cv = $('hmCanvas');
        cv.style.background = h.tema.bg;
        cv.style.color = h.tema.ink;
        cv.classList.toggle('is-shimmer', !!h.tema.shimmer);
        cv.innerHTML = renderHeroVisual(h);
        $('hmUrl').textContent = h.id + '.uz';
        hmPager.mark(h.id);
        syncModal(h);
        if (maketTab === 'hero') {
          $('hmMeta').textContent = '#' + two(h.raqam) + ' · ' + HERO_STYLES[h.uslub] + ' · Birinchi bet';
          $('hmTitle').textContent = h.nom;
          $('hmDesc').textContent = 'Qayerda ishlatiladi: ' + h.qayerda + '.';
          $('hmTags').innerHTML = h.tarkib.map(t => `<span class="mini-pill">${esc(t)}</span>`).join('');
          setCode('maketCodeBox', h.html);
          $('copyMaketBtn').textContent = 'Hero kodini nusxalash';
          $('copyMaketCmd').textContent = "/sahifa buyrug'i";
          if (soft) soften('hmMeta', 'hmTitle', 'hmDesc', 'hmTags', 'maketCodeBox');
        }
      }

      function switchMaketTab(tab, soft) {
        maketTab = tab;
        const isKarkas = tab === 'karkas';
        $('maketSwitch').querySelectorAll('[data-tab]').forEach(b => {
          const on = b.dataset.tab === tab;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $('hmPane').hidden = isKarkas;
        $('karkasPane').hidden = !isKarkas;
        if (isKarkas) {
          $('hmMeta').textContent = 'Yagona standart · 7 ta oltin qoida';
          $('hmTitle').textContent = "Bitta bet — bitta bo'lim";
          $('hmDesc').innerHTML = "Har bir bo'lim o'z manziliga ega <strong>alohida bet</strong> va hammasi <strong>bir xil o'lchamda</strong>. Matn markazda, harakatlar yumshoq, skroll yo'q.";
          $('hmTags').innerHTML = '<span class="mini-pill">100vw × 100vh PC</span><span class="mini-pill">100svh Telefon</span><span class="mini-pill">Skrollsiz</span>';
          setCode('maketCodeBox', MAKET_CODE);
          $('copyMaketBtn').textContent = 'Sahifa karkasini nusxalash';
          $('copyMaketCmd').textContent = "/sayt buyrug'i";
          if (soft) soften('hmMeta', 'hmTitle', 'hmDesc', 'hmTags', 'maketCodeBox');
        } else {
          hmPager.refit();
          hmPager.redraw();
          renderHero(selHero, soft);
        }
      }
      window._maketTab = (tab) => switchMaketTab(tab, false);

      function setDevice(mobile) {
        isMobile = mobile;
        $('hmViewport').classList.toggle('is-mobile', mobile);
        $('hmModalVp').classList.toggle('is-mobile', mobile);
        $('simViewport').classList.toggle('is-mobile', mobile);
        $('simMobBtn').classList.toggle('is-active', mobile);
        $('simPcBtn').classList.toggle('is-active', !mobile);
        $('hmModMob').classList.toggle('is-active', mobile);
        $('hmModPc').classList.toggle('is-active', !mobile);
      }

      function openHeroModal() {
        $('hmModal').hidden = false;
        syncModal(selHero);
      }
      function closeHeroModal() { $('hmModal').hidden = true; }
      $('hmExpandBtn').onclick = openHeroModal;
      $('hmModClose').onclick = closeHeroModal;
      $('hmModal').addEventListener('click', (e) => { if (e.target === $('hmModal')) closeHeroModal(); });
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('hmModal').hidden) closeHeroModal(); });
      $('hmModPc').onclick = () => setDevice(false);
      $('hmModMob').onclick = () => setDevice(true);
      $('hmModPrev').onclick = () => {
        const arr = hmItems();
        const idx = arr.indexOf(selHero);
        renderHero(arr[(idx - 1 + arr.length) % arr.length], true);
      };
      $('hmModNext').onclick = () => {
        const arr = hmItems();
        const idx = arr.indexOf(selHero);
        renderHero(arr[(idx + 1) % arr.length], true);
      };
      $('hmModCopy').onclick = () => copyText(selHero.html, `#${two(selHero.raqam)} ${selHero.nom} Hero kodi nusxalandi ✓`);

      $('maketSwitch').addEventListener('click', (e) => {
        const b = e.target.closest('[data-tab]');
        if (b && b.dataset.tab !== maketTab) switchMaketTab(b.dataset.tab, true);
      });
      hmFilterEl.addEventListener('click', (e) => {
        const b = e.target.closest('.mini-pill');
        if (!b) return;
        hmFilter = b.dataset.st;
        hmFilterEl.querySelectorAll('.mini-pill').forEach(p => p.classList.toggle('is-active', p === b));
        const arr = hmItems();
        $('hmCount').textContent = arr.length + ' ta Hero maket';
        hmPager.set(arr);
      });
      $('hmList').addEventListener('click', (e) => {
        const b = e.target.closest('.hm-chip');
        if (!b) return;
        const found = HERO_LAYOUTS.find(x => x.id === b.dataset.id);
        if (found) renderHero(found, true);
      });
      $('simPcBtn').onclick = () => setDevice(false);
      $('simMobBtn').onclick = () => setDevice(true);
      $('copyMaketBtn').onclick = () => copyText(
        maketTab === 'karkas' ? MAKET_CODE : selHero.html,
        maketTab === 'karkas' ? 'Standart sahifa karkasi nusxalandi ✓' : `#${two(selHero.raqam)} ${selHero.nom} Hero kodi nusxalandi ✓`
      );
      $('copyMaketCmd').onclick = () => copyText(
        maketTab === 'karkas'
          ? "/sayt — loyiham uchun sayt qurib ber, shrift, ikonka, animatsiya va effektlarni o'zing tanla"
          : `/sahifa hero ${selHero.id} — "${selHero.nom}" birinchi bet maketini loyihamga qo'lla`,
        maketTab === 'karkas' ? "/sayt buyrug'i nusxalandi ✓" : "/sahifa buyrug'i nusxalandi ✓"
      );

      hmPager.set(HERO_LAYOUTS);
      renderHero(HERO_LAYOUTS[0], false);
      switchMaketTab(maketTab, false);
    })();

    // --- 08-bet: Har bir betda avtomatik Audit -> Uslub tanlash -> Kodda tuzatish ---
    (function initAudit() {
      const CASES = [
        {
          id: 'saas',
          nom: 'SaaS Panel',
          eskiNom: 'Binafsha-neonli shovqinli panel',
          yangiNom: "Qat'iy minimalist qorong'i interfeys",
          eskiBg: 'linear-gradient(135deg, #2e0249 0%, #570a57 48%, #a91079 100%)',
          yangiBg: '#090d16',
          yangiLight: false,
          yangiInk: '#f8fafc',
          yangiCard: '#111827',
          yangiAccent: '#38e1ff',
          yangiAccentInk: '#04122e',
          palitra: ['#090d16', '#111827', '#f8fafc', '#38e1ff'],
          shrift: 'Inter + Plus Jakarta Sans',
          kpis: [['Oylik tushum', '$84,200'], ['Faol jamoa', '1,420'], ['Konversiya', '+38.4%']],
          muammolar: [
            ['Haddan tashqari neon effekt', 'Binafsha-pushti nur va 5 ta qalin soya asosiy raqamlarni yopib qo\'ygan'],
            ['Yomon o\'qiluvchanlik (2.1:1)', 'Xira siyohrang matn va 4 xil shrift ko\'zni tez charchatadi'],
            ['Chalg\'ituvchi elementlar', '4 ta rangli yorliq va 3 ta bir xil tugma ichida asosiy harakat yo\'qolgan']
          ],
          uslub: [
            ['Yangi palitra: Minimalist Qorong\'i', 'Fon #090D16, karta #111827, faqat 1 ta tiniq #38E1FF urg\'u'],
            ['Shrift juftligi: Inter + Plus Jakarta', 'Raqamlar aniq va yirik, qator oralig\'i 1.55, kontrast 17.8:1 (AAA)'],
            ['Effekt me\'yori: 4 ta neon o\'chirildi', 'Faqat nozik 1px chegaralar va bitta yumshoq kirish harakati']
          ],
          tuzatish: [
            ['Masofalar tekislandi (8px ritm)', 'Barcha kartalar teng padding: 16px, aniq 3 ustunli setka'],
            ['Rang va kontrast tuzatildi', 'Yagona :root tokenlar, WCAG AAA 17.8:1 o\'qiluvchanlik'],
            ['Asosiy CTA ajratib ko\'rsatildi', 'Chalg\'ituvchi yorliqlar olib tashlandi, 1 ta aniq tugma qoldi']
          ],
          diff: `/* OLDIN: binafsha-neon shovqin, 2.1:1 kontrast */\n/* KEYIN: qat'iy minimalist qorong'i interfeys */\n:root {\n  --bg: #090d16;\n  --card: #111827;\n  --text: #f8fafc;\n  --accent: #38e1ff;\n}\n.panel { gap: 16px; border: 1px solid rgba(148,163,184,.16); }`
        },
        {
          id: 'fintech',
          nom: 'Fintech Ilova',
          eskiNom: 'Kamalak rangli tartibsiz hamyon',
          yangiNom: "Ishonchli zumrad-qorong'i bank UI",
          eskiBg: 'linear-gradient(120deg, #4c1d95 0%, #db2777 50%, #f59e0b 100%)',
          yangiBg: '#061314',
          yangiLight: false,
          yangiInk: '#f0fdf4',
          yangiCard: '#0c2022',
          yangiAccent: '#10b981',
          yangiAccentInk: '#03150e',
          palitra: ['#061314', '#0c2022', '#f0fdf4', '#10b981'],
          shrift: 'Plus Jakarta Sans + JetBrains Mono',
          kpis: [['Balans', '$48,920'], ['Keshbek', '+5.0%'], ['Komissiya', '0%']],
          muammolar: [
            ['Ishonchni buzuvchi kamalak fon', 'Moliyaviy ilovada haddan ortiq rang jiddiylikni yo\'qotadi'],
            ['Raqamlar yomon o\'qiladi', 'Balans va valyuta bir xil o\'lchamda, mono shrift yo\'q'],
            ['3 ta bir xil tugma raqobati', 'O\'tkazish, to\'ldirish va reklama tugmasi birdek baqiradi']
          ],
          uslub: [
            ['Yangi palitra: Zumrad Fintech', 'Chuqur #061314 fon va ishonchli #10B981 bank aksenti'],
            ['Shrift: Jakarta + JetBrains Mono', 'Barcha pul raqamlari aniq tekis (tabular-nums) ko\'rinadi'],
            ['Sokin harakat rejimi', 'Keskin sakrashlar olib tashlanib, yumshoq kirish qoldirildi']
          ],
          tuzatish: [
            ['Balans iyerarxiyasi tiklandi', 'Asosiy summa va 3 ta KPI kartasi tekis qatorga qo\'yildi'],
            ['Kontrast 16.4:1 ga ko\'tarildi', 'Tungi rejimda ko\'zni charchatmaydigan toza matn'],
            ['Yagona "O\'tkazma" CTA ajratildi', 'Ikkinchi darajali tugmalar sokin ko\'rinishga o\'tkazildi']
          ],
          diff: `/* KEYIN: ishonchli zumrad-qorong'i fintech tizimi */\n:root {\n  --bg: #061314;\n  --card: #0c2022;\n  --accent: #10b981;\n}\n.amount { font-variant-numeric: tabular-nums; font-weight: 800; }`
        },
        {
          id: 'dokon',
          nom: "Onlayn Do'kon",
          eskiNom: "Miltillovchi chegirma to'la sahifa",
          yangiNom: 'Sof tahririy premium vitrina',
          eskiBg: 'linear-gradient(135deg, #991b1b 0%, #dc2626 52%, #ca8a04 100%)',
          yangiBg: '#faf8f5',
          yangiLight: true,
          yangiInk: '#1c1917',
          yangiCard: '#ffffff',
          yangiAccent: '#1c1917',
          yangiAccentInk: '#ffffff',
          palitra: ['#faf8f5', '#ffffff', '#1c1917', '#b45309'],
          shrift: 'Playfair Display + DM Sans',
          kpis: [['Mahsulot', 'Palto 01'], ['Narx', '$290'], ['Yetkazish', 'Bepul']],
          muammolar: [
            ['Qizil-sariq bosimli bannerlar', 'Xaridor mahsulotni emas, shovqinli chegirma qutilarini ko\'radi'],
            ['Siqilgan kartalar va mayda narx', 'Kartalar orasida bo\'sh joy yo\'q, matn 11px gacha kichraygan'],
            ['5 ta yorliq e\'tiborni bo\'ladi', 'HIT, AKSIYA, NEW, TOP kabi «tabletka»lar ishonchni pasaytiradi']
          ],
          uslub: [
            ['Yangi palitra: Krem Tahririy', 'Iliq #FAF8F5 fon, sof oq kartalar va chuqur #1C1917 matn'],
            ['Shrift: Playfair + DM Sans', 'Premium brend ohangi va oson o\'qiladigan narx bloki'],
            ['Nafas oluvchi 24px masofalar', 'Har bir mahsulot alohida e\'tibor markazida turadi']
          ],
          tuzatish: [
            ['Barcha ortiqcha yorliqlar o\'chirildi', 'Sahifa to\'g\'ridan-to\'g\'ri mahsulot va aniq sarlavhadan boshlanadi'],
            ['Masofa va o\'lchamlar tekislandi', 'Kartalar teng balandlikda, narx va tugma aniq ko\'rinadi'],
            ['Bitta "Savatga qo\'shish" tugmasi', 'Konversiyani oshiruvchi yuqori kontrastli asosiy harakat']
          ],
          diff: `/* KEYIN: tahririy toza do'kon vitrinasi */\n:root {\n  --bg: #faf8f5;\n  --card: #ffffff;\n  --text: #1c1917;\n  --accent: #1c1917;\n}`
        },
        {
          id: 'ai',
          nom: 'AI Startap',
          eskiNom: 'Standart binafsha AI shablon',
          yangiNom: 'Aniq shaffof shisha AI ish maydoni',
          eskiBg: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 52%, #be185d 100%)',
          yangiBg: 'radial-gradient(circle at 50% 0%, #1e3a8a 0%, #050a17 65%)',
          yangiLight: false,
          yangiInk: '#f8fafc',
          yangiCard: 'rgba(255,255,255,0.06)',
          yangiAccent: '#38e1ff',
          yangiAccentInk: '#04122e',
          palitra: ['#050a17', '#0f172a', '#f8fafc', '#38e1ff'],
          shrift: 'Space Grotesk + Inter',
          kpis: [['Tezlik', '0.4s'], ['Aniqlik', '99.4%'], ['Model', 'v4 Pro']],
          muammolar: [
            ['Hamma AI saytlarga o\'xshash qolip', 'Binafsha gradient va ✨ pill-badge foydalanuvchini zeriktiradi'],
            ['Matn fon bilan qorishib ketgan', 'Yarim-shaffof matn yorqin fon ustida yaxshi o\'qilmaydi'],
            ['Asosiy amal (prompt) ko\'rinmaydi', 'Bezak elementlar mahsulotning o\'zidan ustun bo\'lib qolgan']
          ],
          uslub: [
            ['Yangi palitra: Chuqur Kosmik Ko\'k', 'Qorong\'i #050A17 asos, nozik shaffof shisha kartalar'],
            ['Shrift: Space Grotesk + Inter', 'Texnologik, aniq va darhol o\'qiladigan tipografiya'],
            ['Shaffof shisha + bitta urg\'u', 'Faqat asosiy boshlash tugmasi yorqin, qolgani sokin']
          ],
          tuzatish: [
            ['Sun\'iy ✨ yorliqlar olib tashlandi', 'Kuchli sarlavha va aniq foyda birinchi ko\'zga tashlanadi'],
            ['Shisha qatlamlar kontrasti sozlandi', 'backdrop-filter: blur(18px) + aniq 1px chegara'],
            ['Asosiy harakat markazga chiqarildi', 'Foydalanuvchi 2 soniyada nimani bosishini tushunadi']
          ],
          diff: `/* KEYIN: toza shisha AI interfeys */\n:root { --bg: #050a17; --accent: #38e1ff; }\n.glass-card {\n  background: rgba(255,255,255,.06);\n  backdrop-filter: blur(18px);\n  border: 1px solid rgba(255,255,255,.16);\n}`
        }
      ];

      let curCase = 0;
      let curStep = 0; // 0: Audit, 1: Uslub, 2: Tuzatildi
      let playTimer = null;

      const prodEl = $('auProducts');
      prodEl.innerHTML = CASES.map((c, i) => `<button type="button" class="mini-pill${i === 0 ? ' is-active' : ''}" data-ci="${i}">${esc(c.nom)}</button>`).join('');

      function renderAudit(soft) {
        const c = CASES[curCase];
        $('auSwitch').querySelectorAll('[data-step]').forEach(b => {
          const on = Number(b.dataset.step) === curStep;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        prodEl.querySelectorAll('[data-ci]').forEach(b => b.classList.toggle('is-active', Number(b.dataset.ci) === curCase));
        $('auStepInfo').textContent = (curStep + 1) + ' / 3';
        $('auPrev').disabled = curStep === 0;
        $('auNext').disabled = curStep === 2;

        const board = $('auBoard');
        board.className = 'au-board ' + (curStep === 0 ? 'is-messy' : curStep === 1 ? 'is-plan' : 'is-clean');

        if (curStep === 0) {
          board.style.background = c.eskiBg;
          board.style.color = '#f5d0fe';
          board.innerHTML =
            `<div class="au-board__top"><span>OLDIN · ${esc(c.eskiNom)}</span><span class="au-score is-bad">34 / 100 · Muammo bor</span></div>` +
            `<div class="au-pins"><span class="au-pin">! Ortiqcha neon effekt</span><span class="au-pin">! Kontrast 2.1:1</span><span class="au-pin">! Chalg'ituvchi yorliqlar</span></div>` +
            `<div><div class="au-mock-head" style="text-shadow:0 0 18px #f0abfc;font-family:Georgia,serif">${esc(c.nom)} · Boshqaruv</div>` +
            `<div class="au-mock-sub" style="opacity:.48">4 xil shrift · notekis masofalar · shovqinli fon</div></div>` +
            `<div class="au-kpis">${c.kpis.map(([k, v]) => `<div class="au-kpi" style="border:2px dashed #f0abfc;background:rgba(217,70,239,.22)"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>` +
            `<div class="au-acts"><span class="au-cta" style="background:#f43f5e;color:#fff">Tugma 1</span><span class="au-cta" style="background:#eab308;color:#000">Tugma 2</span><span class="au-cta" style="background:#a855f7;color:#fff">Tugma 3</span></div>`;
        } else if (curStep === 1) {
          board.style.background = '';
          board.style.color = '#f1f5f9';
          board.innerHTML =
            `<div class="au-board__top"><span>USLUB REJASI · ${esc(c.nom)}</span><span class="au-score is-mid">78 / 100 · Uslub tanlandi</span></div>` +
            `<div><div class="au-mock-head">${esc(c.yangiNom)}</div><div class="au-mock-sub">Shrift: ${esc(c.shrift)} · 8px ritm · 1 ta urg'u</div></div>` +
            `<div class="au-swatches">${c.palitra.map(hex => `<i style="background:${hex}" title="${hex}"></i>`).join('')}</div>` +
            `<div class="au-kpis">` +
              `<div class="au-kpi"><small>Effektlar</small><b style="color:#38e1ff">Faqat 1 ta</b></div>` +
              `<div class="au-kpi"><small>Kontrast</small><b style="color:#34d399">AAA 16+</b></div>` +
              `<div class="au-kpi"><small>Asosiy CTA</small><b>1 ta aniq</b></div>` +
            `</div>`;
        } else {
          board.style.background = c.yangiBg;
          board.style.color = c.yangiInk;
          const subBorder = c.yangiLight ? 'rgba(15,23,42,.12)' : 'rgba(148,163,184,.18)';
          board.innerHTML =
            `<div class="au-board__top"><span>KEYIN · ${esc(c.yangiNom)}</span><span class="au-score is-good">98 / 100 · AAA ✓</span></div>` +
            `<div><div class="au-mock-head">${esc(c.nom)} — aniq va tartibli</div><div class="au-mock-sub">Masofalar tekis, matn tiniq o'qiladi, chalg'ituvchi unsurlar yo'q</div></div>` +
            `<div class="au-kpis">${c.kpis.map(([k, v]) => `<div class="au-kpi" style="background:${c.yangiCard};border-color:${subBorder}"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>` +
            `<div class="au-acts"><span class="au-cta" style="background:${c.yangiAccent};color:${c.yangiAccentInk}">Asosiy harakat →</span>` +
            `<span class="au-cta" style="background:transparent;border:1px solid ${subBorder};color:${c.yangiInk}">Batafsil</span></div>`;
        }

        // 4 qadamli kod tuzatish holati
        const steps = ['Masofalar', 'Ranglar', 'Shriftlar', 'Asosiy CTA'];
        $('auChecksBar').innerHTML = steps.map((st, idx) => {
          const cls = curStep === 2 ? 'is-done' : curStep === 1 && idx < 2 ? 'is-done' : 'is-warn';
          const ic = cls === 'is-done' ? '✓ ' : '! ';
          return `<div class="au-check-item ${cls}">${ic}${st}</div>`;
        }).join('');

        // O'ng taraf: bosqich izohi va 3 ta aniq band
        const metaTxt = curStep === 0 ? `1-bosqich · Audit (${c.nom})`
          : curStep === 1 ? `2-bosqich · Mahsulotga mos uslub (${c.nom})`
            : `3-bosqich · Kodda qadamma-qadam tuzatildi (${c.nom})`;
        const titleTxt = curStep === 0 ? 'Muammolarni avtomatik topadi'
          : curStep === 1 ? c.yangiNom
            : 'Tartibli, o\'qilishi oson natija';
        const descTxt = curStep === 0
          ? "Har bir betda ortiqcha effekt, past kontrast va e'tiborni chalg'ituvchi unsurlarni bir zumda aniqlaydi."
          : curStep === 1
            ? "Mahsulot turiga qarab shovqinli bezaklarni olib tashlaydi va aniq palitra, shrift hamda ritmni tanlaydi."
            : "Kodda masofalarni tekislaydi, rang va shriftni to'g'rilaydi, asosiy harakat tugmasini aniq ajratib ko'rsatadi.";
        const list = curStep === 0 ? c.muammolar : curStep === 1 ? c.uslub : c.tuzatish;
        const fCls = curStep === 0 ? 'is-bad' : curStep === 1 ? 'is-mid' : 'is-good';
        const fIc = curStep === 0 ? '!' : curStep === 1 ? '→' : '✓';

        $('auMeta').textContent = metaTxt;
        $('auTitle').textContent = titleTxt;
        $('auDesc').textContent = descTxt;
        $('auFindings').innerHTML = list.map(([b, s]) => `<div class="au-finding ${fCls}"><i>${fIc}</i><div><b>${esc(b)}</b><span>${esc(s)}</span></div></div>`).join('');
        setCode('auCode', c.diff);
        if (soft) soften('auMeta', 'auTitle', 'auDesc', 'auFindings', 'auCode');
      }

      function stopAuto() {
        if (playTimer) { clearInterval(playTimer); playTimer = null; $('auPlayBtn').textContent = 'Avto ▶'; }
      }
      $('auSwitch').addEventListener('click', (e) => {
        const b = e.target.closest('[data-step]');
        if (!b) return;
        stopAuto();
        curStep = Number(b.dataset.step);
        renderAudit(true);
      });
      prodEl.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ci]');
        if (!b) return;
        stopAuto();
        curCase = Number(b.dataset.ci);
        curStep = 0;
        renderAudit(true);
      });
      $('auPrev').onclick = () => { stopAuto(); if (curStep > 0) { curStep--; renderAudit(true); } };
      $('auNext').onclick = () => { stopAuto(); if (curStep < 2) { curStep++; renderAudit(true); } };
      $('auPlayBtn').onclick = () => {
        if (playTimer) { stopAuto(); return; }
        curStep = 0;
        renderAudit(true);
        $('auPlayBtn').textContent = 'To\'xtat ■';
        playTimer = setInterval(() => {
          curStep = (curStep + 1) % 3;
          renderAudit(true);
          if (curStep === 2) stopAuto();
        }, 1800);
      };
      $('auCopyCmd').onclick = () => copyText(
        "/audit — loyihamdagi har bir betda avtomatik audit o'tkaz (ortiqcha effekt, yomon o'qiluvchanlik, chalg'ituvchi unsurlar), mahsulotga mos uslub tanla va kodda qadamma-qadam tuzat",
        "/audit buyrug'i nusxalandi ✓"
      );
      $('auCopyCli').onclick = () => copyText('node skills/effekt/scripts/katalog.js audit .', 'Audit CLI buyrug\'i nusxalandi ✓');
      renderAudit(false);
    })();
    if ($('copyHidesignBtn')) {
      $('copyHidesignBtn').onclick = () => copyText(
        '/hidesign — hiworld plagini hujjatlari (PRD.md) va saytimdan ma\'lumot olib, 8 bosqichda etapma-etap professional dizayn, har betga rasm va yakuniy Audit qilib ber',
        '/hidesign buyrug\'i nusxalandi ✓'
      );
    }

    // --- 07-bet: plaginni o'rnatish (bitta buyruq, bitta tugma) ---
    // Brend belgilari: Simple Icons (CC0). Belgilar o'z egalarining tovar belgilari.
    const BRAND = (d, color) => `<svg width="26" height="26" viewBox="0 0 24 24" fill="${color}" aria-hidden="true"><path d="${d}"/></svg>`;
    const INSTALL = [
      {
        tab: 'Claude Code', kim: 'Anthropic', label: 'Terminal · Claude Code', title: "Claude Code'ga o'rnatish",
        ikon: BRAND('m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z', '#d97757'),
        desc: "Tugmani bosing, buyruqni terminalga joylang va Enter bosing: katalog qo'shiladi va plagin o'rnatiladi. Keyin yangi sessiyada <code>/</code> bosib <code>hi-neo:sayt</code> ni tanlang.",
        cmds: ['claude plugin marketplace add sodirovone/hi-neo', 'claude plugin install hi-neo@hi-neo'],
        out: "Tayyor: / bosing, hi-neo:sayt va boshqa skillar chiqadi", sina: '/sayt restoran uchun sayt yasa'
      },
      {
        tab: 'Antigravity', kim: 'Google Gemini', label: 'Terminal · Gemini Antigravity', title: "Gemini Antigravity'ga o'rnatish",
        ikon: BRAND('M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81', '#5b9bff'),
        desc: "Tugmani bosing, buyruqni terminalga joylang va Enter bosing: Antigravity plaginni GitHub'dan o'zi moslab oladi. Tekshirish: <code>agy plugin list</code>.",
        cmds: ['agy plugin install https://github.com/sodirovone/hi-neo'],
        out: "Tayyor: agy plugin list  →  hi-neo (enabled, 1.1.0)", sina: '/hidesign'
      },
      {
        tab: 'Codex', kim: 'OpenAI ChatGPT', label: 'Terminal · ChatGPT Codex', title: "ChatGPT Codex'ga o'rnatish",
        ikon: BRAND('M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z', 'currentColor'),
        desc: "Tugmani bosing, buyruqni terminalga joylang va Enter bosing: katalog qo'shiladi va plagin o'rnatiladi. Keyin yangi sessiyada <code>$</code> yozib <code>sayt</code> skillini tanlang.",
        cmds: ['codex plugin marketplace add sodirovone/hi-neo', 'codex plugin add hi-neo@hi-neo'],
        out: "Tayyor: codex plugin list  →  hi-neo@hi-neo (installed, enabled)", sina: '$sayt restoran uchun sayt yasa'
      }
    ];
    // Bir nechta buyruq bitta qatorga yig'iladi: «;» PowerShell, bash va zsh da birdek ishlaydi
    const oneLine = (x) => x.cmds.join('; ');
    let selIn = 0;
    $('inTabs').innerHTML = INSTALL.map((x, i) => `<button type="button" class="tool-btn${i === 0 ? ' is-active' : ''}" data-i="${i}" role="tab" aria-selected="${i === 0}">${x.ikon}<b>${x.tab}</b><small>${x.kim}</small></button>`).join('');
    function renderInstall(soft) {
      const x = INSTALL[selIn];
      $('inLabel').textContent = x.label;
      $('inTitle').textContent = x.title;
      $('inDesc').innerHTML = x.desc + ' Manba: <a href="https://github.com/sodirovone/hi-neo" target="_blank" rel="noopener">github.com/sodirovone/hi-neo</a>';
      $('inHint').textContent = 'Bosing — nusxalanadi';
      $('inTerm').innerHTML = `<div class="term-brand">${x.ikon}<span>${x.tab}</span></div>` +
        x.cmds.map(cmd => `<div class="term-line"><i>$</i><span>${esc(cmd)}</span></div>`).join('') +
        `<div class="term-line is-ok"><i>✓</i><span>${esc(x.out)}</span></div>` +
        `<div class="term-line is-out"><i>&gt;</i><span>${esc(x.sina)}<b class="term-caret"></b></span></div>`;
      setCode('inCode', oneLine(x));
      $('inTabs').querySelectorAll('.tool-btn').forEach((p, i) => {
        p.classList.toggle('is-active', i === selIn);
        p.setAttribute('aria-selected', i === selIn ? 'true' : 'false');
      });
      if (soft) soften('inTitle', 'inDesc', 'inCode', 'inTerm');
    }
    $('inTabs').addEventListener('click', (e) => {
      const b = e.target.closest('.tool-btn');
      if (!b || Number(b.dataset.i) === selIn) return;
      selIn = Number(b.dataset.i);
      renderInstall(true);
    });
    const copyInstall = () => copyText(oneLine(INSTALL[selIn]), INSTALL[selIn].tab + " uchun buyruq nusxalandi ✓");
    $('inCopy').onclick = copyInstall;
    $('inTerm').onclick = copyInstall;
    renderInstall(false);

    // Hammasi tayyor bo'lgach manzildagi bet va ichki tab ochiladi
    showSec(hashSec());
    syncSubHash();
