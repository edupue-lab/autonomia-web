(function () {
  var raiz = document.documentElement;
  raiz.classList.add("js");
  var guardado = null;
  try { guardado = localStorage.getItem("autonomia-tema"); } catch (e) {}
  if (guardado === "dark") raiz.setAttribute("data-theme", "dark");

  function pintar(boton) {
    var oscuro = raiz.getAttribute("data-theme") === "dark";
    boton.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    var t = boton.querySelector(".tema-texto");
    if (t) t.textContent = oscuro ? "Claro" : "Oscuro";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", oscuro ? "#111419" : "#fafaf8");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var botones = document.querySelectorAll("[data-tema]");
    Array.prototype.forEach.call(botones, function (boton) {
      pintar(boton);
      boton.addEventListener("click", function () {
        var oscuro = raiz.getAttribute("data-theme") === "dark";
        if (oscuro) raiz.removeAttribute("data-theme"); else raiz.setAttribute("data-theme", "dark");
        try { localStorage.setItem("autonomia-tema", oscuro ? "light" : "dark"); } catch (e) {}
        pintar(boton);
        boton.classList.remove("tema-cambia");
        void boton.offsetWidth;
        boton.classList.add("tema-cambia");
        clearTimeout(boton._tc);
        boton._tc = setTimeout(function () { boton.classList.remove("tema-cambia"); }, 500);
      });
    });
  });
})();
