/* ─── tabs.js — AgroVisão ────────────────────────────────────────────
   Scroll-spy para a navegação de abas da página Serviços.
   Atualiza o underline da aba ativa conforme o usuário rola a página.
   Requer: elementos com id="#regularizacao-fundiaria" etc. e
           links .services-tabs a[href^="#"]
   ──────────────────────────────────────────────────────────────────── */

(function initTabs() {
  'use strict';

  var tabs = document.querySelector('.services-tabs');
  if (!tabs) return;

  var links = Array.from(tabs.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;

  var sections = links.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  var ACTIVE_STYLE = { borderBottom: '2px solid #315B2C', fontWeight: '600', color: '#315B2C' };
  var IDLE_STYLE   = { borderBottom: '2px solid transparent', fontWeight: '500', color: '#999994' };

  function setActive(index) {
    links.forEach(function (a, i) {
      var s = i === index ? ACTIVE_STYLE : IDLE_STYLE;
      a.style.borderBottom = s.borderBottom;
      a.style.fontWeight   = s.fontWeight;
      a.style.color        = s.color;
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var current = 0;
      var mid = window.scrollY + window.innerHeight / 2;
      sections.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top + window.scrollY <= mid) current = i;
      });
      setActive(current);
    });
  }, { passive: true });
}());
