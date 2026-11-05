/* Site footer (templates/footer.hbs), ported from the 10Web WordPress theme (js/common/header.js).
   Phones: each link group is an accordion; elsewhere the group titles are plain headings, so their
   buttons are taken out of the tab order. */
(function () {
  'use strict';

  function siteFooter() {
    var footer = document.getElementById('tw-footer');
    if (!footer) return;
    var phone = window.matchMedia('(max-width: 767px)');
    var titles = Array.prototype.slice.call(footer.querySelectorAll('.site-footer__title'));

    function syncTitles() {
      titles.forEach(function (title) { title.disabled = !phone.matches; });
    }
    titles.forEach(function (title) {
      title.addEventListener('click', function () {
        title.setAttribute('aria-expanded', title.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      });
    });
    syncTitles();
    if (phone.addEventListener) phone.addEventListener('change', syncTitles);
    else if (phone.addListener) phone.addListener(syncTitles);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', siteFooter); else siteFooter();
})();
