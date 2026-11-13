(function () {
  if (!document.documentElement.classList || !window.matchMedia) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  [].forEach.call(document.querySelectorAll("svg.es"), function (s) {
    var t;
    function toca() {
      s.classList.remove("toca");
      void s.getBoundingClientRect();
      s.classList.add("toca");
      clearTimeout(t);
      t = setTimeout(function () { s.classList.remove("toca"); }, 1100);
    }
    s.addEventListener("click", toca);
    s.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") toca(); });
  });
})();

(function () {
  var w = window, d = document, raiz = d.documentElement;
  if (!w.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in w)) return;
  var movil = matchMedia("(max-width: 63.99rem)"), RECORRIDO = 40;
  var escenas = [].slice.call(d.querySelectorAll(".escena-fija:not(.portada-historia)")).map(function (el) {
    var cand = [].slice.call(el.querySelectorAll(".historia-pasos li, .historia-pasos .paso-par, .historia-pasos > :not(ol):not(ul), .escenario > :not(.escenario-dibujo)"));
    function opaco(c) { var s = getComputedStyle(c); return s.backgroundColor !== "rgba(0, 0, 0, 0)" || s.backgroundImage !== "none"; }
    var buenos = cand.filter(function (c) {
      return opaco(c) || !cand.some(function (o) { return o !== c && c.contains(o); });
    });
    buenos = buenos.filter(function (c) { return !buenos.some(function (o) { return o !== c && o.contains(c); }); });
    return { el: el, dibujo: el.querySelector(".escenario-dibujo"), bloques: buenos, hojas: [].slice.call(el.querySelectorAll(".dia-lista")), ve: false };
  });
  var pendiente = 0;
  function activo() { return movil.matches && getComputedStyle(raiz).getPropertyValue("--sd-on").trim() === "1"; }
  function lee(e, si) {
    var borde = si && e.dibujo ? e.dibujo.getBoundingClientRect().bottom : -1e9;
    return {
      op: e.bloques.map(function (b) {
        var o = si ? Math.min(1, Math.max(0, (b.getBoundingClientRect().top - borde) / RECORRIDO)) : 1;
        return Math.round(o * 20) / 20;
      }),
      corte: e.hojas.map(function (h) { return si ? Math.max(0, Math.round(borde - h.getBoundingClientRect().top)) : 0; })
    };
  }
  function escribe(e, v) {
    e.bloques.forEach(function (b, i) {
      var o = v.op[i];
      if (b.__op !== o) { b.__op = o; b.style.opacity = o === 1 ? "" : String(o); }
    });
    e.hojas.forEach(function (h, i) {
      var c = v.corte[i];
      if (h.__c !== c) { h.__c = c; if (c) h.style.setProperty("--corte", c + "px"); else h.style.removeProperty("--corte"); }
    });
  }
  function paso() {
    pendiente = 0;
    var si = activo();
    var tocan = escenas.filter(function (e) { return e.ve || !si; });
    var valores = tocan.map(function (e) { return lee(e, si); });
    raiz.classList.toggle("se-va", si);
    tocan.forEach(function (e, i) { escribe(e, valores[i]); });
  }
  function pide() { if (!pendiente) pendiente = requestAnimationFrame(paso); }
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (x) { escenas.forEach(function (e) { if (e.el === x.target) e.ve = x.isIntersecting; }); });
    pide();
  });
  escenas.forEach(function (e) { io.observe(e.el); });
  w.addEventListener("scroll", pide, { passive: true });
  w.addEventListener("resize", pide, { passive: true });
  w.addEventListener("load", pide);
  pide();
})();
