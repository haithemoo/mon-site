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

// Catalogue : vue d'ensemble des sections, les formations d'une section s'affichent quand on la choisit
// (onglet ou carte), sans rechargement — marche aussi sur l'aperçu statique.
(function () {
  const chips = document.getElementById('chips');
  if (!chips) return;
  const sections = document.querySelectorAll('[data-section]');
  const overview = document.getElementById('cat-overview');
  const active = chips.querySelector('.chip.active');
  let current = active ? (active.dataset.filter || '') : '';
  function apply(key) {
    current = key || '';
    if (overview) overview.hidden = !!current;
    sections.forEach((s) => { s.hidden = s.dataset.section !== current; });
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', (c.dataset.filter || '') === current));
  }
  function open(key, scroll) {
    apply(key);
    try { history.replaceState(null, '', key ? '#' + key : location.pathname); } catch (err) {}
    if (scroll) window.scrollTo({ top: chips.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });  // sous l'en-tête fixe
  }
  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    e.preventDefault();
    open(chip.dataset.filter, false);
  });
  if (overview) overview.addEventListener('click', (e) => {
    const card = e.target.closest('[data-open]');
    if (!card) return;
    e.preventDefault();
    open(card.dataset.open, true);
  });
  window.cfpCatalogue = { restore: () => apply(current) };
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
    const overview = document.getElementById("cat-overview");
    if (q) {
      if (overview) overview.hidden = true;  // la recherche parcourt toutes les sections
      if (chips) chips.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    } else if (window.cfpCatalogue) {
      window.cfpCatalogue.restore();
    }
    if (none) none.hidden = !q || shown > 0;
  });
})();

// ---- Listes réordonnables (glisser-déposer + boutons ↑ ↓) : menus, FAQ, catégories, sections de l'accueil
document.querySelectorAll("[data-sortable]").forEach((list) => {
  const items = () => [...list.children].filter((li) => li.dataset.id);
  const sync = () => {
    const input = document.getElementById(list.dataset.target);
    if (!input) return;
    if (list.classList.contains("sub")) {   // sous-liste : on renvoie l'ordre de toutes les listes du même formulaire
      const all = [...document.querySelectorAll(`[data-target="${list.dataset.target}"]`)];
      input.value = all.flatMap((l) => [...l.children].filter((li) => li.dataset.id).map((li) => li.dataset.id)).join(",");
    } else {
      input.value = items().map((li) => li.dataset.id).join(",");
    }
    if (list.dataset.autosubmit) document.getElementById(list.dataset.autosubmit)?.submit();
  };
  let dragged = null;
  list.addEventListener("dragstart", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li || li.parentElement !== list) return;
    dragged = li; li.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", li.dataset.id); } catch (err) { /* ignoré */ }
    e.stopPropagation();
  });
  list.addEventListener("dragover", (e) => {
    if (!dragged) return;
    e.preventDefault();
    const over = e.target.closest("li[data-id]");
    if (!over || over === dragged || over.parentElement !== list) return;
    const r = over.getBoundingClientRect();
    list.insertBefore(dragged, e.clientY > r.top + r.height / 2 ? over.nextSibling : over);
  });
  list.addEventListener("dragend", () => { if (!dragged) return; dragged.classList.remove("dragging"); dragged = null; sync(); });
  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-move]");
    if (!btn) return;
    const li = btn.closest("li"), dir = Number(btn.dataset.move);
    const sib = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
    if (!sib) return;
    list.insertBefore(li, dir < 0 ? sib : sib.nextSibling);
    sync();
  });
});

// ---- Pipeline commercial : glisser une carte vers une autre colonne
(() => {
  const board = document.querySelector(".kanban");
  if (!board) return;
  const csrf = board.dataset.csrf;
  let card = null;
  board.addEventListener("dragstart", (e) => { card = e.target.closest(".kcard"); if (card) card.classList.add("dragging"); });
  board.addEventListener("dragend", () => { if (card) card.classList.remove("dragging"); card = null; board.querySelectorAll(".over").forEach((z) => z.classList.remove("over")); });
  board.querySelectorAll("[data-drop]").forEach((zone) => {
    zone.addEventListener("dragover", (e) => { if (card) { e.preventDefault(); zone.classList.add("over"); } });
    zone.addEventListener("dragleave", () => zone.classList.remove("over"));
    zone.addEventListener("drop", async (e) => {
      e.preventDefault(); zone.classList.remove("over");
      if (!card || card.parentElement === zone) return;
      const moving = card, from = card.parentElement;
      zone.querySelector(".kempty")?.remove();
      zone.prepend(moving);
      const body = new URLSearchParams({ _csrf: csrf, status: zone.dataset.drop });
      try {
        const r = await fetch(moving.dataset.url, { method: "POST", body, headers: { "X-Requested-With": "fetch" } });
        const data = await r.json();
        if (data.redirect) { location.href = data.redirect; return; }
        if (!data.ok) throw new Error();
        board.querySelectorAll(".kcol").forEach((col) => { col.querySelector(".kcount").textContent = col.querySelectorAll(".kcard").length; });
      } catch (err) { from.prepend(moving); alert("Le changement n'a pas pu être enregistré."); }
    });
  });
})();

// ---- Choix d'image : aperçu immédiat
document.querySelectorAll("select[data-picker]").forEach((sel) => {
  sel.addEventListener("change", () => {
    const thumb = document.querySelector(`[data-thumb="${sel.id}"]`);
    if (!thumb) return;
    const src = sel.selectedOptions[0]?.dataset.src;
    thumb.innerHTML = src ? `<img src="${src}" alt="">` : "";
  });
});

// ---- Dates rapides (Demain, Dans 3 j…)
document.querySelectorAll("[data-days][data-for]").forEach((b) => b.addEventListener("click", () => {
  const d = new Date(); d.setDate(d.getDate() + Number(b.dataset.days));
  const input = document.getElementById(b.dataset.for);
  if (input) input.value = d.toISOString().slice(0, 10);
}));

// ---- Zone d'import de la médiathèque
document.querySelectorAll(".dropzone").forEach((zone) => {
  const input = zone.querySelector("input[type=file]");
  ["dragenter", "dragover"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, () => zone.classList.remove("over")));
  zone.addEventListener("drop", (e) => { e.preventDefault(); if (input && e.dataTransfer.files.length) input.files = e.dataTransfer.files; });
});

// ---- Comportements déclaratifs (aucun script dans les pages : politique de sécurité stricte)
document.addEventListener("submit", (e) => {
  const form = e.target;
  const msg = (e.submitter && e.submitter.dataset.confirm) || form.dataset.confirm;
  if (msg && !window.confirm(msg)) e.preventDefault();
}, true);
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.matches && el.matches("[data-autosubmit]") && el.form) el.form.requestSubmit ? el.form.requestSubmit() : el.form.submit();
});
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!t.closest) return;
  if (t.closest("[data-print]")) { window.print(); return; }
  if (t.closest("[data-dismiss]")) { t.closest("[data-dismiss]").parentElement.remove(); return; }
  if (t.matches("[data-select]")) { t.select(); return; }
  const row = t.closest("[data-href]");
  if (row && !t.closest("a, button, input, select, textarea, label, form")) location.href = row.dataset.href;
});

// ---- Certificat : la feuille A4 s'adapte à la largeur de l'écran (téléphone, tablette)
(() => {
  const sheet = document.querySelector(".sheet");
  if (!sheet) return;
  const fit = () => {
    sheet.style.transform = "";
    sheet.style.marginLeft = sheet.style.marginBottom = "";
    const k = Math.min(1, (document.documentElement.clientWidth - 16) / sheet.offsetWidth);
    if (k < 1) {
      sheet.style.transformOrigin = "top left";
      sheet.style.transform = `scale(${k})`;
      sheet.style.marginLeft = "8px";
      sheet.style.marginBottom = `${-(1 - k) * sheet.offsetHeight}px`;
    }
  };
  fit();
  window.addEventListener("resize", fit);
})();
