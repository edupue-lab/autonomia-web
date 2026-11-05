/* Portada v5, «interfaces vivas» (empleado 833, diseñador 1; pedido de Edu «pe-interfaces-vivas», 29/10/2026). La
   respuesta que aún faltaba, con el estilo de vivo-portada.css y sin tocar las escenas ni sus bucles:
   1. Cada Manila de las escenas da el saltito con peso al tocarla (Muelle.saltar, como la de la portada en fisica.js).
   2. El botón del tema avisa del cambio: su icono entra girando.
   3. El formulario de contacto: el error se dice con palabras debajo de su campo (y una sacudida de 4 px), la carga
      con «Enviando…» y un trazo de boli que va y viene, y cuando ya está todo, Manila del contacto lo celebra: abre su
      carpeta, levanta la mano y da un saltito.
   En el modo suave (html.mov-suave) y con «reducir movimiento», Muelle.quieto() deja los saltos fuera; el texto del
   error, el estado de carga y la mano levantada se ven igual. Sin JavaScript, el formulario es el de siempre. Solo
   `translate` y `scale` (Muelle) y clases: nunca `transform` en línea. */
(function () {
  "use strict";
  var d = document, raiz = d.documentElement, M = window.Muelle;

  // Pone una clase un momento (y la vuelve a poner si ya estaba, para que su animación empiece de nuevo)
  function pulso(el, clase, ms) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
    clearTimeout(el["vivo-" + clase]);
    el["vivo-" + clase] = setTimeout(function () { el.classList.remove(clase); }, ms);
  }
  function salta(cuerpo) {
    if (!M || M.quieto() || !cuerpo) return;
    try { M.saltar(cuerpo, M.pieDe(cuerpo)); } catch (err) { /* sin caja medible (oculta): no salta */ }
  }

  // 1. Las Manilas de las escenas, con peso (la de la portada ya lo hace fisica.js; en el táctil, su salto de CSS al
  //    tocarla sobraría, y vivo-portada.css lo quita con html.vivo-fis)
  if (M) {
    raiz.classList.add("vivo-fis");
    [].forEach.call(d.querySelectorAll("[data-ilustra] .mn-cuerpo"), function (c) {
      if (c.closest(".e1-dibujo")) return;
      // click y no pointerdown: en el móvil, empezar un scroll con el dedo encima no es tocarla
      c.addEventListener("click", function (e) { if (!e.button) salta(c); });
    });
  }

  // 2. El tema
  [].forEach.call(d.querySelectorAll("[data-tema]"), function (b) {
    b.addEventListener("click", function () { pulso(b, "vivo-cambia", 700); });
  });

  // 3. El formulario de contacto
  var form = d.querySelector(".formulario");
  if (!form) return;
  var boton = form.querySelector('[type="submit"]'), ct = d.querySelector(".ct-manila");
  var FALTA = { "f-nombre": "Falta tu nombre.", "f-telefono": "Falta un teléfono para llamarte.",
                "f-privacidad": "Marca la casilla para que podamos llamarte." };
  var MAL = { "f-telefono": "Revisa el teléfono, porque necesitamos un número al que podamos llamarte." };
  var primero = null, listo = false, enviando = false, textoBoton = boton ? boton.textContent : "";

  // (901, WEB-M03) El desplegable «Prefiero que me llaméis» se abre solo cuando te han traído a él (#formulario, desde
  // el dossier, oficinas o «Volver al formulario») y cuando ya tiene algo escrito (al volver atrás desde la privacidad,
  // el navegador repone lo escrito), con el primer campo a la vista. Si no, sigue plegado bajo el WhatsApp.
  var plegable = form.closest("details");
  function escrito() {
    return [].some.call(form.querySelectorAll("input[type=text], input[type=tel], textarea"), function (x) {
      return x.name !== "web" && x.value.trim();
    });
  }
  function abreSiToca(porEnlace) {
    if (!plegable) return;
    var traido = location.hash === "#formulario";
    if (!traido && !escrito()) return;
    plegable.open = true;
    if (traido && porEnlace) requestAnimationFrame(function () { plegable.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  abreSiToca(true);
  window.addEventListener("hashchange", function () { abreSiToca(true); });
  window.addEventListener("pageshow", function () { abreSiToca(false); });
  window.addEventListener("load", function () { if (location.hash === "#formulario") abreSiToca(true); });

  function nota(c, campo) {
    var id = c.id + "-error", p = d.getElementById(id);
    if (!p) {
      p = d.createElement("p");
      p.className = "campo-error";
      p.id = id;
      p.hidden = true;
      campo.appendChild(p);
    }
    return p;
  }
  function describe(c, id, si) {
    var ids = (c.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (x) { return x && x !== id; });
    if (si) ids.push(id);
    if (ids.length) c.setAttribute("aria-describedby", ids.join(" ")); else c.removeAttribute("aria-describedby");
  }
  function marca(c, mal) {
    var campo = c.closest(".campo");
    if (!campo || !c.id) return;
    var p = nota(c, campo);
    if (mal) {
      // (901) Un teléfono escrito pero sin sus 9 a 15 cifras se avisa aquí, con la misma regla y la misma frase que el
      // servidor (validar() en web/servidor.py), en vez de llevar a otra página y perder lo escrito.
      p.textContent = c.validity.patternMismatch && MAL[c.id] ? MAL[c.id] : FALTA[c.id] || c.validationMessage;
      p.hidden = false;
      c.setAttribute("aria-invalid", "true");
      describe(c, p.id, true);
      campo.classList.add("vivo-mal");
      pulso(campo, "vivo-sacude", 400);
    } else if (campo.classList.contains("vivo-mal")) {
      p.hidden = true;
      c.removeAttribute("aria-invalid");
      describe(c, p.id, false);
      campo.classList.remove("vivo-mal");
    }
  }
  // El navegador avisa de cada campo mal con «invalid» (no sube: se escucha en captura). Su globo se cambia por el
  // texto bajo el campo, y el foco va al primero.
  form.addEventListener("invalid", function (e) {
    var c = e.target;
    if (!c.closest || !c.closest(".campo")) return;
    e.preventDefault();
    marca(c, true);
    if (!primero) {
      primero = c;
      setTimeout(function () { if (primero) primero.focus(); primero = null; }, 0);
    }
  }, true);

  function celebra() {
    if (!ct) return;
    pulso(ct, "vivo-celebra", 1600);
    salta(ct.querySelector(".mn-cuerpo"));
  }
  function revisa(e) {
    var c = e.target;
    if (c && c.validity && c.validity.valid) marca(c, false);
    // Leer validity no dispara «invalid» (checkValidity sí): así no salen errores mientras se escribe
    var ahora = [].every.call(form.querySelectorAll("[required]"), function (x) { return x.validity.valid; });
    if (ahora && !listo) celebra();
    listo = ahora;
  }
  form.addEventListener("input", revisa);
  form.addEventListener("change", revisa);

  function quitaCarga() {
    enviando = false;
    if (!boton) return;
    boton.classList.remove("vivo-enviando");
    boton.removeAttribute("aria-disabled");
    boton.textContent = textoBoton;
    boton.style.minWidth = "";
  }
  // (901, WEB-M01 y caidas-11) El envío va con fetch y la página no se va: si se corta la red o no contesta en 15 s,
  // lo escrito sigue en su sitio, el botón vuelve a estar listo y debajo se dice qué ha pasado; los «no» del servidor
  // (400, 413 y 429) salen ahí mismo con su frase. Si llega, Manila lo celebra y se pasa a gracias: la de este sitio, o
  // la de la web pública si el formulario va a otro origen (la copia de GitHub Pages lo manda al Funnel, con CORS).
  // Sin fetch, el envío de siempre; el campo trampa y los límites siguen en el servidor.
  var ESPERA = 15000, aviso = null;
  var AVISO_RED = "No nos ha llegado porque se ha cortado la conexión. Tus datos siguen aquí, así que puedes volver a " +
                  "intentarlo";
  var wa = d.querySelector('.contacto-directo a[href^="https://wa.me/"]');
  var conFetch = !!(boton && window.fetch && window.AbortController && window.URLSearchParams && window.FormData);

  function avisa(texto, ofreceWa) {
    if (!aviso) {
      aviso = d.createElement("p");
      aviso.className = "envio-error";
      aviso.id = "envio-error";
      aviso.setAttribute("role", "alert");
      boton.parentNode.insertBefore(aviso, boton.nextSibling);
    }
    aviso.hidden = true;
    aviso.textContent = "";
    describe(boton, aviso.id, !!texto);
    if (!texto) return;
    aviso.appendChild(d.createTextNode(texto));
    if (ofreceWa && wa) {
      var a = d.createElement("a");
      a.href = wa.href;
      a.rel = "noopener";
      a.textContent = "escribirnos por WhatsApp";
      aviso.appendChild(d.createTextNode(" o "));
      aviso.appendChild(a);
      aviso.appendChild(d.createTextNode("."));
    } else if (ofreceWa) {
      aviso.appendChild(d.createTextNode(" dentro de un momento."));
    }
    void aviso.offsetWidth;   // vuelve a entrar con su animación si ya estaba
    aviso.hidden = false;
  }
  function llega(accion) {
    var u = new URL(accion, location.href);
    var gracias = u.origin === location.origin ? new URL("gracias.html", u) : new URL("/gracias.html", location.href);
    celebra();
    setTimeout(function () { location.assign(gracias.href); }, M && !M.quieto() ? 450 : 0);
  }
  function manda() {
    var ctrl = new AbortController(), reloj = setTimeout(function () { ctrl.abort(); }, ESPERA);
    var accion = form.action;
    fetch(accion, { method: "POST", body: new URLSearchParams(new FormData(form)), signal: ctrl.signal,
                    headers: { Accept: "application/json" }, credentials: "omit", cache: "no-store" })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { r: r, j: j || {} }; });
      })
      .then(function (x) {
        clearTimeout(reloj);
        // un servidor aún sin reiniciar contesta como siempre (303 a gracias): también ha llegado
        if (x.r.ok && (x.j.ok || (x.r.redirected && /gracias\.html$/.test(x.r.url)))) return llega(accion);
        quitaCarga();
        if (x.j.motivo) avisa(x.j.motivo, false); else avisa(AVISO_RED, true);
      })
      .catch(function () { clearTimeout(reloj); quitaCarga(); avisa(AVISO_RED, true); });
  }
  form.addEventListener("submit", function (e) {
    if (enviando) { e.preventDefault(); return; }   // un segundo toque no lo manda otra vez
    enviando = true;
    if (conFetch) e.preventDefault();
    if (!boton) return;
    if (aviso) avisa("");
    boton.style.minWidth = boton.offsetWidth + "px";  // el botón no encoge al cambiar el texto
    boton.textContent = "Enviando…";
    boton.setAttribute("aria-disabled", "true");
    boton.classList.add("vivo-enviando");
    if (conFetch) manda(); else celebra();
  });
  // Al volver atrás desde «gracias» (la página sale de la caché del navegador), el botón vuelve a estar listo
  window.addEventListener("pageshow", function (e) { if (e.persisted) quitaCarga(); });
})();
