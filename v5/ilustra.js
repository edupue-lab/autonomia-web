(function () {
  var escenas = [].slice.call(document.querySelectorAll("[data-ilustra]"));
  if (!escenas.length) return;
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raiz = document.documentElement;
  if (quieto || !("IntersectionObserver" in window)) {
    escenas.forEach(function (e) { e.classList.add("vista", "quieta"); });
    return;
  }
  raiz.classList.add("ilu-anima");
  var cola = [], libre = 0, reloj = 0, primera = true;
  var estrecho = matchMedia("(max-width: 47.99rem)").matches;
  var ESPERA = estrecho ? 0 : 220, HUECO = estrecho ? 200 : 420;
  function acelera(el) {
    if (!estrecho || !el.getAnimations) return;
    el.getAnimations({ subtree: true }).forEach(function (a) {
      if (a.animationName && /^(sd|rs|sx)-/.test(a.animationName)) return;
      var t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (t && t.iterations !== Infinity && a.timeline === document.timeline) a.playbackRate = 1.2;
    });
  }
  function saca() {
    reloj = 0;
    var ahora = performance.now();
    while (cola.length && !cola[0].classList.contains("en-pantalla")) completa(cola.shift());
    if (!cola.length) return;
    var listo = Math.max(cola[0]._desde, libre);
    if (listo > ahora + 4) { reloj = setTimeout(saca, listo - ahora); return; }
    var el = cola.shift();
    el.classList.add("vista");
    acelera(el);
    el.dispatchEvent(new CustomEvent("ilu-vista"));
    libre = ahora + HUECO;
    if (cola.length) reloj = setTimeout(saca, 0);
  }
  function entra(el, espera) {
    el.classList.add("vista-pedida");
    el._desde = performance.now() + espera;
    cola.push(el);
    if (!reloj) reloj = setTimeout(saca, 0);
  }
  function completa(el) {
    el.classList.add("vista-pedida", "vista");
    if (el.getAnimations) el.getAnimations({ subtree: true }).forEach(function (a) {
      if (a.animationName && /^(sd|rs|sx)-/.test(a.animationName)) return;
      var fin = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming().iterations : 1;
      if (fin !== Infinity) try { a.finish(); } catch (err) {   }
    });
    el.dispatchEvent(new CustomEvent("ilu-vista"));
  }
  var saltando = false, tSalto;
  function salta() {
    saltando = true;
    clearTimeout(tSalto);
    tSalto = setTimeout(function () { saltando = false; }, 2000);
  }
  window.addEventListener("scrollend", function () {
    if (!saltando) return;
    clearTimeout(tSalto);
    tSalto = setTimeout(function () { saltando = false; }, 250);
  });
  if (location.hash || window.scrollY > 0) salta();
  window.addEventListener("hashchange", salta);
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href").length > 1) salta();
  });
  var io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      e.target.classList.toggle("en-pantalla", e.isIntersecting);
      if (e.isIntersecting && !e.target.classList.contains("vista-pedida")) {
        if (saltando || (primera && window.scrollY > 0)) completa(e.target);
        else entra(e.target, primera ? 0 : ESPERA);
      }
    });
    primera = false;
  }, estrecho ? { threshold: 0.15, rootMargin: "0px 0px 10% 0px" } : { threshold: 0.3 });
  escenas.forEach(function (e) { io.observe(e); });
  window.addEventListener("beforeprint", function () { escenas.forEach(completa); });

  var piezas = [].slice.call(document.querySelectorAll("g.mn-ojos, g.mn-cuerpo")).map(function (g) {
    var cuerpo = g.classList.contains("mn-cuerpo");
    return { g: g, esc: g.closest("[data-ilustra]"), cuerpo: cuerpo, x: 0, y: 0, tx: 0, ty: 0, piv: null,
      max: parseFloat(g.getAttribute("data-mn-max")) || (cuerpo ? 2.5 : 1.5) };
  }).filter(function (p) { return p.esc; });
  var fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var px = null, py = null, ultimo = 0, raf = 0;
  function pide() { if (!raf) raf = requestAnimationFrame(paso); }
  function mira(x, y) { px = x; py = y; ultimo = performance.now(); pide(); }
  function paso() {
    raf = 0;
    var activo = px !== null && performance.now() - ultimo < (fino ? 2500 : 1400), sigue = activo;
    var vivas = piezas.filter(function (p) { return p.esc.classList.contains("en-pantalla") || p.x || p.y; });
    vivas.forEach(function (p) {
      p.tx = p.ty = 0;
      if (!activo || !p.esc.classList.contains("en-pantalla")) return;
      if (p.cuerpo && !p.piv) { var b = p.g.getBBox(); p.piv = (b.x + b.width / 2).toFixed(1) + " " + (b.y + b.height).toFixed(1); }
      var r = p.g.getBoundingClientRect(), dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      var d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 240);
      if (p.cuerpo) p.tx = Math.max(-1, Math.min(1, dx / 500)) * p.max;
      else { p.tx = dx / d * k * p.max; p.ty = dy / d * k * p.max; }
    });
    vivas.forEach(function (p) {
      p.x += (p.tx - p.x) * 0.14; p.y += (p.ty - p.y) * 0.14;
      if (Math.abs(p.tx - p.x) < 0.02 && Math.abs(p.ty - p.y) < 0.02) { p.x = p.tx; p.y = p.ty; } else sigue = true;
      if (!p.x && !p.y) p.g.removeAttribute("transform");
      else if (p.cuerpo) p.g.setAttribute("transform", "rotate(" + p.x.toFixed(2) + " " + p.piv + ")");
      else p.g.setAttribute("transform", "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ")");
    });
    if (sigue) pide();
  }
  if (piezas.length) {
    window.ilustraMira = mira;
    if (fino) window.addEventListener("pointermove", function (e) { mira(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") mira(e.clientX, e.clientY); }, { passive: true });
  }

  var manila = document.querySelector(".pt-manila");
  if (manila) {
    var tSaluda;
    manila.addEventListener("click", function () {
      manila.classList.remove("saluda");
      void manila.getBoundingClientRect();
      manila.classList.add("saluda");
      clearTimeout(tSaluda);
      tSaluda = setTimeout(function () { manila.classList.remove("saluda"); }, 1100);
    });
    document.querySelectorAll(".portada .acciones a").forEach(function (a) {
      a.addEventListener("focus", function () {
        var r = a.getBoundingClientRect();
        if (window.ilustraMira) window.ilustraMira(r.left + r.width / 2, r.top + r.height / 2);
      });
    });
  }



  (function () {
    var esc = document.querySelector("#seguridad .seg-escena");
    var no = document.querySelector("#seguridad .impreso-no");
    if (!esc || !no) return;
    var t;
    function niega() { clearTimeout(t); esc.classList.add("seg-no"); }
    function suelta() { clearTimeout(t); t = setTimeout(function () { esc.classList.remove("seg-no"); }, 700); }
    no.addEventListener("pointerenter", niega);
    no.addEventListener("pointerleave", suelta);
    no.addEventListener("click", function () { niega(); t = setTimeout(function () { esc.classList.remove("seg-no"); }, 1600); });
  })();

})();
