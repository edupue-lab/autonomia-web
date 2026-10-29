/* (833) Las páginas sueltas de la web, con vida: el dossier, oficinas, gracias y la 404. Edu (29/10): «más animaciones
   de los dibujos, más interactividad, todo tiene respuesta». Skills ilustracion-calco y movimiento-fisico.
   - Los dibujos del dossier y de oficinas (svg.dossier-ilu) se ven terminados desde el principio, como antes (se leen y
     se imprimen); ahora además respiran y parpadean mientras se ven (los bucles de escenas.css e ilustra.css, que van
     con html.ilu-anima y .en-pantalla), siguen al ratón con la mirada, saltan con peso al tocarlos (Muelle.saltar, si
     está muelle.js) y, la primera vez que llegan con el scroll, dan un saltito de saludo.
   - Las escenas propias (svg.pv-escena: gracias y 404) hacen su entrada al verse (.vista; paginas-vivas.css).
   Movimiento («autonomia-movimiento», el que se elige en la portada con movimiento.js, 658): «quieto», o el aparato con
   «reducir movimiento» sin haber elegido «mas», lo deja todo en su último fotograma (aquí no hay botón para pedir
   más); «menos» es el modo suave (html.mov-suave: bucles más lentos, sin saltos). Sin JavaScript, todo quieto y
   completo. Los bucles solo corren en pantalla. Se reacciona al clic o al toque, nunca al pasar el ratón. */
(function () {
  "use strict";
  var w = window, d = document, raiz = d.documentElement;
  // Las escenas propias esperan en su pose de partida desde la primera pintura (html.js, de tema.js); si no van a
  // moverse, se dejan en su último fotograma
  function terminadas() { [].forEach.call(d.querySelectorAll("svg.pv-escena"), function (s) { s.classList.add("vista", "hecha"); }); }
  if (!w.matchMedia || !("IntersectionObserver" in w) || !raiz.classList) return terminadas();
  var guardado = null;
  try { guardado = w.localStorage.getItem("autonomia-movimiento"); } catch (e) { /* sin almacenamiento: vale el aparato */ }
  // Estas páginas no tienen el botón «Menos movimiento» de la portada: con «reducir movimiento» (y sin haber elegido
  // «más» allí) se quedan en su último fotograma, quietas
  var pideMenos = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (guardado === "quieto" || (pideMenos && guardado !== "mas")) return terminadas();
  var suave = guardado === "menos";
  raiz.classList.toggle("mov-suave", suave);
  var escenas = [].slice.call(d.querySelectorAll("svg.dossier-ilu, svg.pv-escena"));
  if (!escenas.length) return;
  var fino = matchMedia("(hover: hover) and (pointer: fine)").matches, M = w.Muelle;

  // 1. Los del dossier, ya terminados: «vista» antes de encender las animaciones, y se acaban las de entrada
  function acaba(el) {
    if (!el.getAnimations) return;
    el.getAnimations({ subtree: true }).forEach(function (a) {
      var t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (t && t.iterations !== Infinity) try { a.finish(); } catch (e) { /* sin duración */ }
    });
  }
  var quietas = escenas.filter(function (s) { return !s.classList.contains("pv-escena"); });
  quietas.forEach(function (s) { s.classList.add("vista", "vista-pedida"); });
  raiz.classList.add("ilu-anima", "pv-vivo");
  if (M && M.saltar) raiz.classList.add("pv-muelle");
  quietas.forEach(acaba);

  // 2. Tocar: salto con peso (y la reacción propia de cada escena, clase «toca» un segundo)
  function salto(s) {
    if (!M || !M.saltar) return;
    [].forEach.call(s.querySelectorAll(".es-hop, .pv-hop, .ct-ella"), function (g, i) {
      setTimeout(function () { M.saltar(g, M.pieDe(g)); }, i * 90);
    });
  }
  function toca(s, soloSalto) {
    salto(s);
    if (soloSalto) return;
    s.classList.remove("toca");
    void s.getBoundingClientRect();
    s.classList.add("toca");
    clearTimeout(s._t);
    s._t = setTimeout(function () { s.classList.remove("toca"); }, 1100);
  }
  escenas.forEach(function (s) {
    s.addEventListener("click", function () { toca(s); });   // solo con clic o toque: al pasar el ratón leyendo, no
  });

  // 3. En pantalla: los bucles corren; la primera llegada con el scroll (no con un ancla ni al cargar) saluda
  var saltando = !!location.hash, tSalto = setTimeout(function () { saltando = false; }, 1500), primera = true;
  function salta() { saltando = true; clearTimeout(tSalto); tSalto = setTimeout(function () { saltando = false; }, 1300); }
  w.addEventListener("hashchange", salta);
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('a[href^="#"]')) salta(); });
  var io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      var s = e.target;
      s.classList.toggle("en-pantalla", e.isIntersecting);
      if (!e.isIntersecting) return;
      if (!s.classList.contains("vista")) {   // escena propia: entra, y al acabar queda «hecha» (ya reacciona al tocarla)
        s.classList.add("vista");
        setTimeout(function () { s.classList.add("hecha"); }, parseFloat(s.getAttribute("data-dura")) || 2000);
      } else if (!s._llego) {
        s._llego = true;
        if (!primera && !saltando) setTimeout(function () { toca(s, true); }, 220);
      }
    });
    primera = false;
  }, { threshold: 0.35 });
  escenas.forEach(function (s) { io.observe(s); });

  // 4. Modo suave: los bucles, más lentos
  if (suave) d.addEventListener("animationstart", function (ev) {
    var t = ev.target;
    if (!t.closest || !t.closest("svg.dossier-ilu, svg.pv-escena")) return;
    t.getAnimations().forEach(function (a) {
      if (a.animationName === ev.animationName && a.effect.getComputedTiming().iterations === Infinity) a.playbackRate = 0.6;
    });
  });

  // 5. La mirada (como en ilustra.js): g.mn-ojos se va hacia el puntero y g.mn-cuerpo se inclina hacia él. Se escribe
  //    el atributo transform, así que ningún CSS anima esos dos grupos. Con el ratón, mientras se mueve; en táctil, un
  //    momento hacia el toque; con el teclado, hacia el botón o el enlace con el foco. Mientras mira, .pv-atento.
  var piezas = [];
  escenas.forEach(function (s) {
    [].forEach.call(s.querySelectorAll("g.mn-ojos, g.mn-cuerpo"), function (g) {
      var c = g.classList.contains("mn-cuerpo");
      piezas.push({ g: g, esc: s, cuerpo: c, x: 0, y: 0, tx: 0, ty: 0, piv: null,
        max: (parseFloat(g.getAttribute("data-mn-max")) || (c ? 2.5 : 1.5)) * (suave ? 0.6 : 1) });
    });
  });
  var px = null, py = null, ultimo = 0, raf = 0;
  function pide() { if (!raf) raf = requestAnimationFrame(paso); }
  function mira(x, y) { px = x; py = y; ultimo = performance.now(); pide(); }
  function paso() {
    raf = 0;
    var activo = px !== null && performance.now() - ultimo < (fino ? 2500 : 1400), sigue = activo;
    escenas.forEach(function (s) { s.classList.toggle("pv-atento", activo && s.classList.contains("en-pantalla")); });
    var vivas = piezas.filter(function (p) { return p.esc.classList.contains("en-pantalla") || p.x || p.y; });
    vivas.forEach(function (p) { // primero se lee todo…
      p.tx = p.ty = 0;
      if (!activo || !p.esc.classList.contains("en-pantalla")) return;
      if (p.cuerpo && !p.piv) { var b = p.g.getBBox(); p.piv = (b.x + b.width / 2).toFixed(1) + " " + (b.y + b.height).toFixed(1); }
      var r = p.g.getBoundingClientRect(), dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      var dist = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, dist / 240);
      if (p.cuerpo) p.tx = Math.max(-1, Math.min(1, dx / 500)) * p.max;
      else { p.tx = dx / dist * k * p.max; p.ty = dy / dist * k * p.max; }
    });
    vivas.forEach(function (p) { // …y luego se escribe
      p.x += (p.tx - p.x) * 0.14; p.y += (p.ty - p.y) * 0.14;
      if (Math.abs(p.tx - p.x) < 0.02 && Math.abs(p.ty - p.y) < 0.02) { p.x = p.tx; p.y = p.ty; } else sigue = true;
      if (!p.x && !p.y) p.g.removeAttribute("transform");
      else if (p.cuerpo) p.g.setAttribute("transform", "rotate(" + p.x.toFixed(2) + " " + p.piv + ")");
      else p.g.setAttribute("transform", "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ")");
    });
    if (sigue) pide();
    else if (!activo) escenas.forEach(function (s) { s.classList.remove("pv-atento"); });
  }
  if (piezas.length) {
    if (fino) w.addEventListener("pointermove", function (e) { mira(e.clientX, e.clientY); }, { passive: true });
    w.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") mira(e.clientX, e.clientY); }, { passive: true });
    d.addEventListener("focusin", function (e) {
      var a = e.target;
      try { if (!a.matches("a, button") || !a.matches(":focus-visible")) return; } catch (err) { return; }
      var r = a.getBoundingClientRect();
      mira(r.left + r.width / 2, r.top + r.height / 2);
    });
  }

  // 6. Al imprimir, todo en su sitio: las entradas acabadas y la mirada al frente
  w.addEventListener("beforeprint", function () {
    escenas.forEach(function (s) { s.classList.add("vista"); acaba(s); });
    piezas.forEach(function (p) { p.x = p.y = p.tx = p.ty = 0; p.g.removeAttribute("transform"); });
  });
})();
