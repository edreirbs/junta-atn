/* La primera junta de Tom con la redacción de ATN.
   Sin frameworks. Habla con Supabase solo por sus funciones (rpc) y escucha la tabla muro.
   Todo texto de una persona se pinta con textContent. */
(function () {
  "use strict";

  var CFG = window.JUNTA_CONFIG || {};
  var NY = "America/New_York";
  var $ = function (id) { return document.getElementById(id); };
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Almacenamiento del dispositivo ---------- */
  function leer(k, defecto) {
    try { var v = localStorage.getItem(k); return v === null ? defecto : JSON.parse(v); } catch (e) { return defecto; }
  }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }

  var llave = leer("junta_llave", null);
  if (typeof llave !== "string" || llave.length < 30) {
    llave = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : fallbackUUID();
    guardar("junta_llave", llave);
  }
  function fallbackUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  var registro = leer("junta_registro", null);          // { nombre, modalidad } si ya se registró
  var votados = leer("junta_votados", []);              // ids de preguntas que este dispositivo ya votó
  if (!Array.isArray(votados)) votados = [];

  /* ---------- Llamadas a las funciones de la base ---------- */
  function rpc(fn, args) {
    return fetch(CFG.supabaseUrl + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "apikey": CFG.supabaseKey, "Content-Type": "application/json" },
      body: JSON.stringify(args || {})
    }).then(function (r) {
      if (!r.ok) throw new Error(fn + " " + r.status);
      return r.json();
    });
  }

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  /* ---------- Fechas en Nueva York ---------- */
  function partesNY(d) {
    var p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: NY, year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(d).forEach(function (x) { p[x.type] = +x.value; });
    return p;
  }
  function nyAInstante(y, m, d, h) {
    var meta = Date.UTC(y, m - 1, d, h), t = meta;
    for (var i = 0; i < 2; i++) {
      var p = partesNY(new Date(t));
      t += meta - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    }
    return new Date(t);
  }
  function fechaDeRespaldo() {
    // Si la base no responde: tres días después de hoy, entre semana, 10:00 h de Nueva York.
    var h = partesNY(new Date());
    var base = Date.UTC(h.year, h.month - 1, h.day + 3);
    var dow = new Date(base).getUTCDay();
    base += (dow === 6 ? 2 : dow === 0 ? 1 : 0) * 864e5;
    var j = new Date(base), v = new Date(base - 864e5);
    return {
      fecha: nyAInstante(j.getUTCFullYear(), j.getUTCMonth() + 1, j.getUTCDate(), 10),
      cierre: nyAInstante(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate(), 18)
    };
  }
  function bonita(d) {
    var p = {};
    new Intl.DateTimeFormat("es-MX", { timeZone: NY, weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return { dia: p.weekday + " " + p.day + " de " + p.month, hora: p.hour + ":" + p.minute };
  }
  function mayus(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var junta = null;   // { fecha: Date, cierre: Date }

  function pintarFechas() {
    var f = bonita(junta.fecha), c = bonita(junta.cierre);
    $("fecha-junta").textContent = mayus(f.dia) + ", " + f.hora + " h, hora de Nueva York";
    var cerro = Date.now() > junta.cierre.getTime();
    $("cierre").textContent = (cerro ? "El registro cerró el " : "El registro cierra el ") + c.dia + " a las " + c.hora + " h, hora de Nueva York.";
  }

  function cargarJunta() {
    return rpc("datos_junta").then(function (r) {
      var f = new Date(r.fecha), c = new Date(r.cierre_registro);
      if (isNaN(f) || isNaN(c)) throw new Error("fechas");
      junta = { fecha: f, cierre: c };
    }).catch(function () {
      junta = fechaDeRespaldo();
    }).then(function () { pintarFechas(); tic(); });
  }

  /* ---------- Cuenta regresiva ---------- */
  function dos(n) { return n < 10 ? "0" + n : String(n); }
  function tic() {
    if (!junta) return;
    var ms = junta.fecha.getTime() - Date.now();
    if (ms <= 0) {
      $("c-dias").textContent = $("c-horas").textContent = $("c-min").textContent = $("c-seg").textContent = "00";
      return;
    }
    var s = Math.floor(ms / 1000);
    $("c-dias").textContent = dos(Math.floor(s / 86400));
    $("c-horas").textContent = dos(Math.floor(s % 86400 / 3600));
    $("c-min").textContent = dos(Math.floor(s % 3600 / 60));
    $("c-seg").textContent = dos(s % 60);
  }
  setInterval(tic, 1000);

  /* ---------- Contador de asistentes ---------- */
  var ultimoN = null;
  function cargarContador() {
    return rpc("contar_asistentes").then(function (n) {
      n = Number(n);
      if (!isFinite(n)) return;
      $("txt-asistentes-antes").textContent = n === 1 ? "Ya viene" : "Ya vienen";
      var b = $("n-asistentes");
      b.textContent = String(n);
      if (ultimoN !== null && n !== ultimoN) { b.classList.remove("sube"); void b.offsetWidth; b.classList.add("sube"); }
      ultimoN = n;
    }).catch(function () { /* se queda el número anterior */ });
  }
  setInterval(function () { if (!document.hidden) cargarContador(); }, 15000);

  /* ---------- Gafete: imagen por modalidad y efecto 3D ---------- */
  var gafete = $("gafete"), gafImg = $("gafete-img");
  function ponerGafete(modalidad, animar) {
    var enLinea = modalidad === "En línea";
    var src = enLinea ? "img/gafete-linea.webp" : "img/gafete-persona.webp";
    if (gafImg.getAttribute("src") === src) return;
    gafImg.setAttribute("src", src);
    gafImg.alt = "Gafete de la junta con la redacción de ATN, modalidad " + (enLinea ? "en línea" : "en persona");
    if (animar && !reducido) { gafete.classList.remove("cambia"); void gafete.offsetWidth; gafete.classList.add("cambia"); }
  }

  function inclinar(rx, ry, gx, gy) {
    gafete.classList.remove("reposo");
    gafete.style.setProperty("--rx", rx.toFixed(1) + "deg");
    gafete.style.setProperty("--ry", ry.toFixed(1) + "deg");
    gafete.style.setProperty("--gx", gx + "%");
    gafete.style.setProperty("--gy", gy + "%");
  }
  function reposo() {
    gafete.classList.add("reposo");
    gafete.style.setProperty("--rx", "0deg"); gafete.style.setProperty("--ry", "0deg");
    gafete.style.setProperty("--gx", "50%"); gafete.style.setProperty("--gy", "0%");
  }
  function limitar(v, a) { return Math.max(-a, Math.min(a, v)); }

  if (!reducido) {
    var portada = document.querySelector(".portada"), pendiente = false, ult = null;
    portada.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      ult = e;
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () {
        pendiente = false;
        var r = gafete.getBoundingClientRect();
        var x = limitar((ult.clientX - r.left) / r.width - 0.5, 1.2), y = limitar((ult.clientY - r.top) / r.height - 0.5, 1.2);
        inclinar(-y * 16, x * 20, Math.round((x + 0.5) * 100), Math.round((y + 0.5) * 100));
      });
    });
    portada.addEventListener("pointerleave", reposo);

    var orientando = false;
    var alOrientar = function (e) {
      if (e.beta === null || e.gamma === null) return;
      var rx = limitar((e.beta - 50) * 0.35, 14), ry = limitar(e.gamma * 0.45, 16);
      inclinar(-rx, ry, Math.round(50 + ry * 3), Math.round(50 + rx * 3));
    };
    var activarMovimiento = function () {
      if (orientando) return;
      window.removeEventListener("touchend", activarMovimiento);
      window.removeEventListener("click", activarMovimiento);
      if (typeof DeviceOrientationEvent === "undefined") return;
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iPhone: el permiso se pide en el primer toque.
        DeviceOrientationEvent.requestPermission().then(function (estado) {
          if (estado === "granted") { orientando = true; window.addEventListener("deviceorientation", alOrientar); }
        }).catch(function () { /* sin permiso: queda el gafete quieto */ });
      } else {
        orientando = true;
        window.addEventListener("deviceorientation", alOrientar);
      }
    };
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission !== "function") {
      activarMovimiento();   // Android y otros: no piden permiso
    } else if (typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("touchend", activarMovimiento);
      window.addEventListener("click", activarMovimiento);
    }
  }

  /* ---------- Registro ---------- */
  var formReg = $("form-registro"), listo = $("registro-listo");
  function mostrarListo(nombre) {
    $("listo-titulo").textContent = "Tu lugar quedó, " + nombre;
    formReg.hidden = true;
    listo.hidden = false;
    actualizarAvisoPregunta();
  }
  function errorReg(t) { var e = $("r-error"); e.textContent = t; e.hidden = !t; }

  Array.prototype.forEach.call(formReg.querySelectorAll('input[name="modalidad"]'), function (r) {
    r.addEventListener("change", function () { if (r.checked) ponerGafete(r.value, true); });
  });

  formReg.addEventListener("submit", function (ev) {
    ev.preventDefault();
    errorReg("");
    var nombre = $("r-nombre").value.trim().replace(/\s+/g, " ");
    var correo = $("r-correo").value.trim();
    var modalidad = formReg.elements.modalidad.value;
    if (nombre.length < 2) return errorReg("Escribe tu nombre.");
    if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(correo)) return errorReg("Revisa tu correo.");
    var btn = $("r-enviar"); btn.disabled = true;
    rpc("registrarse", { p_nombre: nombre, p_correo: correo, p_modalidad: modalidad, p_llave: llave }).then(function (r) {
      if (r && r.ok) {
        registro = { nombre: String(r.nombre || nombre.split(" ")[0]), modalidad: modalidad };
        guardar("junta_registro", registro);
        ponerGafete(modalidad, true);
        mostrarListo(registro.nombre);
        cargarContador();
      } else if (r && r.motivo === "ya") {
        errorReg("Ya estás registrado con ese correo");
      } else {
        errorReg("Revisa tu nombre y tu correo.");
      }
    }).catch(function () {
      errorReg("No pudimos registrarte. Intenta de nuevo.");
    }).then(function () { btn.disabled = false; });
  });

  if (registro && registro.nombre) {
    ponerGafete(registro.modalidad, false);
    mostrarListo(String(registro.nombre));
  }

  /* ---------- El muro ---------- */
  var lista = $("lista-muro"), vacio = $("muro-vacio");
  var preguntas = new Map();          // id -> { id, nombre_pila, texto, votos, creado }
  var nodos = new Map();              // id -> <li>
  var primeraVez = true;

  function guardarVotado(id) { if (votados.indexOf(id) < 0) { votados.push(id); guardar("junta_votados", votados); } }

  function botonEstado(btn, id) {
    var ya = votados.indexOf(id) >= 0;
    btn.textContent = ya ? "Votado" : "Votar";
    btn.disabled = ya;
  }

  function crearNodo(p) {
    var li = el("li", "pregunta");
    li.dataset.id = String(p.id);
    var izq = el("div");
    izq.appendChild(el("p", "quien", ""));
    izq.appendChild(el("p", "texto", ""));
    var der = el("div", "voto");
    der.appendChild(el("b", "", "0"));
    var btn = el("button", "", "Votar");
    btn.type = "button";
    btn.addEventListener("click", function () { votar(p.id, btn); });
    der.appendChild(btn);
    li.appendChild(izq); li.appendChild(der);
    li.addEventListener("animationend", function () { li.classList.remove("nueva", "cambio"); });
    return li;
  }

  function pintarMuro() {
    var orden = Array.from(preguntas.values()).sort(function (a, b) {
      return (new Date(b.creado) - new Date(a.creado)) || (b.id - a.id);
    });
    var vivos = {};
    orden.forEach(function (p, i) {
      vivos[p.id] = true;
      var li = nodos.get(p.id), nuevo = false;
      if (!li) { li = crearNodo(p); nodos.set(p.id, li); nuevo = true; }
      li.querySelector(".quien").textContent = p.nombre_pila;
      li.querySelector(".texto").textContent = p.texto;
      var b = li.querySelector(".voto b"), antes = b.textContent;
      b.textContent = String(p.votos);
      botonEstado(li.querySelector("button"), p.id);
      if (!primeraVez && !reducido) {
        if (nuevo) li.classList.add("nueva");
        else if (antes !== String(p.votos)) { li.classList.remove("cambio"); void li.offsetWidth; li.classList.add("cambio"); }
      }
      if (lista.children[i] !== li) lista.insertBefore(li, lista.children[i] || null);
    });
    nodos.forEach(function (li, id) { if (!vivos[id]) { li.remove(); nodos.delete(id); } });
    vacio.hidden = orden.length > 0;
    primeraVez = false;
  }

  function entero(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function normalizar(r) {
    return { id: entero(r.id), nombre_pila: String(r.nombre_pila == null ? "" : r.nombre_pila),
             texto: String(r.texto == null ? "" : r.texto), votos: entero(r.votos), creado: r.creado };
  }

  function cargarMuro() {
    return rpc("ver_muro").then(function (filas) {
      if (!Array.isArray(filas)) return;
      var nuevos = new Map();
      filas.forEach(function (f) { var p = normalizar(f); nuevos.set(p.id, p); });
      preguntas = nuevos;
      pintarMuro();
    }).catch(function () { /* el siguiente intento lo arregla */ });
  }

  function aplicarCambio(payload) {
    var r = payload && payload.new;
    if (!r || r.id == null) return;
    if (r.visible === false) preguntas.delete(entero(r.id));
    else preguntas.set(entero(r.id), normalizar(r));
    pintarMuro();
  }

  function votar(id, btn) {
    btn.disabled = true;
    rpc("votar", { p_pregunta: id, p_llave: llave }).then(function (r) {
      if (r && r.ok) {
        guardarVotado(id);
        var p = preguntas.get(id);
        if (p) { p.votos = entero(r.votos); pintarMuro(); }
      } else if (r && r.motivo === "ya") {
        guardarVotado(id); pintarMuro();
      } else {
        cargarMuro();
      }
    }).catch(function () {
      btn.disabled = false;
    });
  }

  /* Preguntar */
  var campo = $("p-texto"), cuentaL = $("p-cuenta"), aviso = $("p-aviso");
  function mostrarAviso(t, bueno) {
    aviso.textContent = t; aviso.hidden = !t;
    if (bueno) aviso.setAttribute("data-ok", ""); else aviso.removeAttribute("data-ok");
  }
  function actualizarAvisoPregunta() {
    if (registro && aviso.textContent === "Regístrate para preguntar") mostrarAviso("");
  }
  campo.addEventListener("input", function () {
    var n = campo.value.length;
    cuentaL.textContent = n + " / 200";
    cuentaL.classList.toggle("casi", n >= 180);
  });
  $("form-pregunta").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var texto = campo.value.trim();
    if (!registro) { mostrarAviso("Regístrate para preguntar"); return; }
    if (texto.length < 3) { mostrarAviso("Escribe tu pregunta (de 3 a 200 caracteres)."); return; }
    mostrarAviso("");
    var btn = $("p-enviar"); btn.disabled = true;
    rpc("preguntar", { p_llave: llave, p_texto: texto }).then(function (r) {
      if (r && r.ok) {
        campo.value = ""; campo.dispatchEvent(new Event("input"));
        mostrarAviso("Tu pregunta ya está en el muro.", true);
        cargarMuro();
      } else if (r && r.motivo === "registro") {
        mostrarAviso("Regístrate para preguntar");
      } else if (r && r.motivo === "limite") {
        mostrarAviso("Ya mandaste tus tres preguntas.");
      } else {
        mostrarAviso("Escribe tu pregunta (de 3 a 200 caracteres).");
      }
    }).catch(function () {
      mostrarAviso("No pudimos mandar tu pregunta. Intenta de nuevo.");
    }).then(function () { btn.disabled = false; });
  });

  /* ---------- En vivo: Realtime, o consulta cada 5 s ---------- */
  var marca = $("envivo"), marcaTxt = $("envivo-txt");
  function marcar(estado) {
    marca.setAttribute("data-estado", estado);
    marcaTxt.textContent = estado === "vivo" ? "En vivo" : estado === "sondeo" ? "Actualizando cada 5 s" : "Conectando";
  }

  var sondeo = null;
  function iniciarSondeo() {
    marcar("sondeo");
    if (sondeo) return;
    cargarMuro();
    sondeo = setInterval(function () { if (!document.hidden) cargarMuro(); }, 5000);
  }
  function detenerSondeo() { if (sondeo) { clearInterval(sondeo); sondeo = null; } }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { cargarMuro(); cargarContador(); }
  });

  function iniciarRealtime() {
    var suscrito = false;
    var plazo = setTimeout(function () { if (!suscrito) iniciarSondeo(); }, 8000);
    import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function (mod) {
      var sb = mod.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      sb.channel("muro-en-vivo")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "muro" }, aplicarCambio)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "muro" }, aplicarCambio)
        .subscribe(function (estado) {
          if (estado === "SUBSCRIBED") {
            suscrito = true; clearTimeout(plazo);
            detenerSondeo(); marcar("vivo"); cargarMuro();   // por si algo pasó mientras conectaba
          } else if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT" || estado === "CLOSED") {
            suscrito = false; clearTimeout(plazo); iniciarSondeo();
          }
        });
    }).catch(function () {
      clearTimeout(plazo); iniciarSondeo();
    });
  }

  /* ---------- El resumen de hoy ---------- */
  function cargarResumen() {
    var cuerpo = $("resumen-cuerpo");
    rpc("resumen_de_hoy").then(function (r) {
      cuerpo.textContent = "";
      if (!r || !r.texto) { cuerpo.appendChild(el("p", "nota", "El primer resumen llega mañana a las 7:00")); return; }
      var d = new Date(String(r.fecha) + "T12:00:00Z");
      var etiqueta = isNaN(d) ? String(r.fecha) : new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(d);
      cuerpo.appendChild(el("p", "resumen-fecha", etiqueta));
      cuerpo.appendChild(el("p", "resumen-texto", String(r.texto)));
      var fuentes = Array.isArray(r.fuentes) ? r.fuentes : [];
      var ul = el("ul", "fuentes");
      fuentes.forEach(function (f) {
        if (!f || typeof f.liga !== "string" || f.liga.indexOf("https://") !== 0) return;
        var li = el("li"), a = el("a", "", String(f.titulo || "Fuente"));
        a.href = f.liga; a.rel = "noopener noreferrer"; a.target = "_blank";
        li.appendChild(a); ul.appendChild(li);
      });
      if (ul.children.length) { cuerpo.appendChild(el("p", "nota", "Fuentes")); cuerpo.appendChild(ul); }
    }).catch(function () {
      cuerpo.textContent = "";
      cuerpo.appendChild(el("p", "nota", "No pudimos cargar el resumen. Intenta más tarde."));
    });
  }

  /* ---------- Vista para proyectar (#pantalla) ---------- */
  function aplicarHash() {
    var on = location.hash === "#pantalla";
    if (document.body.classList.contains("pantalla") !== on) {
      document.body.classList.toggle("pantalla", on);
      window.scrollTo(0, 0);
    }
  }
  window.addEventListener("hashchange", aplicarHash);
  aplicarHash();

  /* ---------- Arranque ---------- */
  cargarJunta();
  cargarContador();
  cargarMuro();
  cargarResumen();
  iniciarRealtime();
})();
