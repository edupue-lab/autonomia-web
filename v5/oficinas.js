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

  function elige(n, foco) {
    pestanas.forEach(function (p, i) {
      var si = i === n;
      p.setAttribute("aria-selected", si ? "true" : "false");
      p.tabIndex = si ? 0 : -1;
      hojas[i].hidden = !si;
    });
    if (foco) pestanas[n].focus();
  }

  pestanas.forEach(function (p, i) {
    p.addEventListener("click", function () { elige(i, false); });
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
