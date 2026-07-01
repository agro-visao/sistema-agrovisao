/* ─── main.js — AgroVisão ────────────────────────────────────────────
   Ponto de entrada unificado para todos os comportamentos de UI.
   Carregado em todas as páginas no lugar de drawer.js individual.

   Módulos gerenciados:
   - drawer  : menu hamburger/mobile (event delegation)
   - tabs    : scroll-spy para servicos.html
   - gallery : lightbox para galeria de fotos
   - modal   : utilitários de modal standalone
   ──────────────────────────────────────────────────────────────────── */

/* ── Drawer (injetado inline para evitar dependência de carregamento) ─ */
(function initDrawer() {
  'use strict';

  function drawer()    { return document.getElementById('drawer'); }
  function overlay()   { return document.querySelector('.drawer-overlay'); }
  function hamburger() { return document.querySelector('.nav-hamburger'); }

  function isOpen() {
    var d = drawer();
    return d ? d.classList.contains('is-open') : false;
  }

  function openDrawer() {
    var d = drawer(); var o = overlay(); var h = hamburger();
    if (!d || !o) return;
    d.classList.add('is-open');    o.classList.add('is-open');
    document.body.classList.add('drawer-open');
    d.setAttribute('aria-hidden', 'false'); o.setAttribute('aria-hidden', 'false');
    if (h) h.setAttribute('aria-expanded', 'true');
    var first = d.querySelector('a[href], button:not([disabled])');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }

  function closeDrawer() {
    var d = drawer(); var o = overlay(); var h = hamburger();
    if (!d || !o) return;
    d.classList.remove('is-open'); o.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    d.setAttribute('aria-hidden', 'true'); o.setAttribute('aria-hidden', 'true');
    if (h) { h.setAttribute('aria-expanded', 'false'); h.focus(); }
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('.nav-hamburger'))  { openDrawer();  return; }
    if (t.closest('.drawer-overlay')) { closeDrawer(); return; }
    if (t.closest('.drawer-close'))   { closeDrawer(); return; }
    if (t.closest('.drawer-nav a') || t.closest('.drawer-cta')) { closeDrawer(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { closeDrawer(); return; }
    if (e.key !== 'Tab' || !isOpen()) return;
    var d = drawer(); if (!d) return;
    var focusable = Array.from(d.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (focusable.length < 2) return;
    var first = focusable[0]; var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}());
