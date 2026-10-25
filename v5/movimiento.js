/* v5 (658): cuánto se mueve la web. Edu (22/10): «la web quiero que tenga animaciones», también en los aparatos que
   piden «reducir movimiento» (Windows con «Efectos de animación» apagado o el ahorro de batería; Android con «Quitar
   animaciones»). Antes, con esa preferencia, todo quedaba quieto; ahora hay dos modos y nunca se apaga todo:
   - COMPLETO: lo de siempre.
   - SUAVE (html.mov-suave): por defecto si el aparato pide menos movimiento, o si se elige «Menos movimiento». Las
     escenas van más despacio (motor.js), los bucles van más lentos y, los de ida y vuelta, con menos recorrido; sin
     rebotes de muelle, sin la Manila del cordel (sigue al scroll) y los puentes entre secciones, por tiempo en vez de
     pegados al scroll. Las entradas, con fundido y poco desplazamiento (breve.css, bloque del 658).
   El botón [data-movimiento] cambia de modo y se recuerda (localStorage «autonomia-movimiento»: «menos» o «mas»).
   Cómo: este archivo va síncrono en <head>, después de las hojas de estilo y antes de motor.js. Cuando el aparato pide
   menos movimiento, reescribe en las hojas (CSSOM) las condiciones «prefers-reduced-motion» como si no lo pidiera, y
   matchMedia contesta lo mismo a los scripts: así el CSS y el JS de siempre funcionan sin tocar cada regla.
   También (punto 2 del 658): donde el navegador no sabe animation-timeline (Firefox, Safari antiguos), los puentes
   se mueven con el scroll por JavaScript (html.pu-js, con las mismas animaciones en pausa y su currentTime). */
(function () {
  "use strict";
  var w = window, d = document, raiz = d.documentElement, mmOriginal = w.matchMedia, CLAVE = "autonomia-movimiento";
  if (!mmOriginal) return;
  var pideMenos = mmOriginal.call(w, "(prefers-reduced-motion: reduce)").matches;
  var guardado = null;
  try { guardado = w.localStorage.getItem(CLAVE); } catch (e) { /* sin almacenamiento: vale el aparato */ }
  // «quieto» (solo lo ponen las pruebas de accesibilidad, para no medir nada a medio aparecer): como antes del 658,
  // con «reducir movimiento» todo queda en su último fotograma y no hay botón
  if (guardado === "quieto") return;
  function suave() { return raiz.classList.contains("mov-suave"); }
  raiz.classList.toggle("mov-suave", guardado === "menos" || (guardado !== "mas" && pideMenos));

  // 1. Que «reducir movimiento» no lo apague todo: CSS y matchMedia, como si no se pidiera
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
        try { r.media.mediaText = sinReducir(r.media.mediaText); } catch (e) { /* regla de solo lectura */ }
      }
      if (r.cssRules) recorre(r.cssRules);
    }
  }
  function hoja(s) { try { recorre(s.cssRules); } catch (e) { /* hoja de otro origen o aún sin cargar */ } }
  function todas() { for (var i = 0; i < d.styleSheets.length; i++) hoja(d.styleSheets[i]); }
  if (pideMenos) {
    todas(); // las de <head> ya están cargadas (un script síncrono espera a las hojas de antes)
    d.addEventListener("DOMContentLoaded", function () {
      todas();
      [].forEach.call(d.querySelectorAll('link[rel="stylesheet"]'), function (l) { l.addEventListener("load", todas); });
    });
    w.addEventListener("load", todas);
  }

  // 2. Los bucles en modo suave: más lentos y, los de ida y vuelta (alternate) sin pasos, con un 60 % del recorrido
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
    } catch (e) { /* navegador sin linear() o sin getKeyframes: se queda como está */ }
  }
  function bucles() { if (d.getAnimations) d.getAnimations().forEach(bucle); }
  d.addEventListener("animationstart", function (ev) {
    if (!suave() || !ev.target.getAnimations) return;
    ev.target.getAnimations().forEach(function (a) { if (a.animationName === ev.animationName) bucle(a); });
  }, true);

  // 2 bis (660). Las curvas de los fotogramas clave de las escenas van escritas (con var() se quedaban en lineal), así
  // que el modo suave ya no las cambia por variables: motor.js pasa aquí cada animación de escena y, en el modo suave,
  // las curvas que se pasan de su sitio (muelles, rebotes) pasan a la que frena sin pasarse, como hace breve.css con
  // --muelle-vivo; en el modo completo vuelven las de siempre. Una vez por animación y modo.
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
    } catch (e) { /* sin setKeyframes: se queda con sus curvas */ }
    a.movSuave = s;
  };

  // 3. Los puentes por JavaScript: sin animation-timeline, o en modo suave (por tiempo, nunca pegados al scroll)
  var css = w.CSS && CSS.supports && CSS.supports("animation-timeline: view()") && CSS.supports("timeline-scope: --a");
  var puentes = [], raf = 0, antes = 0;
  var LINEA = { "--pu-dia": "#cada-dia", "--pu-pagina": "#tu-pagina", "--pu-plazos": "#plazos" };
  function linea(p) { // el elemento cuya entrada en pantalla mueve el puente (su view-timeline en CSS)
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
      // en pausa por CSS (html.pu-js), no con pause(): así, al volver al camino CSS, nada se queda congelado
      if (anims.length) puentes.push({ tl: tl, adel: adel, anims: anims, pos: 0, meta: 0 });
    });
    pide();
  }
  function avance(x) { // 0-1 del tramo «entry» de su sección (como animation-range: entry 0% entry 100%)
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
      // suave: cuando su sección asoma un tercio, el puente hace su viaje entero en 1,6 s; vuelve a 0 si se sube de nuevo
      if (e <= 0) x.meta = x.pos = 0; else if (e > 30) x.meta = 1;
      if (x.pos < x.meta) { x.pos = Math.min(x.meta, x.pos + dt / 1600); sigue = true; }
      x.anims.forEach(function (a) { a.currentTime = x.pos * 1000; });
    });
    if (sigue) pide(); else antes = 0;
  }
  function pide() { if (!raf && puentes.length) raf = requestAnimationFrame(paso); }

  // 4. El botón: «Menos movimiento» / «Más movimiento», y se recuerda
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
    if (suave()) bucles(); // en el modo completo no hay nada que cambiar (y getAnimations obliga a recalcular estilos)
    prepara();
    w.addEventListener("scroll", pide, { passive: true });
    // solo si cambia el ancho (en el móvil, la barra del navegador cambia el alto al hacer scroll)
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
        try { w.localStorage.setItem(CLAVE, s ? "menos" : "mas"); } catch (e) { /* no se recuerda, pero cambia */ }
        pinta();
        requestAnimationFrame(function () { bucles(); prepara(); });
      });
    });
  });
  w.addEventListener("load", function () { if (raiz.classList.contains("pu-js")) prepara(); });
})();
