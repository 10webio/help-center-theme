/* Site footer (templates/footer.hbs), ported from the 10Web WordPress theme (js/common/header.js).
   Phones: each link group is an accordion; elsewhere the group titles are plain headings, so their
   buttons are taken out of the tab order. The word in the bottom card rotates through the showcase words. */
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

    showcase(footer);
  }

  function showcase(footer) {
    var heading = footer.querySelector('.site-footer__heading');
    var swap = heading && heading.querySelector('.site-footer__swap');
    if (!swap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var words = (heading.getAttribute('data-words') || '').split(',').filter(Boolean);
    var cards = Array.prototype.slice.call(footer.querySelectorAll('.site-footer__shot-card'));
    var HOLD = 2600, WORD_IN = 950, WORD_OUT = 500;
    var current = 0;

    // Waits while the tab is hidden, so the cycle doesn't pile up.
    function later(fn, ms) {
      setTimeout(function wait() {
        if (document.hidden) { setTimeout(wait, 500); return; }
        fn();
      }, ms);
    }
    function leaveCards() {
      cards.forEach(function (card) { card.classList.remove('is-leaving'); });
      cards.forEach(function (card) {
        if (card.classList.contains('is-shown') || card.classList.contains('is-current')) {
          card.classList.remove('is-shown', 'is-current');
          card.classList.add('is-leaving');
        }
      });
    }
    function enterCards(index) {
      cards.forEach(function (card) {
        if (+card.getAttribute('data-word') !== index) return;
        card.classList.add('is-current');
        card.addEventListener('animationend', function done(e) {
          if (e.animationName !== 'site-footer-card-in') return;
          card.removeEventListener('animationend', done);
          card.classList.remove('is-current');
          card.classList.add('is-shown');
          Array.prototype.forEach.call(card.parentNode.querySelectorAll('.is-leaving'), function (old) { old.classList.remove('is-leaving'); });
        });
      });
    }
    function change() {
      swap.classList.remove('is-in');
      swap.classList.add('is-out');
      leaveCards();
      later(function () {
        current = (current + 1) % words.length;
        swap.textContent = words[current] + '.';
        swap.classList.remove('is-out');
        swap.classList.add('is-in');
        enterCards(current);
        later(change, WORD_IN + HOLD);
      }, WORD_OUT);
    }

    if (words.length < 2) return;
    if (!('IntersectionObserver' in window)) { later(change, HOLD); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (en) { return en.isIntersecting; })) {
        io.disconnect();
        later(change, HOLD);
      }
    }, { threshold: 0.3 });
    io.observe(heading);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', siteFooter); else siteFooter();
})();
