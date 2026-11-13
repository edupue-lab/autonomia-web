(function () {
  "use strict";
  var d = document, raiz = d.documentElement, M = window.Muelle;

  function pulso(el, clase, ms) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
    clearTimeout(el["vivo-" + clase]);
    el["vivo-" + clase] = setTimeout(function () { el.classList.remove(clase); }, ms);
  }
  function salta(cuerpo) {
    if (!M || M.quieto() || !cuerpo) return;
    try { M.saltar(cuerpo, M.pieDe(cuerpo)); } catch (err) {   }
  }

  if (M) {
    raiz.classList.add("vivo-fis");
    [].forEach.call(d.querySelectorAll("[data-ilustra] .mn-cuerpo"), function (c) {
      if (c.closest(".e1-dibujo")) return;
      c.addEventListener("click", function (e) { if (!e.button) salta(c); });
    });
  }

  [].forEach.call(d.querySelectorAll("[data-tema]"), function (b) {
    b.addEventListener("click", function () { pulso(b, "vivo-cambia", 700); });
  });

  var form = d.querySelector(".formulario");
  if (!form) return;
  var boton = form.querySelector('[type="submit"]'), ct = d.querySelector(".ct-manila");
  var FALTA = { "f-nombre": "Falta tu nombre.", "f-correo": "Falta tu correo, que es por donde te vamos a contestar.",
                "f-privacidad": "Marca la casilla para que podamos contestarte." };
  var MAL = { "f-correo": "Revisa el correo, porque no parece bien escrito." };
  var primero = null, listo = false, enviando = false, textoBoton = boton ? boton.textContent : "";

  var plegable = form.closest("details");
  function escrito() {
    return [].some.call(form.querySelectorAll("input[type=text], input[type=email], input[type=tel], textarea"), function (x) {
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
      p.textContent = (c.validity.patternMismatch || c.validity.typeMismatch) && MAL[c.id] ? MAL[c.id] : FALTA[c.id] || c.validationMessage;
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
    void aviso.offsetWidth;
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
        if (x.r.ok && (x.j.ok || (x.r.redirected && /gracias\.html$/.test(x.r.url)))) return llega(accion);
        quitaCarga();
        if (x.j.motivo) avisa(x.j.motivo, false); else avisa(AVISO_RED, true);
      })
      .catch(function () { clearTimeout(reloj); quitaCarga(); avisa(AVISO_RED, true); });
  }
  form.addEventListener("submit", function (e) {
    if (enviando) { e.preventDefault(); return; }
    enviando = true;
    if (conFetch) e.preventDefault();
    if (!boton) return;
    if (aviso) avisa("");
    boton.style.minWidth = boton.offsetWidth + "px";
    boton.textContent = "Enviando…";
    boton.setAttribute("aria-disabled", "true");
    boton.classList.add("vivo-enviando");
    if (conFetch) manda(); else celebra();
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) quitaCarga(); });
})();
