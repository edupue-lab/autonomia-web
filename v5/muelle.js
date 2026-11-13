(function () {
  "use strict";
  var mm = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function quieto() { return !!(mm && mm.matches) || document.documentElement.classList.contains("mov-suave"); }
  var ahora = function () { return window.performance ? performance.now() : Date.now(); };

  function crear(o) {
    var k = o.rigidez || 400, c = o.amortiguacion || 30, m = o.masa || 1, eps = o.precision || 0.1;
    var s = { valor: o.desde || 0, vel: 0, destino: o.desde || 0 };
    var raf = 0, antes = 0;
    function mover() { if (o.alMover) o.alMover(s.valor, s.vel); }
    function paso(t) {
      var dt = Math.min(0.064, Math.max(0, (t - antes) / 1000)) || 0.016, n = Math.ceil(dt / 0.004), h = dt / n;
      antes = t;
      for (var i = 0; i < n; i++) {
        s.vel += ((-k * (s.valor - s.destino) - c * s.vel) / m) * h;
        s.valor += s.vel * h;
      }
      var fin = Math.abs(s.valor - s.destino) < eps && Math.abs(s.vel) < eps * 20;
      if (fin) { s.valor = s.destino; s.vel = 0; }
      mover();
      if (fin) { raf = 0; if (o.alParar) o.alParar(s.valor); return; }
      raf = requestAnimationFrame(paso);
    }
    s.ir = function (destino, vel) {
      s.destino = destino;
      if (vel != null) s.vel = vel;
      if (quieto()) { s.poner(destino); if (o.alParar) o.alParar(destino); return s; }
      if (!raf) { antes = ahora(); raf = requestAnimationFrame(paso); }
      return s;
    };
    s.poner = function (v) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      s.valor = s.destino = v; s.vel = 0; mover();
      return s;
    };
    return s;
  }

  function seguidor() {
    var pts = [];
    return {
      anota: function (x) {
        var t = ahora();
        pts.push([t, x]);
        while (pts.length > 2 && t - pts[0][0] > 100) pts.shift();
      },
      vel: function () {
        if (pts.length < 2) return 0;
        var a = pts[0], b = pts[pts.length - 1], dt = (b[0] - a[0]) / 1000;
        return dt > 0 ? (b[1] - a[1]) / dt : 0;
      }
    };
  }

  function proyectar(vel) { return (vel / 1000) * 0.998 / (1 - 0.998); }

  function goma(sobra, tope) {
    var c = 0.55, a = Math.abs(sobra);
    return (a * tope * c) / (tope + c * a) * (sobra < 0 ? -1 : 1);
  }

  function pieDe(el) {
    var cs = getComputedStyle(el), o = cs.transformOrigin.split(" ").map(parseFloat), w, h, x0 = 0, y0 = 0;
    if (el.getBBox && el.ownerSVGElement) {
      var b = el.getBBox();
      w = b.width; h = b.height;
      if (cs.transformBox === "view-box") { x0 = b.x; y0 = b.y; }
    } else { w = el.offsetWidth; h = el.offsetHeight; }
    return { alto: h, pie: [x0 + w / 2 - (o[0] || 0), y0 + h - (o[1] || 0)] };
  }

  var saltando = typeof WeakMap === "function" ? new WeakMap() : null;
  function saltar(el, o) {
    if (quieto() || !el || !el.animate) return null;
    o = o || {};
    var alto = o.alto || 40, pie = o.pie || [0, 0], previo = saltando && saltando.get(el);
    if (previo && previo.playState === "running") return previo;
    var marcos = [], y = 0, v = 0, k = 170, c = 9, h = 1 / 240, t = 0, n = 0;
    function marco(sy, sx, dy) {
      marcos.push({ scale: sx.toFixed(4) + " " + sy.toFixed(4),
                    translate: (pie[0] * (1 - sx)).toFixed(2) + "px " + (pie[1] * (1 - sy) + dy).toFixed(2) + "px" });
    }
    for (var i = 0; i <= 5; i++) { var q = Math.sin((i / 5) * Math.PI / 2) * 0.08; marco(1 - q, 1 + q * 0.6, 0); }
    y = 0; v = -alto * 0.15 * Math.sqrt(k);
    while (t < 1.4) {
      v += (-k * y - c * v) * h; y += v * h; t += h; n++;
      if (n % 4) continue;
      var hundido = Math.max(0, y) / alto, estira = Math.min(0.04, Math.max(0, -v) / (alto * 40));
      marco(1 - hundido * 3 + estira, 1 + hundido * 1.8 - estira * 0.5, Math.min(0, y));
      if (t > 0.3 && Math.abs(y) < alto * 0.002 && Math.abs(v) < alto * 0.05) break;
    }
    marco(1, 1, 0);
    var a = el.animate(marcos, { duration: (marcos.length - 1) * 1000 / 60, easing: "linear" });
    if (saltando) saltando.set(el, a);
    return a;
  }

  window.Muelle = { crear: crear, seguidor: seguidor, proyectar: proyectar, goma: goma, saltar: saltar, pieDe: pieDe,
                    quieto: quieto };
})();
