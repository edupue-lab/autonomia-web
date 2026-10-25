/* Web oficial v3 (empleado 283): pestañas de oficios y barra de WhatsApp del móvil. Sin JavaScript, los oficios se
   ven todos seguidos y la barra se queda fija; nada se rompe. El tema claro/oscuro lo lleva tema.js. */
(function () {
  // (359) Las apariciones al bajar solo se activan si este archivo ha cargado (inicio.css, clase anima).
  document.documentElement.classList.add("anima");

  // Pestañas accesibles (flechas, Inicio y Fin), recordando el oficio elegido mientras dure la visita.
  var caja = document.querySelector("[data-pestanas]");
  if (caja) {
    var lista = caja.querySelector('[role="tablist"]');
    var pestanas = Array.prototype.slice.call(caja.querySelectorAll('[role="tab"]'));
    var paneles = pestanas.map(function (p) { return document.getElementById(p.getAttribute("aria-controls")); });
    var elegir = function (i, enfocar) {
      pestanas.forEach(function (p, j) {
        var activa = i === j;
        p.setAttribute("aria-selected", activa ? "true" : "false");
        p.tabIndex = activa ? 0 : -1;
        if (paneles[j]) paneles[j].hidden = !activa;
      });
      if (enfocar) pestanas[i].focus();
    };
    lista.hidden = false;
    caja.classList.add("con-pestanas");
    elegir(0, false);
    pestanas.forEach(function (p, i) {
      p.addEventListener("click", function () { elegir(i, false); });
      p.addEventListener("keydown", function (e) {
        var n = pestanas.length, destino = null;
        if (e.key === "ArrowRight") destino = (i + 1) % n;
        else if (e.key === "ArrowLeft") destino = (i - 1 + n) % n;
        else if (e.key === "Home") destino = 0;
        else if (e.key === "End") destino = n - 1;
        if (destino !== null) { e.preventDefault(); elegir(destino, true); }
      });
    });
  }

  // La barra del móvil se esconde mientras se ve el botón de la portada, sobre la banda azul de la ola y en el contacto.
  var barra = document.querySelector("[data-barra]");
  if (barra && "IntersectionObserver" in window) {
    var visibles = {};
    var observar = function (el, nombre) {
      if (!el) return;
      new IntersectionObserver(function (entradas) {
        visibles[nombre] = entradas[0].isIntersecting;
        barra.classList.toggle("oculta", !!(visibles.portada || visibles.contacto || visibles.ola));
      }).observe(el);
    };
    observar(document.querySelector(".portada .acciones"), "portada");
    observar(document.getElementById("contacto"), "contacto");
    observar(document.getElementById("la-ola"), "ola");
  }

  // (359) La cabecera flota con una sombra suave en cuanto se baja un poco.
  var cabecera = document.querySelector(".cabecera");
  if (cabecera) {
    var pintarCabecera = function () { cabecera.classList.toggle("flota", window.scrollY > 8); };
    window.addEventListener("scroll", pintarCabecera, { passive: true });
    pintarCabecera();
  }

  // (359) Las listas y la autorización aparecen al llegar a ellas, una sola vez. Si algo falla, se enseñan igual.
  var piezas = Array.prototype.slice.call(document.querySelectorAll("[data-aparece], .impreso"));
  var ver = function (el) { el.classList.add("visto"); };
  if (!("IntersectionObserver" in window)) {
    piezas.forEach(ver);
  } else if (piezas.length) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { ver(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    piezas.forEach(function (el) { io.observe(el); });
    window.addEventListener("load", function () {
      setTimeout(function () {
        piezas.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) ver(el);
        });
      }, 2500);
    });
  }
})();
