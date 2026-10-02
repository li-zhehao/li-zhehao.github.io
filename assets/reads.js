// Show GoatCounter read counts in any element with data-reads="<path>".
// Needs "Allow adding visitor counts on your website" enabled in the GoatCounter
// site settings; counts there are cached for up to four hours.
(function () {
  var CODE = 'zhehaoli';
  var API = 'https://' + CODE + '.goatcounter.com/counter';

  function fill(el) {
    var path = el.getAttribute('data-reads');
    if (!path) return;
    fetch(API + encodeURIComponent(path) + '.json')
      .then(function (r) {
        if (r.status === 404) return { count: '0' };   // no pageviews recorded yet
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        if (!d || d.count === undefined) return;
        var n = String(d.count).trim();
        el.textContent = n + (n === '1' ? ' read' : ' reads');
        el.hidden = false;
      })
      .catch(function () { /* blocked, offline, or counts not public: stay hidden */ });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-reads]').forEach(fill);
  });
})();
