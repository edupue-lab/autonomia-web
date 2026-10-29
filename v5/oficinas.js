/* v5 (605): las pestañas de los puestos de oficinas.html. Sin JavaScript se ven todas las hojas seguidas; con él,
   cada puesto es una pestaña (patrón de pestañas de WAI-ARIA: flechas, Inicio y Fin) y solo se ve la hoja elegida. */
(function () {
  var caja = document.querySelector("[data-puestos]");
  if (!caja) return;
  var fila = caja.querySelector(".puestos-pestanas");
  var pestanas = [].slice.call(caja.querySelectorAll(".puesto-pestana"));
  var hojas = pestanas.map(function (p) { return document.getElementById(p.getAttribute("aria-controls")); });
  if (!fila || !pestanas.length || hojas.indexOf(null) !== -1) return;

  fila.hidden = false;
  fila.setAttribute("role", "tablist");
  fila.setAttribute("aria-label", "Puestos de la oficina");
  caja.classList.add("con-pestanas");
  pestanas.forEach(function (p, i) {
    p.setAttribute("role", "tab");
    hojas[i].setAttribute("role", "tabpanel");
    hojas[i].setAttribute("aria-labelledby", p.id);
    hojas[i].tabIndex = 0;
  });

  /* (833) Al tocar una pestaña, su hoja sale delante desde el lado en que está (la de la derecha llega por la derecha)
     y, si lleva un visto a bolígrafo, se dibuja. Con WAAPI, así un toque seguido corta el anterior sin saltos. Con el
     teclado se cambia al momento (se usa muchas veces seguidas); con «reducir movimiento» o el modo suave, solo un
     fundido corto. */
  var actual = 0, anim = null, trazo = null, raiz = document.documentElement;
  var quietoGuardado = false;
  try { quietoGuardado = localStorage.getItem("autonomia-movimiento") === "quieto"; } catch (e) { /* sin almacenamiento */ }
  function suave() {
    return raiz.classList.contains("mov-suave") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function saca(hoja, lado) {
    if (!hoja.animate || quietoGuardado) return;
    if (anim) anim.cancel();
    if (trazo) trazo.cancel();
    var quieto = suave();
    anim = hoja.animate(quieto ? [{ opacity: 0.4 }, { opacity: 1 }]
      : [{ opacity: 0, transform: "translateX(" + (lado * 16) + "px)" }, { opacity: 1, transform: "none" }],
      { duration: quieto ? 160 : 280, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    var visto = hoja.querySelector(".es-traza");
    if (visto && visto.animate) trazo = visto.animate([{ strokeDashoffset: 106 }, { strokeDashoffset: 0 }],
      { duration: quieto ? 1 : 420, delay: quieto ? 0 : 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
  }

  function elige(n, foco, toque) {
    var antes = actual;
    pestanas.forEach(function (p, i) {
      var si = i === n;
      p.setAttribute("aria-selected", si ? "true" : "false");
      p.tabIndex = si ? 0 : -1;
      hojas[i].hidden = !si;
    });
    actual = n;
    if (foco) pestanas[n].focus();
    if (toque && n !== antes) saca(hojas[n], n > antes ? 1 : -1);
  }

  pestanas.forEach(function (p, i) {
    p.addEventListener("click", function () { elige(i, false, true); });
    p.addEventListener("keydown", function (e) {
      var n = pestanas.length, j = -1;
      if (e.key === "ArrowRight") j = (i + 1) % n;
      else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      if (j < 0) return;
      e.preventDefault();
      elige(j, true);
    });
  });
  elige(0, false);
})();
