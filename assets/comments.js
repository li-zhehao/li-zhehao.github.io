// giscus comments (GitHub Discussions) for blog posts.
//
// Setup, once:
//   1. the repo must be public, with Discussions enabled
//      (Settings > General > Features > Discussions)
//   2. install the giscus app: https://github.com/apps/giscus
//   3. open https://giscus.app, enter the repo, pick a discussion category
//      (e.g. "Announcements"), and copy the two ids it shows
//   4. paste them below; comments appear once both are filled in
var GISCUS = {
  repo: 'li-zhehao/li-zhehao.github.io',
  repoId: 'R_kgDOJogcKA',
  // "General" is an open category: visitors' first comment creates the discussion.
  // Announcement-type categories reject this, since only maintainers may create there.
  category: 'General',
  categoryId: 'DIC_kwDOJogcKM4DG1BR',
};

(function () {
  var mount = document.getElementById('comments');
  if (!mount) return;
  if (!GISCUS.repoId || !GISCUS.categoryId) {
    console.info('giscus: add repoId and categoryId in assets/comments.js to enable comments');
    mount.closest('.d-comments').hidden = true;
    return;
  }

  function theme() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark'
      ? 'dark_dimmed' : 'light';
  }

  var s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  var attrs = {
    repo: GISCUS.repo,
    repoid: GISCUS.repoId,
    category: GISCUS.category,
    categoryid: GISCUS.categoryId,
    mapping: 'pathname',
    strict: '1',
    reactionsenabled: '1',
    emitmetadata: '0',
    inputposition: 'top',
    theme: theme(),
    lang: 'en',
  };
  s.onerror = function () { console.error('giscus: client.js failed to load'); };
  Object.keys(attrs).forEach(function (k) { s.setAttribute('data-' + k, attrs[k]); });
  mount.appendChild(s);

  // keep the comment box in step with the site's light/dark toggle
  new MutationObserver(function () {
    var frame = document.querySelector('iframe.giscus-frame');
    if (frame) {
      frame.contentWindow.postMessage({ giscus: { setConfig: { theme: theme() } } },
        'https://giscus.app');
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
})();
