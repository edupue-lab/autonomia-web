/* «Del correo al trabajo hecho» (sección #que-hace). Eliges oficio (pestañas), eliges uno de los correos de su
   bandeja y lo ves paso a paso: cada paso se marca con el boli, Manila saca una hoja del sobre en la escena (.dm-ilu)
   y al final se abre la carpeta «Para ti» con el resultado. Se puede avanzar a mano («Siguiente paso») o verlo
   seguido. Sin este archivo se ve el primer correo de cada oficio terminado; con «reducir movimiento», todo cambia
   al momento y no arranca solo. Solo mueve transform, opacity y stroke-dashoffset (en demo.css). */
(function () {
  var demo = document.querySelector(".demo");
  if (!demo) return;
  var escena = demo.querySelector(".demo-escena");
  var ilu = escena.querySelector(".dm-ilu");
  var pestanas = [].slice.call(demo.querySelectorAll('[role="tab"]'));
  var bandejas = pestanas.map(function (p) { return document.getElementById(p.getAttribute("aria-controls")); });
  var casos = [].slice.call(demo.querySelectorAll(".demo-caso"));
  var mandos = demo.querySelector(".demo-mandos");
  var bSig = demo.querySelector("[data-demo-sig]");
  var bSeguido = demo.querySelector("[data-demo-seguido]");
  var bOtro = demo.querySelector("[data-demo-otro]");
  var aviso = demo.querySelector("[data-demo-aviso]");
  var hojas = ilu ? [].slice.call(ilu.querySelectorAll(".dm-hoja")) : [];
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var caso = null, paso = 0, total = 0, fin = false, auto = null, visto = false, oficio = 0, mano = false, vuelta = null;

  // Las marcas a boli de los pasos y la flecha de la nota se dibujan aquí (sin JS, demo.css pone una marca sencilla).
  var NS = document.querySelector("svg").namespaceURI; // el de SVG, sin escribir su dirección
  var VISTOS = ["M5 17c2.5 1.8 4.3 3.9 6 7 3.5-8 9-14.5 15-19", "M5 16c2.8 2 4.4 4.2 6.2 7.4 3.2-7.6 8.7-14 14.8-18.6",
    "M5.5 17.5c2.3 1.6 4 3.6 5.8 6.6 3.7-8.3 9-14.2 14.7-19.3"];
  function dibujo(clase, caja, d) {
    var s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
    s.setAttribute("class", clase); s.setAttribute("viewBox", caja);
    s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    p.setAttribute("pathLength", "100"); p.setAttribute("d", d);
    s.appendChild(p);
    return s;
  }
  casos.forEach(function (c, ci) {
    [].forEach.call(c.querySelectorAll(".demo-pasos li"), function (li, i) {
      li.insertBefore(dibujo("demo-marca", "0 0 30 30", VISTOS[(i + ci) % 3]), li.firstChild);
    });
    [].forEach.call(c.querySelectorAll(".demo-archivos li"), function (li, j) { li.classList.add("a" + Math.min(j, 3)); });
    var nota = c.querySelector(".demo-nota");
    if (nota) nota.insertBefore(dibujo("demo-flecha", "0 0 120 46",
      "M114 6c-20 2-52 4-78 14C22 25 13 31 8 39m0 0c1-5 1-9 0-13m0 13c4-2 8-3 13-3"), nota.firstChild);
  });

  function para() { clearTimeout(auto); auto = null; bSeguido.textContent = "Verlo seguido"; bSeguido.setAttribute("aria-pressed", "false"); }

  var SALTOS = ["dm-hop", "dm-cambia", "dm-final"]; // las tres mueven .dm-salto: solo una a la vez
  // Repite una animación de reacción quitando y poniendo la clase.
  function reacciona(clase) {
    if (!ilu || quieto) return;
    ilu.classList.remove(clase);
    if (SALTOS.indexOf(clase) >= 0) SALTOS.forEach(function (c) { ilu.classList.remove(c); });
    void ilu.getBoundingClientRect();
    ilu.classList.add(clase);
  }

  function hoja(i, estado) { if (hojas[i]) hojas[i].setAttribute("data-e", estado); }

  // Pinta el estado (caso, paso, fin) en los pasos, la carpeta, la escena y los botones.
  function pintar(anunciar) {
    var tenia = document.activeElement; // si estaba en un mando que se esconde, el foco no puede quedarse en el aire
    var lis = caso.querySelectorAll(".demo-pasos li");
    [].forEach.call(lis, function (li, i) {
      li.classList.toggle("hecho", i < paso);
      li.classList.toggle("ahora", i === paso - 1 && !fin);
    });
    caso.classList.toggle("fin", fin);
    escena.setAttribute("data-fase", fin ? "fin" : paso ? "paso" : "espera");
    escena.classList.toggle("ultimo", paso >= total);
    hojas.forEach(function (h, i) {
      if (fin) hoja(i, i < Math.min(paso, hojas.length) ? "dentro" : "sobre");
      else hoja(i, i < paso ? "mesa" : "sobre");
    });
    bSeguido.hidden = fin;
    bOtro.hidden = !fin;
    bSig.textContent = fin ? "Repetir" : paso >= total ? "Ver el resultado" : paso ? "Siguiente paso" : "Empezar";
    // Con el teclado, al ver el resultado el foco pasa a la carpeta «Para ti» (el siguiente Tab, a «Repetir») en vez
    // de perderse con «Verlo seguido», que se esconde (fallo heredado de la v4).
    var nombre = caso.querySelector(".demo-carpeta-nombre");
    if (fin && nombre && (tenia === bSig || tenia === bSeguido)) {
      nombre.setAttribute("tabindex", "-1");
      nombre.focus();
    }
    if (!anunciar) return;
    if (fin) {
      var archivos = [].map.call(caso.querySelectorAll(".demo-archivos li"), function (li) {
        var tipo = li.querySelector(".demo-tipo").textContent;
        return li.textContent.replace(tipo, "").trim().toLowerCase();
      });
      aviso.textContent = "Listo. En la carpeta «Para ti, de AutonomIA» te ha dejado: " + archivos.join(", ") +
        ". Tú lo revisas y le das a enviar.";
    } else if (paso) {
      aviso.textContent = "Hecho: " + lis[paso - 1].textContent.trim();
    }
  }

  // Abre un caso desde el principio, sin animar hacia atrás.
  function abrir(nuevo, arrancar) {
    para();
    casos.forEach(function (c) { c.hidden = c !== nuevo; });
    caso = nuevo; paso = 0; fin = false;
    escena.setAttribute("data-oficio", caso.getAttribute("data-oficio"));
    total = caso.querySelectorAll(".demo-pasos li").length;
    escena.classList.add("sin-paso");
    pintar(false);
    void escena.offsetWidth;
    escena.classList.remove("sin-paso");
    aviso.textContent = "";
    if (arrancar && !quieto) seguido();
  }

  function avanzar(anunciar) {
    if (fin) return;
    if (paso < total) { paso++; reacciona("dm-hop"); }
    else { fin = true; reacciona("dm-final"); }
    pintar(anunciar);
  }

  function seguido() {
    visto = true;
    bSeguido.textContent = "Pausar";
    bSeguido.setAttribute("aria-pressed", "true");
    (function tic() {
      auto = setTimeout(function () {
        avanzar(false);
        if (fin) { para(); pintar(true); otraVez(); return; }
        tic();
      }, paso === 0 ? 700 : paso >= total ? 1300 : 1500);
    })();
  }

  /* 585 (Edu, 19/10: cada escena repite su tarea completa en bucle): mientras nadie toque la demo y la escena siga en
     el centro de la pantalla (motor.js le pone data-fase="tarea"), el resultado se queda unos segundos y el mismo
     correo vuelve a empezar. Sin «sin-paso»: las transiciones de siempre lo devuelven a su sitio (el visto del sobre se
     borra, la hoja del resultado se guarda dentro de Manila y la tapa se cierra; las hojas ya están ocultas dentro de
     ella y del sobre), así que no hay salto. Si alguien la toca, manda él y no vuelve a arrancar sola. */
  function otraVez() {
    clearTimeout(vuelta);
    if (mano || quieto) return;
    vuelta = setTimeout(function () {
      if (mano || !fin) return;
      if (demo.getAttribute("data-fase") !== "tarea") return otraVez();
      paso = 0; fin = false; aviso.textContent = "";
      pintar(false);
      vuelta = setTimeout(function () { if (!mano && !fin && !paso) seguido(); }, 1100);
    }, 4500);
  }
  function toca() { mano = true; clearTimeout(vuelta); }

  function correoDe(b) { return document.getElementById(b.getAttribute("aria-controls")); }

  function elegirCorreo(b, arrancar) {
    var lista = b.closest(".demo-mensajes");
    [].forEach.call(lista.querySelectorAll(".demo-mensaje"), function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
    abrir(correoDe(b), arrancar);
  }

  function elegirOficio(i, enfocar) {
    oficio = i;
    pestanas.forEach(function (p, j) {
      p.setAttribute("aria-selected", i === j ? "true" : "false");
      p.tabIndex = i === j ? 0 : -1;
      bandejas[j].hidden = i !== j;
    });
    if (enfocar) pestanas[i].focus();
    reacciona("dm-cambia");
    var elegido = bandejas[i].querySelector('.demo-mensaje[aria-pressed="true"]') || bandejas[i].querySelector(".demo-mensaje");
    elegirCorreo(elegido, true);
  }

  // Puesta en marcha: el modo con JS (clase .activa), el primer oficio y su primer correo esperando.
  demo.classList.add("activa");
  pestanas[0].parentNode.hidden = false;
  mandos.hidden = false;
  bandejas.forEach(function (b, j) { b.hidden = j !== 0; });
  abrir(correoDe(bandejas[0].querySelector(".demo-mensaje")), false);
  if (quieto) { paso = total; fin = true; pintar(false); }

  /* Altura fija: las cuatro bandejas reservan el alto de la más alta, medido a este ancho, para que las pestañas de
     oficio no muevan lo de debajo. Cada correo, en cambio, guarda SOLO su propio alto (ayudante H): la pantalla del
     correo y la carpeta del resultado comparten celda (demo.css), así que el caso ya mide lo que el mayor de sus pasos
     y de su resultado, al ancho que haya y al redimensionar, y los botones no saltan entre pasos de un mismo correo
     sin dejar papel vacío en los correos cortos. Se vuelve a medir al cambiar el ancho y al cargar las letras. */
  function reserva(grupo) {
    var ocultos = grupo.filter(function (el) { return el.hidden; });
    grupo.forEach(function (el) { el.style.minHeight = ""; el.hidden = false; });
    var alto = Math.max.apply(null, grupo.map(function (el) { return el.offsetHeight; }));
    ocultos.forEach(function (el) { el.hidden = true; });
    grupo.forEach(function (el) { el.style.minHeight = alto + "px"; });
  }
  var anchoMedido = 0;
  function reservaTodo() {
    var ancho = demo.offsetWidth;
    if (!ancho || ancho === anchoMedido) return;
    anchoMedido = ancho;
    reserva(bandejas);
  }
  reservaTodo();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { anchoMedido = 0; reservaTodo(); });
  var tAncho;
  window.addEventListener("resize", function () { clearTimeout(tAncho); tAncho = setTimeout(reservaTodo, 150); });

  pestanas.forEach(function (p, i) {
    p.addEventListener("click", function () { toca(); if (i !== oficio) elegirOficio(i, false); });
    p.addEventListener("keydown", function (e) {
      var n = pestanas.length, destino = null;
      if (e.key === "ArrowRight") destino = (i + 1) % n;
      else if (e.key === "ArrowLeft") destino = (i - 1 + n) % n;
      else if (e.key === "Home") destino = 0;
      else if (e.key === "End") destino = n - 1;
      if (destino !== null) { e.preventDefault(); toca(); elegirOficio(destino, true); }
    });
  });
  [].forEach.call(demo.querySelectorAll(".demo-mensaje"), function (b) {
    b.addEventListener("click", function () { visto = true; toca(); elegirCorreo(b, true); });
  });
  bSig.addEventListener("click", function () {
    visto = true; toca();
    if (fin) { abrir(caso, true); return; }
    para();
    avanzar(true);
  });
  bSeguido.addEventListener("click", function () {
    toca();
    if (auto) { para(); return; }
    if (fin) abrir(caso, false);
    seguido();
  });
  // 469: en el móvil, la elección de oficio y de correo va plegada tras un «Elegir otro oficio o correo» (la demo
  // arranca sola con el primer correo del tasador); así la escena llega antes y la página es más corta.
  var elige = demo.querySelector(".demo-elige"), plegar = null;
  if (elige && window.matchMedia && matchMedia("(max-width: 47.99rem)").matches) {
    elige.id = elige.id || "demo-elige";
    plegar = document.createElement("button");
    plegar.type = "button"; plegar.className = "demo-cambiar";
    plegar.setAttribute("aria-controls", elige.id);
    plegar.textContent = "Elegir otro oficio o correo";
    elige.parentNode.insertBefore(plegar, elige);
    var ponPlegada = function (si) {
      elige.classList.toggle("plegada", si);
      plegar.setAttribute("aria-expanded", si ? "false" : "true");
      if (!si) { anchoMedido = 0; reservaTodo(); }
    };
    ponPlegada(true);
    plegar.addEventListener("click", function () { ponPlegada(!elige.classList.contains("plegada")); });
  }
  bOtro.addEventListener("click", function () {
    toca();
    if (plegar && elige.classList.contains("plegada")) plegar.click();
    var b =bandejas[oficio].querySelector('.demo-mensaje[aria-pressed="true"]');
    var todos = [].slice.call(bandejas[oficio].querySelectorAll(".demo-mensaje"));
    var siguiente = todos[(todos.indexOf(b) + 1) % todos.length];
    elegirCorreo(siguiente, true);
    siguiente.focus();
  });

  // La primera vez que la escena entra en pantalla, el primer correo se pone en marcha solo.
  if (quieto || !("IntersectionObserver" in window)) return;
  var mirar = new IntersectionObserver(function (entradas) {
    if (entradas[0].isIntersecting) { mirar.disconnect(); if (!visto) seguido(); }
  }, { threshold: 0.35 });
  mirar.observe(escena);
})();
