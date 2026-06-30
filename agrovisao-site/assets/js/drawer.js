/* ─── drawer.js — AgroVisão ──────────────────────────────────────────
   Drawer de navegação mobile/tablet (≤ 1023px).
   Abre pela direita com overlay + foco trap + ESC + acessibilidade.
   ──────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function initDrawer() {
    var hamburger  = document.querySelector('.nav-hamburger');
    var drawer     = document.getElementById('drawer');
    var overlay    = document.querySelector('.drawer-overlay');
    var closeBtn   = document.querySelector('.drawer-close');

    if (!hamburger || !drawer || !overlay || !closeBtn) return;

    var drawerLinks = drawer.querySelectorAll('.drawer-link, .drawer-cta');

    /* ── open ─────────────────────────────────────────────────────── */
    function openDrawer() {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.classList.add('drawer-open');
      hamburger.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');

      var first = drawer.querySelector(FOCUSABLE);
      if (first) setTimeout(function () { first.focus(); }, 50);
    }

    /* ── close ────────────────────────────────────────────────────── */
    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.classList.remove('drawer-open');
      hamburger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      hamburger.focus();
    }

    /* ── focus trap + ESC ─────────────────────────────────────────── */
    function handleKeydown(e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
        return;
      }

      if (e.key !== 'Tab' || !drawer.classList.contains('is-open')) return;

      var focusable = Array.from(drawer.querySelectorAll(FOCUSABLE));
      if (!focusable.length) return;

      var first = focusable[0];
      var last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    /* ── listeners ────────────────────────────────────────────────── */
    hamburger.addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', handleKeydown);

    drawerLinks.forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrawer);
  } else {
    initDrawer();
  }
}());
