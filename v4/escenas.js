/* Escenas Calco nuevas de la v4 (empleado 456, ayudante A). La entrada y los bucles los marca ilustra.js con las clases
   «vista» y «en-pantalla»; aquí solo va la reacción al tocar o al pasar el ratón: la escena recibe «toca» durante un
   segundo y escenas.css dice qué hace cada una (un salto, un saludo, un toque al botón). Sin este archivo, nada cambia. */
(function () {
  if (!document.documentElement.classList || !window.matchMedia) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  [].forEach.call(document.querySelectorAll("svg.es"), function (s) {
    var t;
    function toca() {
      s.classList.remove("toca");
      void s.getBoundingClientRect();
      s.classList.add("toca");
      clearTimeout(t);
      t = setTimeout(function () { s.classList.remove("toca"); }, 1100);
    }
    s.addEventListener("click", toca);
    s.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") toca(); });
  });
})();
