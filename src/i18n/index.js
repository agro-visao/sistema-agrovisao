/* ─── src/i18n/index.js — AgroVisão ─────────────────────────────────
   Infraestrutura de internacionalização (i18next + language detector).

   NESTA ETAPA nenhum texto do site é traduzido — apenas a fundação:
     • detecção automática do idioma (localStorage → navigator → pt);
     • persistência da preferência em localStorage ("preferred-language");
     • troca instantânea PT/EN sem reload (seletores do header e drawer);
     • mecanismo data-i18n pronto para receber as chaves de tradução.

   NOTA DE ARQUITETURA (mesma do drawer.js):
   O conteúdo da página vive dentro de <x-dc> e é renderizado pelo DC
   runtime (React via CDN) DEPOIS do DOMContentLoaded. Por isso os
   listeners usam event delegation no document e a sincronização visual
   dos seletores de idioma é reaplicada até os elementos existirem.

   COMO ADICIONAR TRADUÇÕES FUTURAMENTE:
   1. Adicione a chave em locales/pt/common.json e locales/en/common.json:
        { "nav": { "home": "Home" } }
   2. Marque o elemento no HTML com data-i18n:
        <a data-i18n="nav.home">Home</a>
      (para atributos: data-i18n-attr="placeholder:form.name")
   3. O texto é aplicado no boot e reaplicado a cada troca de idioma.
   Em JS, use window.t('nav.home') ou window.i18n.t('nav.home').
   ──────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var STORAGE_KEY = 'preferred-language';
  var SUPPORTED = ['pt', 'en'];
  var FALLBACK = 'pt';

  /* Caminho base deste script → permite resolver locales/ de qualquer página */
  var BASE = (function () {
    var s = document.currentScript;
    var src = (s && s.src) || './src/i18n/index.js';
    return src.replace(/\/index\.js.*$/, '');
  })();

  if (!window.i18next || !window.i18nextBrowserLanguageDetector) {
    console.error('[i18n] i18next não carregado — confira as tags <script> do vendor.');
    return;
  }

  /* ── carga dos recursos ───────────────────────────────────────────── */
  function loadLocale(lng) {
    return fetch(BASE + '/locales/' + lng + '/common.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (e) {
        console.error('[i18n] falha ao carregar locale "' + lng + '":', e);
        return {};
      });
  }

  /* ── inicialização ────────────────────────────────────────────────── */
  Promise.all(SUPPORTED.map(loadLocale)).then(function (bundles) {
    var resources = {};
    SUPPORTED.forEach(function (lng, i) {
      resources[lng] = { common: bundles[i] };
    });

    window.i18next
      .use(window.i18nextBrowserLanguageDetector)
      .init({
        resources: resources,
        supportedLngs: SUPPORTED,
        nonExplicitSupportedLngs: true, /* "pt-BR" → pt, "en-GB" → en */
        load: 'languageOnly',
        fallbackLng: FALLBACK,          /* qualquer outro idioma → pt */
        defaultNS: 'common',
        ns: ['common'],
        interpolation: { escapeValue: false },
        detection: {
          /* 1º localStorage (preferência salva), 2º idioma do navegador */
          order: ['localStorage', 'navigator'],
          lookupLocalStorage: STORAGE_KEY,
          /* salva automaticamente em localStorage a cada changeLanguage */
          caches: ['localStorage']
        }
      })
      .then(function () {
        window.i18n = window.i18next;
        window.t = window.i18next.t.bind(window.i18next);
        applyLanguage();
        window.i18next.on('languageChanged', applyLanguage);
        /* o DC runtime renderiza o header de forma assíncrona —
           reaplica a sincronização até os seletores existirem */
        waitForSwitchers();
      });
  });

  /* idioma corrente normalizado ("pt-BR" → "pt") */
  function currentLang() {
    var lng = (window.i18next && window.i18next.resolvedLanguage) || FALLBACK;
    return lng.split('-')[0];
  }

  /* ── aplicação (troca instantânea, sem reload) ───────────────────── */
  function applyLanguage() {
    document.documentElement.lang = currentLang() === 'pt' ? 'pt-BR' : 'en';
    syncSwitchers();
    applyTranslations();
  }

  /* Traduz todo elemento marcado com data-i18n / data-i18n-attr.
     Nesta etapa nenhum elemento está marcado → nenhuma alteração visual. */
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = window.i18next.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      /* formato: data-i18n-attr="placeholder:form.name;title:form.hint" */
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var idx = pair.indexOf(':');
        if (idx < 0) return;
        el.setAttribute(pair.slice(0, idx).trim(), window.i18next.t(pair.slice(idx + 1).trim()));
      });
    });
  }

  /* ── seletores PT/EN (header e drawer) ───────────────────────────── */
  function langOfItem(el) {
    return /EN/i.test(el.textContent) ? 'en' : 'pt';
  }

  function syncSwitchers() {
    var lng = currentLang();
    document.querySelectorAll('.nav-lang-item, .drawer-lang-item').forEach(function (el) {
      var active = langOfItem(el) === lng;
      el.classList.toggle('is-active', active);
      if (active) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  }

  function waitForSwitchers() {
    var tries = 0;
    var timer = setInterval(function () {
      if (document.querySelector('.nav-lang-item') || ++tries > 50) {
        clearInterval(timer);
        syncSwitchers();
      }
    }, 100);
  }

  /* clique nas bandeiras — delegation (elementos são renderizados depois) */
  document.addEventListener('click', function (e) {
    var item = e.target.closest('.nav-lang-item, .drawer-lang-item');
    if (!item) return;
    e.preventDefault();
    var lng = langOfItem(item);
    if (window.i18next && lng !== currentLang()) {
      /* changeLanguage dispara languageChanged e persiste via caches */
      window.i18next.changeLanguage(lng);
    }
  });
}());
