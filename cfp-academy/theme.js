// Mode sombre de l'administration : appliqué avant l'affichage pour éviter un flash clair.
try { if (localStorage.getItem('cfp-theme') === 'dark') document.documentElement.dataset.theme = 'dark'; } catch (e) { /* stockage indisponible */ }
