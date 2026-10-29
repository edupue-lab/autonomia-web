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
  var primero = null, listo = false, enviando = false, textoBoton = boton ? boton.textContent : "";

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
      p.textContent = FALTA[c.id] || c.validationMessage;
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
  form.addEventListener("submit", function (e) {
    if (enviando) { e.preventDefault(); return; }   // un segundo toque no lo manda otra vez
    enviando = true;
    if (!boton) return;
    boton.style.minWidth = boton.offsetWidth + "px";  // el botón no encoge al cambiar el texto
    boton.textContent = "Enviando…";
    boton.setAttribute("aria-disabled", "true");
    boton.classList.add("vivo-enviando");
    celebra();
  });
  // Al volver atrás desde «gracias» (la página sale de la caché del navegador), el botón vuelve a estar listo
  window.addEventListener("pageshow", function (e) { if (e.persisted) quitaCarga(); });
})();
