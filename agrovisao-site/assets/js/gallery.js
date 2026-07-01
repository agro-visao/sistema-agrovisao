/* ─── gallery.js — AgroVisão ─────────────────────────────────────────
   Lightbox simples para a galeria de fotos (página Sobre).
   Ao clicar em uma imagem .gallery-item, abre overlay com imagem ampliada.
   ──────────────────────────────────────────────────────────────────── */

(function initGallery() {
  'use strict';

  var overlay = null;

  function createOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.88);',
      'display:none;align-items:center;justify-content:center;cursor:zoom-out;',
    ].join('');
    var img = document.createElement('img');
    img.style.cssText = 'max-width:90vw;max-height:88vh;object-fit:contain;border-radius:6px;';
    overlay.appendChild(img);
    overlay.addEventListener('click', closeGallery);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeGallery();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function openGallery(src, alt) {
    var ov = createOverlay();
    ov.querySelector('img').src = src;
    ov.querySelector('img').alt = alt || '';
    ov.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeGallery() {
    if (overlay) { overlay.style.display = 'none'; }
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var item = e.target.closest('.gallery-item');
    if (!item) return;
    var img = item.querySelector('img');
    if (img) { e.preventDefault(); openGallery(img.src, img.alt); }
  });
}());
