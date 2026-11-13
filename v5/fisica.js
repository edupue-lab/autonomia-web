(function () {
  "use strict";
  var M = window.Muelle, d = document;
  if (!M || !window.matchMedia) return;

  var fino = window.matchMedia("(hover: hover) and (pointer: fine)");
  Array.prototype.forEach.call(d.querySelectorAll(".pila-carpetas a.carpeta"), function (a) {
    var p = a.querySelector(".pestana");
    if (!p) return;
    function pinta() { p.style.translate = mx.valor.toFixed(2) + "px " + my.valor.toFixed(2) + "px"; }
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

  var manila = d.querySelector(".e1-dibujo .e1-manila"), cuerpo = manila && manila.querySelector(".mn-cuerpo");
  if (cuerpo && cuerpo.getBBox) {
    manila.addEventListener("click", function (e) {
      if (e.button || M.quieto()) return;
      try { M.saltar(cuerpo, M.pieDe(cuerpo)); } catch (err) {   }
    });
  }
})();
