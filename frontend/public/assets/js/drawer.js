/* ─── drawer.js — AgroVisão ──────────────────────────────────────────
   Drawer de navegação mobile/tablet (≤ 1023px).

   NOTA DE ARQUITETURA:
   Todo o conteúdo da página está dentro de <x-dc>. O DC runtime carrega
   React via CDN de forma assíncrona e renderiza o componente depois do
   DOMContentLoaded. Por isso os elementos (.nav-hamburger, #drawer, etc.)
   NÃO existem no DOMContentLoaded.

   Solução: event delegation no document. Os listeners são registrados
   imediatamente no document — os elementos são consultados lazily no
   momento do clique, quando o React já terminou de renderizar.
   ──────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── helpers ──────────────────────────────────────────────────────── */
  function drawer()    { return document.getElementById('drawer'); }
  function overlay()   { return document.querySelector('.drawer-overlay'); }
  function hamburger() { return document.querySelector('.nav-hamburger'); }

  function isOpen() {
    var d = drawer();
    return d ? d.classList.contains('is-open') : false;
  }

  /* ── open ─────────────────────────────────────────────────────────── */
  function openDrawer() {
    var d = drawer();
    var o = overlay();
    var h = hamburger();
    if (!d || !o) return;

    d.classList.add('is-open');
    o.classList.add('is-open');
    document.body.classList.add('drawer-open');
    d.setAttribute('aria-hidden', 'false');
    o.setAttribute('aria-hidden', 'false');
    if (h) h.setAttribute('aria-expanded', 'true');

    /* foco no primeiro elemento focável */
    var first = d.querySelector('a[href], button:not([disabled])');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }

  /* ── close ────────────────────────────────────────────────────────── */
  function closeDrawer() {
    var d = drawer();
    var o = overlay();
    var h = hamburger();
    if (!d || !o) return;

    d.classList.remove('is-open');
    o.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    d.setAttribute('aria-hidden', 'true');
    o.setAttribute('aria-hidden', 'true');
    if (h) {
      h.setAttribute('aria-expanded', 'false');
      h.focus();
    }
  }

  /* ── click delegation ─────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var t = e.target;

    if (t.closest('.nav-hamburger')) { openDrawer();  return; }
    if (t.closest('.drawer-overlay')) { closeDrawer(); return; }
    if (t.closest('.drawer-close'))  { closeDrawer(); return; }

    /* fechar ao clicar em link ou CTA do drawer */
    if (t.closest('.drawer-nav a') || t.closest('.drawer-cta')) {
      closeDrawer();
    }
  });

  /* ── teclado: ESC + focus trap ────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      closeDrawer();
      return;
    }

    if (e.key !== 'Tab' || !isOpen()) return;

    var d = drawer();
    if (!d) return;

    var focusable = Array.from(
      d.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
    if (focusable.length < 2) return;

    var first = focusable[0];
    var last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

}());
