(function () {
  "use strict";
  var w = window, d = document, raiz = d.documentElement, mmOriginal = w.matchMedia, CLAVE = "autonomia-movimiento";
  if (!mmOriginal) return;
  var pideMenos = mmOriginal.call(w, "(prefers-reduced-motion: reduce)").matches;
  var guardado = null;
  try { guardado = w.localStorage.getItem(CLAVE); } catch (e) {   }
  if (guardado === "quieto") return;
  function suave() { return raiz.classList.contains("mov-suave"); }
  raiz.classList.toggle("mov-suave", guardado === "menos" || (guardado !== "mas" && pideMenos));

  var SI = "(min-width: 0px)", NO = "(max-width: -1px)";
  function sinReducir(t) {
    return t.replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/gi, SI)
      .replace(/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/gi, NO)
      .replace(/\(\s*prefers-reduced-motion\s*\)/gi, NO);
  }
  w.matchMedia = function (q) { return mmOriginal.call(w, /prefers-reduced-motion/i.test(q) ? sinReducir(String(q)) : q); };
  function recorre(reglas) {
    for (var i = 0; reglas && i < reglas.length; i++) {
      var r = reglas[i];
      if (r.media && /prefers-reduced-motion/i.test(r.media.mediaText)) {
        try { r.media.mediaText = sinReducir(r.media.mediaText); } catch (e) {   }
      }
      if (r.cssRules) recorre(r.cssRules);
    }
  }
  function hoja(s) { try { recorre(s.cssRules); } catch (e) {   } }
  function todas() { for (var i = 0; i < d.styleSheets.length; i++) hoja(d.styleSheets[i]); }
  if (pideMenos) {
    todas();
    d.addEventListener("DOMContentLoaded", function () {
      todas();
      [].forEach.call(d.querySelectorAll('link[rel="stylesheet"]'), function (l) { l.addEventListener("load", todas); });
    });
    w.addEventListener("load", todas);
  }

  var LENTO = 0.6, CORTO = "linear(0.2, 0.8)";
  function bucle(a) {
    try {
      var t = a.effect && a.effect.getTiming && a.effect.getTiming();
      if (!t || t.iterations !== Infinity) return;
      if (suave()) {
        a.playbackRate = LENTO;
        var ida = /alternate/.test(t.direction), pasos = a.effect.getKeyframes().some(function (k) { return /steps/.test(k.easing || ""); });
        if (ida && !pasos) { a.effect.updateTiming({ easing: CORTO }); a.movCorto = true; }
      } else {
        a.playbackRate = 1;
        if (a.movCorto) { a.effect.updateTiming({ easing: "linear" }); a.movCorto = false; }
      }
    } catch (e) {   }
  }
  function bucles() { if (d.getAnimations) d.getAnimations().forEach(bucle); }
  d.addEventListener("animationstart", function (ev) {
    if (!suave() || !ev.target.getAnimations) return;
    ev.target.getAnimations().forEach(function (a) { if (a.animationName === ev.animationName) bucle(a); });
  }, true);

  var FRENA = "cubic-bezier(0.22, 1, 0.36, 1)";
  function sePasa(c) {
    var m = /^(linear|cubic-bezier)\((.*)\)$/.exec(c || ""); if (!m) return false;
    var n = m[2].split(",").map(function (x) { return parseFloat(x); });
    if (m[1] === "cubic-bezier") return n[1] > 1 || n[1] < 0 || n[3] > 1 || n[3] < 0;
    return n.some(function (y) { return y > 1.001 || y < -0.001; });
  }
  function copia(k, frena) { var c = {}; for (var p in k) c[p] = k[p]; delete c.computedOffset; if (frena && sePasa(c.easing)) c.easing = FRENA; return c; }
  w.movSinRebote = function (a) {
    var s = suave() ? 1 : 0;
    if ((a.movSuave || 0) === s || !a.effect || !a.effect.setKeyframes) return;
    try {
      if (s) {
        var kf = a.effect.getKeyframes();
        if (kf.some(function (k) { return sePasa(k.easing); })) {
          a.movKf = kf; a.effect.setKeyframes(kf.map(function (k) { return copia(k, true); }));
        }
      } else if (a.movKf) {
        a.effect.setKeyframes(a.movKf.map(function (k) { return copia(k, false); })); a.movKf = null;
      }
    } catch (e) {   }
    a.movSuave = s;
  };

  var css = w.CSS && CSS.supports && CSS.supports("animation-timeline: view()") && CSS.supports("timeline-scope: --a");
  var puentes = [], raf = 0, antes = 0;
  var LINEA = { "--pu-dia": "#cada-dia", "--pu-pagina": "#tu-pagina", "--pu-plazos": "#plazos" };
  function linea(p) {
    var n = getComputedStyle(p).getPropertyValue("--pu-tl").trim(), m = n.match(/^--(e\d+b?)$/);
    return m ? d.querySelector('[data-escena="' + m[1] + '"]') : (LINEA[n] ? d.querySelector(LINEA[n]) : null);
  }
  function prepara() {
    var js = !css || suave();
    raiz.classList.toggle("pu-js", js);
    puentes = [];
    if (!js) return;
    [].forEach.call(d.querySelectorAll(".puente"), function (p) {
      var tl = linea(p);
      if (!tl || !p.getAnimations) return;
      var adel = parseFloat(getComputedStyle(p).getPropertyValue("--pu-adelanto")) || 0;
      var anims = p.getAnimations({ subtree: true }).filter(function (a) { return /^pu\d/.test(a.animationName || ""); });
      if (anims.length) puentes.push({ tl: tl, adel: adel, anims: anims, pos: 0, meta: 0 });
    });
    pide();
  }
  function avance(x) {
    var r = x.tl.getBoundingClientRect(), cs = getComputedStyle(raiz);
    var arriba = parseFloat(cs.scrollPaddingTop) || 0, abajo = parseFloat(cs.scrollPaddingBottom) || 0;
    var alto = w.innerHeight - arriba - abajo, e = (w.innerHeight - abajo - r.top) / Math.max(1, Math.min(r.height, alto)) * 100;
    return e;
  }
  function pon(a, x, p) {
    var linea6 = a.animationName === "pu6-linea", desde = (linea6 ? 15 : 0) - x.adel, hasta = (linea6 ? 75 : 100) - x.adel;
    a.currentTime = Math.max(0, Math.min(1, (p - desde) / (hasta - desde))) * 1000;
  }
  function paso(t) {
    raf = 0;
    var dt = antes ? Math.min(64, t - antes) : 16, sigue = false;
    antes = t;
    puentes.forEach(function (x) {
      var e = avance(x);
      if (!suave()) { x.anims.forEach(function (a) { pon(a, x, e); }); return; }
      if (e <= 0) x.meta = x.pos = 0; else if (e > 30) x.meta = 1;
      if (x.pos < x.meta) { x.pos = Math.min(x.meta, x.pos + dt / 1600); sigue = true; }
      x.anims.forEach(function (a) { a.currentTime = x.pos * 1000; });
    });
    if (sigue) pide(); else antes = 0;
  }
  function pide() { if (!raf && puentes.length) raf = requestAnimationFrame(paso); }

  function pinta() {
    [].forEach.call(d.querySelectorAll("[data-movimiento]"), function (b) {
      var s = suave(), txt = s ? "Más movimiento" : "Menos movimiento";
      var t = b.querySelector(".movimiento-texto") || b;
      t.textContent = txt;
      b.setAttribute("aria-label", s ? "Ver la web con más movimiento" : "Ver la web con menos movimiento");
    });
  }
  d.addEventListener("DOMContentLoaded", function () {
    pinta();
    if (suave()) bucles();
    prepara();
    w.addEventListener("scroll", pide, { passive: true });
    var ancho = w.innerWidth, reloj = 0;
    w.addEventListener("resize", function () {
      if (w.innerWidth === ancho) return pide();
      ancho = w.innerWidth; clearTimeout(reloj); reloj = setTimeout(prepara, 250);
    }, { passive: true });
    [].forEach.call(d.querySelectorAll("[data-movimiento]"), function (b) {
      b.hidden = false;
      b.addEventListener("click", function () {
        var s = !suave();
        raiz.classList.toggle("mov-suave", s);
        try { w.localStorage.setItem(CLAVE, s ? "menos" : "mas"); } catch (e) {   }
        pinta();
        requestAnimationFrame(function () { bucles(); prepara(); });
      });
    });
  });
  w.addEventListener("load", function () { if (raiz.classList.contains("pu-js")) prepara(); });
})();
