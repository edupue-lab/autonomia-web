/* Web oficial v4: entradas por partes al bajar, el día del tasador (lista con vista previa), el móvil que responde
   solo y la barra de WhatsApp del móvil. Sin este archivo la página se ve completa y quieta. El tema lo lleva
   ../tema.js; la demostración de los oficios, demo.js. */
(function () {
  var raiz = document.documentElement;
  raiz.classList.add("anima");
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hayIO = "IntersectionObserver" in window;

  // Al llegar a una pieza, una sola vez. Si no hay IntersectionObserver, todo se marca como visto.
  function alVer(elementos, hacer, margen) {
    if (!hayIO) { elementos.forEach(hacer); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { hacer(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: margen || "0px 0px -8% 0px", threshold: 0.08 });
    elementos.forEach(function (el) { io.observe(el); });
  }

  // 1. Entradas: título, texto y objeto de cada sección, con 80 ms de escalón dentro de la misma sección.
  var piezas = Array.prototype.slice.call(document.querySelectorAll("[data-sube]"));
  var porSeccion = new Map();
  piezas.forEach(function (el) {
    var s = el.closest("section, footer") || document.body;
    var n = porSeccion.get(s) || 0;
    porSeccion.set(s, n + 1);
    el.style.setProperty("--retraso", Math.min(n, 6) * 75 + "ms");
  });

  // 1 bis. Las carpetas que suben al entrar: si el navegador no tiene animaciones ligadas al scroll, las abre un
  // observador. Sin JavaScript no se pone .carpetas-io y todo queda en su sitio.
  var conScroll = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  if (!quieto && !conScroll && hayIO) {
    var carpetas = Array.prototype.slice.call(document.querySelectorAll(".seccion-pestana, .panel"));
    carpetas.forEach(function (c) {
      var r = c.getBoundingClientRect();
      if (r.top < window.innerHeight) c.classList.add("abierta");
    });
    raiz.classList.add("carpetas-io");
    alVer(carpetas, function (c) { c.classList.add("abierta"); }, "0px 0px 0px 0px");
  }
  var ver = function (el) { el.classList.add("visto"); };
  alVer(piezas, ver);
  alVer(Array.prototype.slice.call(document.querySelectorAll(".impreso")), ver);
  // Red de seguridad: lo que esté en pantalla al cargar se enseña aunque el observador no haya saltado.
  window.addEventListener("load", function () {
    setTimeout(function () {
      piezas.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) ver(el);
      });
    }, 1500);
  });

  // 2. Tu página: llega la pregunta, se pulsa «De siempre» y llega la respuesta.
  var movil = document.querySelector("[data-movil]");
  if (movil) {
    alVer([movil], function (el) {
      if (quieto) { el.classList.add("preguntada", "pulsada", "respondida"); return; }
      setTimeout(function () { el.classList.add("preguntada"); }, 700);
      setTimeout(function () { el.classList.add("pulsada"); }, 1900);
      setTimeout(function () { el.classList.add("respondida"); }, 2600);
    }, "0px 0px -20% 0px");
  }

  // 3. Un martes de un tasador: Antes / Con AutonomIA, y la vista previa de la hora elegida.
  var dia = document.querySelector("[data-dia]");
  if (dia) {
    var horas = Array.prototype.slice.call(dia.querySelectorAll("[data-hora]"));
    var lineas = Array.prototype.slice.call(dia.querySelectorAll("[data-linea]"));
    var libreta = dia.querySelector(".vista-antes");
    var modos = Array.prototype.slice.call(document.querySelectorAll(".dia-modo"));
    var interruptor = document.querySelector(".dia-interruptor");
    var fina = window.matchMedia("(hover: hover) and (pointer: fine)");
    var activar = function (i) {
      horas.forEach(function (h, j) {
        h.classList.toggle("activa", i === j);
        h.querySelector(".hora-boton").setAttribute("aria-expanded", i === j ? "true" : "false");
      });
      lineas.forEach(function (l, j) { l.classList.toggle("subrayada", i === j); });
      // La libreta de «Antes» va dentro de la fila elegida, para que en el móvil salga junto a su hora.
      if (libreta) horas[i].appendChild(libreta);
    };
    var ponerModo = function (modo) {
      dia.setAttribute("data-modo", modo);
      modos.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-modo") === modo ? "true" : "false"); });
    };
    if (interruptor) interruptor.hidden = false;
    ponerModo("ahora");
    activar(0);
    modos.forEach(function (b) {
      b.addEventListener("click", function () { ponerModo(b.getAttribute("data-modo")); });
    });
    horas.forEach(function (h, i) {
      var boton = h.querySelector(".hora-boton");
      boton.addEventListener("click", function () { activar(i); });
      boton.addEventListener("focus", function () { activar(i); });
      h.addEventListener("mouseenter", function () { if (fina.matches) activar(i); });
    });
  }

  // 4. La barra del móvil se esconde mientras se ve el botón de la portada y al llegar al contacto.
  var barra = document.querySelector("[data-barra]");
  if (barra && hayIO) {
    var visibles = {};
    var debajo = new Set();
    var otros = new Set();
    var pintar = function () {
      barra.classList.toggle("oculta", !!(visibles.portada || visibles.contacto || debajo.size || otros.size));
    };
    var observar = function (el, nombre) {
      if (!el) return;
      new IntersectionObserver(function (entradas) {
        visibles[nombre] = entradas[0].isIntersecting;
        pintar();
      }).observe(el);
    };
    observar(document.querySelector(".portada .acciones"), "portada");
    observar(document.getElementById("contacto"), "contacto");
    // Si ya hay otro botón de WhatsApp en pantalla, la barra sobra.
    var botones = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) otros.add(e.target); else otros.delete(e.target); });
      pintar();
    });
    Array.prototype.forEach.call(document.querySelectorAll(".boton-wa"), function (b) {
      if (!barra.contains(b)) botones.observe(b);
    });
    // Que no tape titulares: se aparta mientras un título o una frase grande pasa por la franja de abajo.
    var franja = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) debajo.add(e.target); else debajo.delete(e.target); });
      pintar();
    }, { rootMargin: "-82% 0px 0px 0px" });
    Array.prototype.forEach.call(document.querySelectorAll("main h2, main h3, .queno-frase, .ola-frase, .testimonio-principal blockquote, .panel-final, .pieza-vista, .hora-cuando, .impreso-titulo, .vista"), function (el) {
      franja.observe(el);
    });
  }
})();
