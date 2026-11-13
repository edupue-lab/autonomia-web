(function () {
  var raiz = document.documentElement;
  function barra() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", raiz.getAttribute("data-theme") === "dark" ? "#15140f" : "#fafaf8");
  }
  document.addEventListener("DOMContentLoaded", function () {
    barra();
    [].forEach.call(document.querySelectorAll("[data-tema]"), function (b) { b.addEventListener("click", barra); });
  });
})();
