/* v5: el tema. Regla de Edu (05/10, recordada el 21/10): la web abre SIEMPRE en claro, aunque el aparato esté en
   oscuro; el oscuro solo si se elige con el botón, y entonces se recuerda. Eso lo hace ../tema.js (justo antes, en
   <head>, sin fogonazo): solo pone el oscuro si se guardó «dark» al pulsar. Aquí solo se pinta el color de la barra
   del navegador con el papel de la v5, al cargar y tras cada pulsación (tema.js pone el de la portada anterior). */
(function () {
  var raiz = document.documentElement;
  function barra() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", raiz.getAttribute("data-theme") === "dark" ? "#15140f" : "#fafaf8");
  }
  document.addEventListener("DOMContentLoaded", function () {
    barra();
    [].forEach.call(document.querySelectorAll("[data-tema]"), function (b) { b.addEventListener("click", barra); });
  });
})();
