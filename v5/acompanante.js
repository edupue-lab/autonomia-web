(function () {
  var w = window, d = document, raiz = d.documentElement;
  var el = d.querySelector("[data-acompanante]");
  if (!el || !("IntersectionObserver" in w) || !w.matchMedia) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ancho = matchMedia("(min-width: 87rem)");
  var pendulo = el.querySelector(".ac-pendulo");
  raiz.classList.add("ac-on");

  var escenas = [].filter.call(d.querySelectorAll(".ilu, [data-manila]"), function (s) {
    return !el.contains(s) && (s.hasAttribute("data-manila") || s.querySelector(".mn-cuerpo"));
  });
  var vistas = new Set(), reloj = 0, fuera = true;
  function pon(ocultar) {
    clearTimeout(reloj);
    if (ocultar) { fuera = true; el.classList.add("ac-fuera"); return; }
    reloj = setTimeout(function () { fuera = w.scrollY < 120; el.classList.toggle("ac-fuera", fuera); if (!fuera) pide(); }, 450);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) vistas.add(e.target); else vistas.delete(e.target); });
    pon(vistas.size > 0);
  }, { rootMargin: "-12% 0px -12% 0px" });
  escenas.forEach(function (s) { io.observe(s); });
  var io2 = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) vistas.add(e.target); else vistas.delete(e.target); });
    pon(vistas.size > 0);
  }, { rootMargin: "0px 0px -40% 0px" });
  [].forEach.call(d.querySelectorAll(".panel"), function (s) { io2.observe(s); });

  var ang = 0, vel = 0, yAnt = w.scrollY, tAnt = 0, raf = 0, baja = 0;
  function pide() { if (!raf) raf = requestAnimationFrame(paso); }
  function paso(t) {
    raf = 0;
    if (!ancho.matches || fuera) { ang = vel = 0; return; }
    var y = w.scrollY, dt = Math.min(64, t - (tAnt || t)) || 16, v = (y - yAnt) / dt;
    yAnt = y; tAnt = t;
    var max = Math.max(1, raiz.scrollHeight - w.innerHeight);
    baja = Math.round(y / max * 22 * 10) / 10;
    var objetivo = Math.max(-2.5, Math.min(2.5, -v * 1.6));
    vel += (objetivo - ang) * 0.08; vel *= 0.86; ang += vel;
    pendulo.style.transform = "translateY(" + baja + "svh) rotate(" + ang.toFixed(2) + "deg)";
    if (Math.abs(vel) > 0.005 || Math.abs(objetivo - ang) > 0.02) pide(); else tAnt = 0;
  }
  w.addEventListener("scroll", function () { if (!fuera) pide(); }, { passive: true });
})();
