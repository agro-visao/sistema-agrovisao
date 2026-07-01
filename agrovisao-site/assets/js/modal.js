/* ─── modal.js — AgroVisão ───────────────────────────────────────────
   Utilitários de acessibilidade para o modal de contato.
   O estado do modal (open/close/form) é gerenciado pelo DC Component
   em cada página. Este módulo complementa com focus trap e scroll lock.
   ──────────────────────────────────────────────────────────────────── */

(function initModal() {
  'use strict';

  var MODAL_SEL = '.modal';

  function getModal()   { return document.querySelector(MODAL_SEL); }
  function isVisible()  { var m = getModal(); return m ? m.offsetParent !== null : false; }

  /* Focus trap dentro do modal quando visível */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !isVisible()) return;
    var modal = getModal();
    if (!modal) return;

    var focusable = Array.from(
      modal.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );
    if (focusable.length < 2) return;

    var first = focusable[0];
    var last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  /* Observa abertura do modal para travar scroll e mover foco */
  var observer = new MutationObserver(function () {
    var modal = getModal();
    if (!modal) return;
    var visible = isVisible();
    document.body.style.overflow = visible ? 'hidden' : '';
    if (visible) {
      var first = modal.querySelector('button:not([disabled]), input, a[href]');
      if (first) setTimeout(function () { first.focus(); }, 40);
    }
  });

  /* Inicia observação quando o DOM estiver pronto */
  document.addEventListener('DOMContentLoaded', function () {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  });
}());
