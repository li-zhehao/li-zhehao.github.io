// Light/dark theme: loaded in <head> so the saved theme applies before first paint.
(function () {
  var KEY = 'theme';

  function storedTheme() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function preferredTheme() {
    var saved = storedTheme();
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function swapClass(selector, remove, add) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.classList.remove(remove);
      el.classList.add(add);
    });
  }

  function applyTheme(theme) {
    var dark = theme === 'dark';
    document.documentElement.setAttribute('data-bs-theme', theme);
    if (!document.body) return;

    swapClass('.btn:not(.theme-toggle)', dark ? 'btn-outline-dark' : 'btn-outline-light',
      dark ? 'btn-outline-light' : 'btn-outline-dark');
    swapClass('#bibtex', dark ? 'bibtex-light' : 'bibtex-dark', dark ? 'bibtex-dark' : 'bibtex-light');

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  function toggleTheme() {
    var next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (e) { }
    applyTheme(next);
  }

  window.toggleTheme = toggleTheme;

  applyTheme(preferredTheme());

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(document.documentElement.getAttribute('data-bs-theme'));
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });
  });
})();
