/* v5 (457; 479; 485; 585): las escenas [data-escena] van por TIEMPO, no por scroll, en tres fases (Edu, 18/10 y 19/10):
   1. ENTRADA, una vez, al llegar a la franja central: su coreografía sd- (1000 ms, pausada por historia.css) de 0 a su
      reposo --sd-sale (1 si no lo tiene), a razón de --sd-dura por coreografía (10 s las fijas, 6 s las rodadas).
   2. TAREA COMPLETA en bucle (585, Edu 19/10): el programa --bucle de la escena (bucle.css), del reposo al reposo.
      Pasos: «A>B» la coreografía de A a B (B < A: hacia atrás), «A>B/T» en T s, «A>B/T+rs» y a la vez el puente rs-
      de 0 a 1, «rs/T» solo el puente, «espera/T». Entre dos pasos que no empalman (también al dar la vuelta) la
      coreografía salta y las rs- vuelven a 0 a la vez: el puente lo deja todo igual o tapado, y el salto no se ve.
      --bucle-quietas: sd- que se quedan en el reposo durante la tarea.
   3. SALIDA, al irse de la franja: termina la entrada al doble o vuelve al reposo por su camino (como mucho al doble,
      --bucle-acaba) y hace la salida: sd- de --sd-sale a 1 y/o las sx-, en --sx-dura (2 s si no se dice).
   Al volver, entrada otra vez; fuera de pantalla, parado en 0. Fase en data-fase. Con «reducir movimiento» o sin JS,
   el último fotograma quieto (rs- y sx- solo existen bajo html.sd-motor). No toca el scroll.
   658: con «reducir movimiento» ya no se para (movimiento.js); en el modo suave (html.mov-suave) todo va a 1/1,4.
   660: las curvas de los fotogramas clave van escritas (con var() se quedaban en lineal). */
(function () {
  var w = window, d = document, raiz = d.documentElement, mm = w.matchMedia;
  if (!mm || mm("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in w) || !raiz.getAnimations) return;
  raiz.classList.add("sd-motor");

  d.addEventListener("DOMContentLoaded", function () {
    var escenas = [].map.call(d.querySelectorAll("[data-escena]"), function (el) {
      return { el: el, fija: el.getAttribute("data-rango") !== "cover", reloj: 0, fase: "" };
    });
    function v(e, n, x) { var r = parseFloat(getComputedStyle(e.el).getPropertyValue(n)); return isNaN(r) ? x : r; }
    // una sola llamada a getAnimations por paso (cada una obliga a recalcular estilos) y de ahí las sd-, rs- y sx-
    function todas(e) { return e.el.getAnimations({ subtree: true }); }
    function anims(t, pre) {
      return t.filter(function (a) { return a.animationName && a.animationName.indexOf(pre) === 0; });
    }
    function fase(e, f) { e.fase = f; if (f) e.el.setAttribute("data-fase", f); else e.el.removeAttribute("data-fase"); }
    function ve(lista, t, vel) { // pone las animaciones en t (0-1 de 1000 ms); con vel, las reproduce desde ahí
      if (w.movSinRebote) lista.forEach(w.movSinRebote); // 660: modo suave sin muelles (movimiento.js)
      // (585) Sin esperas pendientes: al reproducir, se fija el startTime (arranca ya, en t); con play(), si algo leía
      // las animaciones antes del fotograma siguiente, WebKit a veces las daba por acabadas. Al parar, primero la pausa
      // y luego el tiempo (al revés, la pausa se quedaba con el instante del fotograma siguiente y no con t).
      var ahora = d.timeline && d.timeline.currentTime;
      lista.forEach(function (a) {
        if (!vel) { a.pause(); a.currentTime = t * 1000; return; }
        a.playbackRate = vel;
        if (ahora != null) a.startTime = ahora - t * 1000 / vel; else { a.currentTime = t * 1000; a.play(); }
      });
    }
    function donde(t, pre) { var a = anims(t, pre || "sd-")[0]; return a ? Math.min(1, Math.max(0, (a.currentTime || 0) / 1000)) : 0; }
    function lento() { return raiz.classList.contains("mov-suave") ? 1.4 : 1; }
    function dura(e) { return v(e, "--sd-dura", e.fija ? 10 : 6) * 1000 * lento(); }
    function luego(e, ms, f) { clearTimeout(e.reloj); e.reloj = setTimeout(f, Math.max(0, ms)); }
    // El programa del bucle: «0.91>0.48/1.6 rs/0.7 0.18>0.91» -> [{a, b, s, rs} | {tipo, s}]
    function programa(e) {
      var s = getComputedStyle(e.el).getPropertyValue("--bucle").replace(/["']/g, "").trim();
      if (!s) return null;
      var p = s.split(/\s+/).map(function (x) {
        var m = x.match(/^(?:(\d*\.?\d+)>(\d*\.?\d+)|(rs|espera))(?:\/(\d*\.?\d+))?(\+rs)?$/);
        if (!m) return null;
        return m[3] ? { tipo: m[3], s: parseFloat(m[4] || "1") } : { a: +m[1], b: +m[2], s: m[4] ? +m[4] : null, rs: !!m[5] };
      });
      return p.indexOf(null) < 0 && p.length ? p : null;
    }

    function entra(e) {
      clearTimeout(e.reloj); fase(e, "entra");
      var reposo = v(e, "--sd-sale", 1), t = todas(e);
      ve(anims(t, "rs-"), 0); ve(anims(t, "sx-"), 0); ve(anims(t, "sd-"), 0, 1000 / dura(e));
      luego(e, reposo * dura(e), function () { tarea(e, reposo); });
    }
    // Las sd- que el bucle mueve: todas menos las de --bucle-quietas, que se quedan en el reposo durante la tarea (p. ej.
    // el cuerpo de Manila, cuyo aterrizaje aún coletea cuando empieza la tarea)
    function mueven(e, t) {
      return anims(t, "sd-").filter(function (a) { return !e.quietas || e.quietas.indexOf(a.animationName) < 0; });
    }
    function tarea(e, reposo) {
      fase(e, "tarea"); ve(anims(todas(e), "sd-"), reposo);
      e.quietas = getComputedStyle(e.el).getPropertyValue("--bucle-quietas").replace(/["']/g, "").trim().split(/[\s,]+/);
      e.prog = programa(e); e.paso = -1; e.pos = reposo;
      if (e.prog) paso(e, reposo);
    }
    function paso(e, reposo) {
      var i = e.paso = (e.paso + 1) % e.prog.length, x = e.prog[i], t = todas(e), sd = mueven(e, t), rs = anims(t, "rs-");
      var sigue = function () { paso(e, reposo); };
      var s = x.s * lento();
      if (x.tipo === "espera") return luego(e, s * 1000, sigue);
      if (x.tipo === "rs") {
        ve(rs, 0, 1 / s);
        return luego(e, s * 1000, function () { ve(anims(todas(e), "rs-"), 1); sigue(); });
      }
      if (Math.abs(x.a - e.pos) > 1e-4) { ve(rs, 0); } // no empalma: salta, y el puente vuelve a 0
      var ms = (x.s != null ? x.s * 1000 * lento() : Math.abs(x.b - x.a) * dura(e)) || 1;
      ve(sd, x.a, (x.b - x.a) * 1000 / ms);
      if (x.rs) ve(rs, 0, 1000 / ms);
      luego(e, ms, function () {
        var l = todas(e); ve(mueven(e, l), x.b); if (x.rs) ve(anims(l, "rs-"), 1);
        e.pos = x.b; sigue();
      });
    }
    function sale(e) {
      var antes = e.fase; clearTimeout(e.reloj); fase(e, "sale");
      var reposo = v(e, "--sd-sale", 1), l = todas(e), t = donde(antes === "tarea" ? mueven(e, l) : l);
      if (antes === "entra" && t < reposo) { // termina la entrada deprisa (al doble)
        ve(anims(l, "sd-"), t, 2000 / dura(e));
        return luego(e, (reposo - t) * dura(e) / 2, function () { ve(anims(todas(e), "sd-"), reposo); salida(e, todas(e), reposo); });
      }
      acaba(e, reposo, l, t);
    }
    // Desde la tarea, vuelve al reposo por su camino: hacia atrás si aún hacía el puente (deshace lo hecho desde el
    // reposo), hacia delante si ya repetía la tarea; como mucho al doble de su ritmo (Edu, 18/10: nada demasiado rápido)
    // y sin tardar más de --bucle-acaba si no hace falta correr más
    function acaba(e, reposo, l, t) {
      var sd = mueven(e, l), rs = anims(l, "rs-"), p = donde(l, "rs-");
      var natural = Math.abs(reposo - t) * dura(e), tope = v(e, "--bucle-acaba", 1.2) * 1000 * lento();
      var ms = Math.max(natural / 2, Math.min(natural, tope), p * 600);
      if (ms < 20) { ve(sd, reposo); ve(rs, 0); return salida(e, l, reposo); }
      ve(sd, t, (reposo - t) * 1000 / ms);
      if (p > 0) ve(rs, p, -p * 1000 / ms);
      luego(e, ms + 20, function () { var n = todas(e); ve(anims(n, "sd-"), reposo); ve(anims(n, "rs-"), 0); salida(e, n, reposo); });
    }
    function salida(e, t, reposo) {
      var sx = anims(t, "sx-"), sxd = v(e, "--sx-dura", 2) * 1000 * lento();
      if (reposo < 1) ve(anims(t, "sd-"), reposo, 1000 / dura(e));
      if (sx.length) ve(sx, 0, 1000 / sxd);
    }
    function para(e) { var t = todas(e); clearTimeout(e.reloj); fase(e, ""); ve(anims(t, "rs-"), 0); ve(anims(t, "sx-"), 0); ve(anims(t, "sd-"), 0); }

    // La franja central (del 48 % al 52 % de la ventana): la escena que la cruza es la única que está «en escena»
    var franja = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        escenas.forEach(function (e) {
          if (e.el !== x.target) return;
          if (x.isIntersecting) { if (e.fase !== "entra" && e.fase !== "tarea") entra(e); }
          else if (e.fase === "entra" || e.fase === "tarea") sale(e);
        });
      });
    }, { rootMargin: "-48% 0px -48% 0px" });
    var fuera = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        escenas.forEach(function (e) { if (e.el === x.target && !x.isIntersecting && e.fase) para(e); });
      });
    });
    // al cargar ya están todas en 0 y en pausa (historia.css): solo se para la que estaba en marcha (485)
    escenas.forEach(function (e) { franja.observe(e.el); fuera.observe(e.el); });    // Si un cambio de ancho cambia las animaciones (otro animation-name), la escena en curso vuelve a entrar
    // (solo el ancho: en el móvil, la barra del navegador cambia el alto al hacer scroll)
    var t = 0, ancho = w.innerWidth;
    w.addEventListener("resize", function () {
      if (w.innerWidth === ancho) return;
      ancho = w.innerWidth; clearTimeout(t);
      t = setTimeout(function () { escenas.forEach(function (e) { if (e.fase === "entra" || e.fase === "tarea") entra(e); }); }, 250);
    }, { passive: true });
  });
})();
