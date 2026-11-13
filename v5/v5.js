(function () {
  var raiz = document.documentElement;
  raiz.classList.add("anima");
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hayIO = "IntersectionObserver" in window;

  function alVer(elementos, hacer, margen) {
    if (!hayIO) { elementos.forEach(hacer); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { hacer(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: margen || "0px 0px -8% 0px", threshold: 0.08 });
    elementos.forEach(function (el) { io.observe(el); });
  }

  var piezas = Array.prototype.slice.call(document.querySelectorAll("[data-sube]"));
  var porSeccion = new Map();
  piezas.forEach(function (el) {
    var s = el.closest("section, footer") || document.body;
    var n = porSeccion.get(s) || 0;
    porSeccion.set(s, n + 1);
    el.style.setProperty("--retraso", Math.min(n, 3) * 40 + "ms");
  });

  if (!quieto && hayIO) {
    var carpetas = Array.prototype.slice.call(document.querySelectorAll(".seccion-pestana, .panel"));
    carpetas.filter(function (c) { return c.getBoundingClientRect().top < window.innerHeight; })
      .forEach(function (c) { c.classList.add("abierta"); });
    raiz.classList.add("carpetas-io");
    alVer(carpetas, function (c) { c.classList.add("abierta"); }, "0px 0px 0px 0px");
  }
  var ver = function (el) { el.classList.add("visto"); };
  alVer(piezas, ver, "0px 0px 15% 0px");
  alVer(Array.prototype.slice.call(document.querySelectorAll(".impreso")), ver);
  window.addEventListener("load", function () {
    setTimeout(function () {
      piezas.filter(function (el) {
        var r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      }).forEach(ver);
    }, 1500);
  });

  var movil = document.querySelector("[data-movil]");
  if (movil) {
    alVer([movil], function (el) {
      if (quieto) { el.classList.add("preguntada", "pulsada", "respondida"); return; }
      setTimeout(function () { el.classList.add("preguntada"); }, 700);
      setTimeout(function () { el.classList.add("pulsada"); }, 1900);
      setTimeout(function () { el.classList.add("respondida"); }, 2600);
    }, "0px 0px -20% 0px");
  }

  var dia = document.querySelector("[data-dia]");
  if (dia) {
    var horas = Array.prototype.slice.call(dia.querySelectorAll("[data-hora]"));
    var lineas = Array.prototype.slice.call(dia.querySelectorAll("[data-linea]"));
    var libreta = dia.querySelector(".vista-antes");
    var modos = Array.prototype.slice.call(document.querySelectorAll(".dia-modo"));
    var interruptor = document.querySelector(".dia-interruptor");
    var fina = window.matchMedia("(hover: hover) and (pointer: fine)");
    var ventana = document.querySelector("[data-dia-ventana]");
    var ancha = window.matchMedia("(min-width: 64rem)");
    var vistas = horas.map(function (h) { return h.querySelector(".vista"); });
    var elegida = 0;
    var colocar = function () {
      var aqui = ventana && ancha.matches;
      vistas.forEach(function (v, j) { if (v) (aqui ? ventana : horas[j]).appendChild(v); });
      if (libreta) (aqui ? ventana : horas[elegida]).appendChild(libreta);
    };
    var activar = function (i) {
      if (i < 0) {
        horas.forEach(function (h, j) {
          h.classList.remove("activa");
          h.querySelector(".hora-boton").setAttribute("aria-expanded", "false");
          if (vistas[j]) vistas[j].classList.remove("elegida");
        });
        return;
      }
      elegida = i;
      horas.forEach(function (h, j) {
        h.classList.toggle("activa", i === j);
        h.querySelector(".hora-boton").setAttribute("aria-expanded", i === j ? "true" : "false");
        if (vistas[j]) vistas[j].classList.toggle("elegida", i === j);
      });
      lineas.forEach(function (l, j) { l.classList.toggle("subrayada", i === j); });
      if (libreta && !(ventana && ancha.matches)) horas[i].appendChild(libreta);
    };
    var ponerModo = function (modo) {
      dia.setAttribute("data-modo", modo);
      if (ventana) ventana.setAttribute("data-modo", modo);
      modos.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-modo") === modo ? "true" : "false"); });
    };
    if (interruptor) interruptor.hidden = false;
    ponerModo("ahora");
    var fijas = getComputedStyle(document.documentElement).getPropertyValue("--sd-on").trim() === "1";
    activar(fijas && !ancha.matches ? -1 : 0);
    colocar();
    if (ancha.addEventListener) ancha.addEventListener("change", colocar);
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

  var barra = document.querySelector("[data-barra]");
  if (barra && hayIO) {
    var visibles = {};
    var debajo = new Set();
    var otros = new Set();
    var pintar = function () {
      var oculta = !!(visibles.portada || visibles.contacto || debajo.size || otros.size);
      barra.classList.toggle("oculta", oculta);
      barra.inert = oculta;
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
    var botones = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) otros.add(e.target); else otros.delete(e.target); });
      pintar();
    });
    Array.prototype.forEach.call(document.querySelectorAll(".boton-wa"), function (b) {
      if (!barra.contains(b)) botones.observe(b);
    });
    var franja = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) debajo.add(e.target); else debajo.delete(e.target); });
      pintar();
    }, { rootMargin: "-82% 0px 0px 0px" });
    Array.prototype.forEach.call(document.querySelectorAll("main h2, main h3, .queno-frase, .ola-frase, .testimonio-principal blockquote, .panel-final, .paso-vista, .hora-cuando, .impreso-titulo, .vista"), function (el) {
      franja.observe(el);
    });
  }
})();
