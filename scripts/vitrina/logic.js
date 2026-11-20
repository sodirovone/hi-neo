
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
    function makePager({ list, prev, next, info, minW, rowH, gap, pad, render, anchor, onDraw }) {
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
        if (rest && list.lastElementChild) list.lastElementChild.style.gridColumn = 'span ' + (g.cols - rest + 1);
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
    const hashSec = () => Math.max(0, sections.findIndex((s) => '#' + s.id === location.hash));
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
    window.addEventListener('popstate', () => showSec(hashSec()));
    window.addEventListener('hashchange', () => showSec(hashSec()));

    $('navTabs').addEventListener('click', (e) => {
      const b = e.target.closest('.nav-tab');
      if (b) goSec(Number(b.dataset.idx));
    });

    // Bet ichida skroll yo'q, shuning uchun kompyuterda g'ildirak betni almashtiradi
    let wheelLock = false;
    window.addEventListener('wheel', (e) => {
      if (!isPc() || e.ctrlKey) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        if (wheelLock) return;
        wheelLock = true;
        goSec(curSec + (e.deltaY > 0 ? 1 : -1));
        setTimeout(() => { wheelLock = false; }, 700);
      }
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goSec(curSec + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goSec(curSec - 1); }
    });

    // Telefonda betlar barmoq bilan chapga-o'ngga surib almashadi
    let touch0 = null;
    window.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touch0 = e.target.closest('canvas, input, select') ? null : { x: t.clientX, y: t.clientY };
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

    // --- 06-bet: sahifa standarti simulyatori ---
    setCode('maketCodeBox', MAKET_CODE);
    $('copyMaketBtn').onclick = () => copyText(MAKET_CODE, 'Standart sahifa karkasi nusxalandi ✓');
    $('copyMaketCmd').onclick = () => copyText("/sayt — loyiham uchun sayt qurib ber, shrift, ikonka, animatsiya va effektlarni o'zing tanla", "/sayt buyrug'i nusxalandi ✓");

    const simVp = $('simViewport');
    function simMode(mobile) {
      simVp.classList.toggle('is-mobile', mobile);
      $('simMobBtn').classList.toggle('is-active', mobile);
      $('simPcBtn').classList.toggle('is-active', !mobile);
    }
    $('simPcBtn').onclick = () => simMode(false);
    $('simMobBtn').onclick = () => simMode(true);

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
        out: "Tayyor: agy plugin list  →  hi-neo (enabled, 1.0.0)", sina: '/sayt restoran uchun sayt yasa'
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

    // Hammasi tayyor bo'lgach manzildagi bet ochiladi
    showSec(hashSec());
