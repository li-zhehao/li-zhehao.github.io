// Blog list: filter posts by category. Tags live in each item's data-tags attribute.
document.addEventListener('DOMContentLoaded', function () {
  var bar = document.getElementById('blog-filters');
  if (!bar) return;
  var buttons = bar.querySelectorAll('[data-filter]');
  var items = document.querySelectorAll('.blog-item');

  var headings = document.querySelectorAll('.blog-section');

  function apply(filter) {
    items.forEach(function (item) {
      var tags = (item.getAttribute('data-tags') || '').split('|');
      var show = filter === 'all' || tags.indexOf(filter) !== -1;
      item.classList.toggle('d-none', !show);
    });
    // hide a section heading when the filter leaves nothing under it
    headings.forEach(function (h) {
      var section = h.getAttribute('data-section');
      var any = Array.prototype.some.call(items, function (item) {
        return item.getAttribute('data-section') === section && !item.classList.contains('d-none');
      });
      h.classList.toggle('d-none', !any);
    });
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(btn.getAttribute('data-filter'));
    });
  });

  // let a tag chip on a post act as a filter too
  document.querySelectorAll('.blog-item .tag').forEach(function (chip) {
    chip.addEventListener('click', function () {
      apply(chip.textContent.trim());
    });
    chip.style.cursor = 'pointer';
  });
});
