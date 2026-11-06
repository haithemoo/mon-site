// CFP Academy — petits comportements d'interface
document.addEventListener('DOMContentLoaded', () => {
  // Les messages flash disparaissent après 6 secondes
  // Sur la page du code SMS, le message reste affiché (il peut contenir le code en mode test)
  if (!document.querySelector('.verify-card')) document.querySelectorAll('.flash').forEach((el) => {
    setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 6000);
  });
  // Feuille de présence : « Tous présents » / « Tout effacer »
  document.querySelectorAll('[data-all]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.all;
      btn.closest('form').querySelectorAll('input[type=radio][value="' + value + '"]').forEach((r) => { r.checked = true; });
    });
  });
  // Fermer le menu latéral mobile en cliquant à l'extérieur
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !e.target.closest('.app-mobilebar')) sidebar.classList.remove('open');
    });
  }
});

// Catalogue : filtrage des sections sans rechargement (marche aussi sur l'aperçu statique)
(function () {
  const chips = document.getElementById('chips');
  if (!chips) return;
  const sections = document.querySelectorAll('[data-section]');
  function apply(key) {
    sections.forEach((s) => { s.hidden = !!key && s.dataset.section !== key; });
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', (c.dataset.filter || '') === (key || '')));
  }
  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    e.preventDefault();
    apply(chip.dataset.filter);
    try { history.replaceState(null, '', chip.dataset.filter ? '#' + chip.dataset.filter : location.pathname); } catch (err) {}
  });
  const hash = location.hash.slice(1);
  if (hash && document.querySelector('[data-section="' + hash + '"]')) apply(hash);
})();

// Menus mobiles (site public et espaces) avec état aria-expanded
(function () {
  [['.nav-toggle', 'nav'], ['.side-toggle', 'sidebar']].forEach(([sel, id]) => {
    const btn = document.querySelector(sel), panel = document.getElementById(id);
    if (!btn || !panel) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
  });
})();

// Compte à rebours sur « Renvoyer le code »
(function () {
  document.querySelectorAll('button[data-wait]').forEach((btn) => {
    let left = parseInt(btn.dataset.wait, 10) || 0;
    if (left <= 0) return;
    const label = btn.textContent.replace(/\s*\(\d+ s\)$/, '');
    const tick = setInterval(() => {
      left -= 1;
      if (left <= 0) { clearInterval(tick); btn.disabled = false; btn.textContent = label; }
      else btn.textContent = label + ' (' + left + ' s)';
    }, 1000);
  });
})();

// Vérification WhatsApp : la page se met à jour dès que le message est reçu
(function () {
  const card = document.querySelector('.verify-card[data-status-url]');
  if (!card || !document.querySelector('.wa-wait')) return;
  let tries = 0;
  const timer = setInterval(async () => {
    tries += 1;
    if (tries > 400) { clearInterval(timer); return; }  // ~20 minutes
    try {
      const r = await fetch(card.dataset.statusUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (r.ok && (await r.json()).verified) { clearInterval(timer); location.href = card.dataset.okUrl; }
    } catch (e) { /* réseau momentanément indisponible : on réessaie */ }
  }, 3000);
})();

// Règlement intérieur : langue, recherche, sommaire actif
(function () {
  if (!document.querySelector('.reg-i18n')) return;
  const q = document.getElementById('reg-q');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ًͯ-ْ]/g, '');
  function clearMarks(root) { root.querySelectorAll('mark.reg-hit').forEach((m) => m.replaceWith(document.createTextNode(m.textContent))); root.normalize(); }
  function mark(el, term) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      const i = norm(n.textContent).indexOf(term);
      if (i < 0 || n.parentNode.closest('mark')) return;
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + term.length);
      const m = document.createElement('mark'); m.className = 'reg-hit'; r.surroundContents(m);
    });
  }
  function search() {
    const active = document.querySelector('.reg-lang-block:not([hidden])');
    if (!active) return;
    const term = norm((q && q.value || '').trim());
    const status = active.querySelector('.reg-status');
    clearMarks(active);
    let hits = 0;
    active.querySelectorAll('.reg-card').forEach((card) => {
      let cardHit = false;
      card.querySelectorAll('.reg-art').forEach((art) => {
        const ok = !term || norm(art.textContent).includes(term);
        art.classList.toggle('no-hit', !ok);
        if (ok && term) { hits += 1; mark(art, term); }
        cardHit = cardHit || ok;
      });
      if (!card.querySelector('.reg-art')) cardHit = !term || norm(card.textContent).includes(term);
      card.classList.toggle('no-hit', !cardHit);
    });
    active.querySelectorAll('.reg-part-title').forEach((t) => t.classList.toggle('no-hit', !!term));
    active.querySelector('.reg-essentials').hidden = !!term;
    if (status) {
      status.hidden = !term;
      const ar = active.dataset.lang === 'ar';
      status.textContent = hits ? hits + ' ' + (ar ? 'فصل يحتوي على هذه الكلمة' : 'article(s) trouvé(s)') : (ar ? 'لا يوجد فصل يحتوي على هذه الكلمة.' : 'Aucun article ne contient ce mot.');
    }
  }
  if (q) { let t; q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(search, 150); }); }

  // Sommaire : met en évidence le titre en cours de lecture
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const link = document.querySelector('.reg-toc a[href="#' + en.target.id + '"]');
        if (!link) return;
        link.closest('.reg-toc').querySelectorAll('a.is-current').forEach((a) => a.classList.remove('is-current'));
        link.classList.add('is-current');
      });
    }, { rootMargin: '-120px 0px -60% 0px' });
    document.querySelectorAll('.reg-card[id]').forEach((c) => obs.observe(c));
  }
})();

// Mode sombre de l'administration (préférence mémorisée sur cet appareil)
document.querySelectorAll(".theme-toggle").forEach((btn) => {
  const root = document.documentElement;
  const sync = () => btn.setAttribute("aria-pressed", root.dataset.theme === "dark" ? "true" : "false");
  sync();
  btn.addEventListener("click", () => {
    if (root.dataset.theme === "dark") delete root.dataset.theme; else root.dataset.theme = "dark";
    try { localStorage.setItem("cfp-theme", root.dataset.theme || "light"); } catch (e) { /* stockage indisponible */ }
    sync();
  });
});

// Recherche instantanée dans le catalogue des formations
(() => {
  const input = document.getElementById("course-q");
  if (!input) return;
  const none = document.getElementById("course-none");
  const chips = document.getElementById("chips");
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ًͯ-ْ]/g, "");
  input.addEventListener("input", () => {
    const q = norm(input.value.trim());
    let shown = 0;
    document.querySelectorAll(".course-section").forEach((sec) => {
      let n = 0;
      sec.querySelectorAll(".course-row").forEach((row) => {
        const ok = !q || norm(row.textContent).includes(q);
        row.hidden = !ok;
        if (ok) n += 1;
      });
      if (q) sec.hidden = n === 0;
      shown += n;
    });
    if (q && chips) chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", !c.dataset.filter));
    if (!q) document.querySelectorAll(".course-section").forEach((sec) => { sec.hidden = false; });
    if (none) none.hidden = shown > 0;
  });
})();
