(function () {
  var raiz = document.documentElement, antes = null;
  var b = document.querySelector("[data-imprime]");
  if (b && window.print) { b.hidden = false; b.addEventListener("click", function () { window.print(); }); }
  window.addEventListener("beforeprint", function () { antes = raiz.getAttribute("data-theme"); raiz.removeAttribute("data-theme"); });
  window.addEventListener("afterprint", function () { if (antes) raiz.setAttribute("data-theme", antes); antes = null; });
})();
