// CFP Academy — petits comportements d'interface
document.addEventListener('DOMContentLoaded', () => {
  // Les messages flash disparaissent après 6 secondes
  document.querySelectorAll('.flash').forEach((el) => {
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
