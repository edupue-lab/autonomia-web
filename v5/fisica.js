/* El movimiento físico de la portada (empleado 635; skill «movimiento-fisico»), con mesura y nada más que esto:
   1. Las pestañas de la pila de carpetas, con ratón, se dejan atraer un poco por el puntero, como un imán, y al
      salir vuelven a su sitio con un muelle que se pasa un pelín y se asienta.
   2. Manila (la de la primera escena) tiene peso: si se la toca, se agacha, da un saltito y se aplasta al caer.
   Los resortes de los botones, del «Saber más» y de las pestañas son solo CSS (breve.css, bloque del 635).
   En el modo suave (658, html.mov-suave) no hace nada; sin JavaScript, la página es la misma. Solo `translate` y `scale` en
   línea por CSSOM (la CSP lo permite): nunca `transform`, que es de las animaciones de las escenas. */
(function () {
  "use strict";
  var M = window.Muelle, d = document;
  if (!M || !window.matchMedia) return; // M.quieto() se mira en cada gesto: el modo se puede cambiar sin recargar

  // 1. El imán de las pestañas (solo con ratón: en el móvil, tocar es entrar)
  var fino = window.matchMedia("(hover: hover) and (pointer: fine)");
  Array.prototype.forEach.call(d.querySelectorAll(".pila-carpetas a.carpeta"), function (a) {
    var p = a.querySelector(".pestana");
    if (!p) return;
    function pinta() { p.style.translate = mx.valor.toFixed(2) + "px " + my.valor.toFixed(2) + "px"; }
    // ζ ≈ 0.45: llega con un pequeño rebote, como algo que pesa poco y se suelta
    var mx = M.crear({ rigidez: 260, amortiguacion: 14, precision: 0.05, alMover: pinta });
    var my = M.crear({ rigidez: 260, amortiguacion: 14, precision: 0.05, alMover: pinta });
    function tope(v, max) { return Math.max(-max, Math.min(max, v)); }
    a.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || !fino.matches || M.quieto()) return;
      var r = p.getBoundingClientRect();
      mx.ir(tope((e.clientX - (r.left + r.width / 2)) * 0.12, 7));
      my.ir(tope((e.clientY - (r.top + r.height / 2)) * 0.12, 4));
    });
    a.addEventListener("pointerleave", function () { mx.ir(0); my.ir(0); });
  });

  // 2. Manila con peso
  var manila = d.querySelector(".e1-dibujo .e1-manila"), cuerpo = manila && manila.querySelector(".mn-cuerpo");
  if (cuerpo && cuerpo.getBBox) {
    // 833: con click y no pointerdown, que empezar un scroll con el dedo encima de ella no la haga saltar
    manila.addEventListener("click", function (e) {
      if (e.button || M.quieto()) return;
      try { M.saltar(cuerpo, M.pieDe(cuerpo)); } catch (err) { /* sin caja medible (oculta): no salta */ }
    });
  }
})();
