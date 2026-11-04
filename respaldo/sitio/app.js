/* La primera junta de Tom con la redacción · ATN Noticias (Claude for Business, Sesión 7).
   Registro, muro de preguntas en vivo y el resumen de hoy. Funciona sola: no depende de Claude.
   Solo llama a funciones de la base (rpc). Nunca lee datos personales. Todo texto se pinta con textContent. */
(function () {
  "use strict";
  const CFG = window.JUNTA_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LIBRERIA = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

  // ---------- Supabase: solo funciones ----------
  const base = () => (CFG.supabaseUrl || "").replace(/\/$/, "");
  const listo = () => !!(CFG.supabaseUrl && CFG.supabaseKey && !CFG.supabaseUrl.includes("TU-PROYECTO"));
  function encabezados() {
    const h = { "Content-Type": "application/json", apikey: CFG.supabaseKey };
    if (CFG.supabaseKey && !CFG.supabaseKey.startsWith("sb_")) h.Authorization = "Bearer " + CFG.supabaseKey;
    return h;
  }
  async function rpc(nombre, args) {
    const r = await fetch(base() + "/rest/v1/rpc/" + nombre, { method: "POST", headers: encabezados(), body: JSON.stringify(args || {}) });
    if (!r.ok) throw new Error("rpc " + nombre + " " + r.status);
    return r.json();
  }

  // ---------- La llave de este dispositivo ----------
  const guardado = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } return null; };
  let llave = guardado("atn_llave");
  if (!llave || !/^[0-9a-f-]{36}$/i.test(llave)) {
    llave = (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
    guardado("atn_llave", llave);
  }
  let votadas = new Set(JSON.parse(guardado("atn_votadas") || "[]"));
  const guardaVotadas = () => guardado("atn_votadas", JSON.stringify(Array.from(votadas)));
  const registrado = () => guardado("atn_registrado");

  // ---------- Contador ----------
  let mostrado = 0;
  function animarNumero(hasta) {
    const el = $("cuantos");
    $("cuantos-txt").textContent = "de la redacción";
    const desde = mostrado; mostrado = hasta;
    if (quieto || desde === hasta) { el.textContent = hasta.toLocaleString("es-MX"); return; }
    const t0 = performance.now(), dur = 800;
    (function paso(t) {
      const k = Math.min(1, (t - t0) / dur), v = Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - k, 3)));
      el.textContent = v.toLocaleString("es-MX"); if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }
  async function contar() {
    if (!listo()) { $("lista").textContent = "Sé de los primeros en registrarte"; return; }
    try { animarNumero(Number(await rpc("contar_asistentes"))); } catch (e) { /* se intenta en la siguiente vuelta */ }
  }

  // ---------- La fecha de la junta: la da la base; nunca está escrita en un archivo ----------
  const NY = "America/New_York";
  function desfaseNY(ymd) {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: NY, timeZoneName: "shortOffset" }).formatToParts(new Date(ymd + "T15:00:00Z"));
    const m = ((p.find((x) => x.type === "timeZoneName") || {}).value || "GMT-5").match(/GMT([+-])(\d+)/);
    return m ? m[1] + m[2].padStart(2, "0") + ":00" : "-05:00";
  }
  function siguienteJunta() { // sin base: a tres días, entre semana, a las 10:00 h de Nueva York
    const ymdNY = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: NY, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    const d = new Date(ymdNY(new Date()) + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 3);
    const dow = d.getUTCDay(); if (dow === 6) d.setUTCDate(d.getUTCDate() + 2); if (dow === 0) d.setUTCDate(d.getUTCDate() + 1);
    const ymd = d.toISOString().slice(0, 10);
    return new Date(ymd + "T10:00:00" + desfaseNY(ymd));
  }
  async function fechaJunta() {
    if (listo()) {
      try { const j = await rpc("datos_junta"); if (j && j.fecha) return { fecha: new Date(j.fecha), cierre: new Date(j.cierre_registro) }; } catch (e) { /* se calcula aquí */ }
    }
    const f = siguienteJunta();
    const c = new Date(f.getTime() - 16 * 3600e3);
    return { fecha: f, cierre: c };
  }
  const enNY = (d, op) => new Intl.DateTimeFormat("es-MX", Object.assign({ timeZone: NY }, op)).format(d);
  const diaTexto = (d) => { const s = enNY(d, { weekday: "long" }); return s.charAt(0).toUpperCase() + s.slice(1) + " " + enNY(d, { day: "numeric" }) + " de " + enNY(d, { month: "long" }); };
  const horaTexto = (d) => enNY(d, { hour: "2-digit", minute: "2-digit", hour12: false }) + " h";
  let meta = 0;
  const dos = (n) => String(n).padStart(2, "0");
  function reloj() {
    let s = Math.max(0, Math.floor((meta - Date.now()) / 1000));
    if (s === 0) { $("reloj").textContent = "Hoy es la junta"; return false; }
    $("r-dias").textContent = dos(Math.floor(s / 86400)); s %= 86400;
    $("r-horas").textContent = dos(Math.floor(s / 3600)); s %= 3600;
    $("r-min").textContent = dos(Math.floor(s / 60)); $("r-seg").textContent = dos(s % 60);
    return true;
  }
  fechaJunta().then(({ fecha, cierre }) => {
    meta = fecha.getTime();
    $("fecha-junta").textContent = diaTexto(fecha) + ", " + horaTexto(fecha) + ", hora de Nueva York";
    $("cierre-junta").textContent = "El registro cierra el " + diaTexto(cierre).toLowerCase() + " a las " + horaTexto(cierre) + ".";
    if (reloj()) { const id = setInterval(() => { if (!reloj()) clearInterval(id); }, 1000); }
  });

  // ---------- El gafete en 3D ----------
  const tarjeta = $("tarjeta3d"), escena = $("escena");
  function inclinar(x, y) {
    tarjeta.style.setProperty("--ry", (x * 14).toFixed(2) + "deg");
    tarjeta.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
    tarjeta.style.setProperty("--gx", (50 + x * 40).toFixed(0) + "%");
    tarjeta.style.setProperty("--gy", (30 + y * 40).toFixed(0) + "%");
  }
  if (!quieto) {
    escena.addEventListener("pointermove", (e) => { const r = escena.getBoundingClientRect(); inclinar(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1); });
    escena.addEventListener("pointerleave", () => inclinar(0, 0));
    const mover = () => window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null) return; inclinar(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
    });
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
      document.addEventListener("click", () => { DeviceOrientationEvent.requestPermission().then((r) => { if (r === "granted") mover(); }).catch(() => {}); }, { once: true });
    } else { mover(); }
  }
  const NOTAS = { "En persona": "En la sala de redacción de ATN, en Nueva York. Entras con tu gafete.", "En línea": "Por la transmisión interna. Tu liga personal te llega por correo un día antes." };
  document.querySelectorAll('input[name="modalidad"]').forEach((r) => r.addEventListener("change", () => {
    $("nota-modalidad").textContent = NOTAS[r.value];
    const img = $("gafete"); img.classList.add("cambiando");
    setTimeout(() => { img.src = r.value === "En línea" ? "img/gafete-linea.webp" : "img/gafete-persona.webp"; img.alt = "Gafete de ATN para la junta con la redacción, " + r.value.toLowerCase(); img.classList.remove("cambiando"); }, 200);
  }));

  // ---------- Registro ----------
  const forma = $("forma");
  function yaRegistrado(nombre) {
    forma.hidden = true; $("registro-cabeza").hidden = true; $("gracias").hidden = false;
    $("gracias-titulo").textContent = nombre ? "Tu lugar quedó, " + nombre : "Tu lugar quedó";
  }
  if (registrado()) yaRegistrado(registrado());
  forma.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const msg = $("mensaje"), btn = $("enviar");
    const nombre = $("nombre").value.trim().replace(/\s+/g, " ");
    const correo = $("correo").value.trim().toLowerCase();
    const modalidad = (forma.querySelector('input[name="modalidad"]:checked') || {}).value || "En persona";
    ["nombre", "correo"].forEach((id) => $(id).removeAttribute("aria-invalid"));
    if (nombre.length < 2) { msg.textContent = "Escribe tu nombre."; $("nombre").setAttribute("aria-invalid", "true"); $("nombre").focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(correo)) { msg.textContent = "Revisa tu correo: le falta algo."; $("correo").setAttribute("aria-invalid", "true"); $("correo").focus(); return; }
    if (!listo()) { msg.textContent = "La página todavía no está conectada a la base de datos."; return; }
    msg.textContent = ""; btn.disabled = true; btn.textContent = "Registrando…";
    try {
      const r = await rpc("registrarse", { p_nombre: nombre, p_correo: correo, p_modalidad: modalidad, p_llave: llave });
      if (!r.ok) { msg.textContent = r.motivo === "ya" ? "Ya estás registrado con ese correo." : "Revisa tus datos: el correo no tiene el formato correcto."; return; }
      guardado("atn_registrado", r.nombre || nombre.split(" ")[0]);
      yaRegistrado(registrado());
      $("gracias").scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "center" });
      confeti(); contar(); avisoPregunta();
    } catch (e) { msg.textContent = "No pudimos registrarte en este momento. Intenta de nuevo en un minuto."; }
    finally { btn.disabled = false; btn.textContent = "Registrarme"; }
  });

  // ---------- El muro ----------
  const muro = new Map();       // id → {id, nombre_pila, texto, votos, creado}
  const lista = $("preguntas");
  function pintar(cambiadas) {
    const orden = Array.from(muro.values()).sort((a, b) => new Date(b.creado) - new Date(a.creado));
    const frag = document.createDocumentFragment();
    for (const p of orden) {
      const li = document.createElement("li"); li.className = "p"; li.dataset.id = p.id;
      if (cambiadas && cambiadas.has(p.id)) li.classList.add("cambio");
      const div = document.createElement("div");
      const quien = document.createElement("span"); quien.className = "quien"; quien.textContent = p.nombre_pila;
      const texto = document.createElement("p"); texto.className = "texto"; texto.textContent = p.texto;
      div.append(quien, texto);
      const b = document.createElement("button"); b.type = "button"; b.className = "votar";
      const n = document.createElement("b"); n.textContent = String(p.votos);
      const t = document.createElement("span"); t.textContent = votadas.has(p.id) ? "Votado" : "Votar";
      b.append(n, t);
      if (votadas.has(p.id)) { b.classList.add("votado"); b.disabled = true; b.setAttribute("aria-label", "Ya votaste esta pregunta"); }
      else { b.setAttribute("aria-label", "Votar la pregunta de " + p.nombre_pila); b.addEventListener("click", () => votar(p.id, b)); }
      li.append(div, b);
      frag.append(li);
    }
    lista.replaceChildren(frag);
    if (!orden.length) { const li = document.createElement("li"); li.className = "nota"; li.textContent = "Todavía no hay preguntas. Sé el primero."; lista.append(li); }
  }
  function cargarDe(filas) {
    const cambiadas = new Set();
    const nuevas = new Map();
    for (const f of filas || []) {
      const id = Number(f.id), antes = muro.get(id);
      if (!antes || antes.votos !== f.votos || antes.texto !== f.texto) cambiadas.add(id);
      nuevas.set(id, { id, nombre_pila: String(f.nombre_pila), texto: String(f.texto), votos: Number(f.votos), creado: f.creado });
    }
    const primera = muro.size === 0;
    muro.clear(); nuevas.forEach((v, k) => muro.set(k, v));
    pintar(primera ? null : cambiadas);
  }
  async function cargarMuro() {
    if (!listo()) return;
    try { cargarDe(await rpc("ver_muro")); } catch (e) { /* se intenta en la siguiente vuelta */ }
  }
  function aplicarCambio(p) {        // un aviso de Realtime: INSERT, UPDATE o DELETE en la tabla muro
    const nuevo = p.new || {}, viejo = p.old || {};
    const id = Number(nuevo.id || viejo.id);
    if (!id) return;
    if (p.eventType === "DELETE" || nuevo.visible === false) muro.delete(id);
    else muro.set(id, { id, nombre_pila: String(nuevo.nombre_pila), texto: String(nuevo.texto), votos: Number(nuevo.votos), creado: nuevo.creado });
    pintar(new Set([id]));
  }
  async function votar(id, boton) {
    if (votadas.has(id)) return;
    boton.disabled = true;
    try {
      const r = await rpc("votar", { p_pregunta: id, p_llave: llave });
      if (r.ok || r.motivo === "ya") { votadas.add(id); guardaVotadas(); }
      if (r.ok && muro.has(id)) muro.get(id).votos = r.votos;
      pintar(r.ok ? new Set([id]) : null);
    } catch (e) { boton.disabled = false; }
  }

  // ---------- Preguntar ----------
  const fp = $("forma-pregunta"), pregunta = $("pregunta");
  function avisoPregunta() {
    $("mensaje-pregunta").className = "mensaje";
    $("mensaje-pregunta").textContent = registrado() ? "" : "Regístrate para preguntar. Votar no necesita registro.";
  }
  avisoPregunta();
  pregunta.addEventListener("input", () => { $("cuenta").textContent = pregunta.value.length + " de 200"; });
  fp.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const msg = $("mensaje-pregunta"), btn = $("mandar");
    const texto = pregunta.value.trim().replace(/\s+/g, " ");
    msg.className = "mensaje";
    if (!registrado()) { msg.textContent = "Primero regístrate: así sabemos quién pregunta."; $("registro").scrollIntoView({ behavior: quieto ? "auto" : "smooth" }); return; }
    if (texto.length < 3) { msg.textContent = "Escribe tu pregunta."; pregunta.focus(); return; }
    if (texto.length > 200) { msg.textContent = "Tu pregunta pasa de 200 caracteres."; return; }
    if (!listo()) { msg.textContent = "La página todavía no está conectada a la base de datos."; return; }
    btn.disabled = true; btn.textContent = "Mandando…";
    try {
      const r = await rpc("preguntar", { p_llave: llave, p_texto: texto });
      if (r.ok) { pregunta.value = ""; $("cuenta").textContent = "0 de 200"; msg.className = "mensaje bien"; msg.textContent = "Tu pregunta ya está en el muro."; cargarMuro(); }
      else if (r.motivo === "registro") { guardado("atn_registrado", null); forma.hidden = false; $("registro-cabeza").hidden = false; $("gracias").hidden = true; msg.textContent = "Regístrate desde este celular para preguntar."; }
      else if (r.motivo === "limite") msg.textContent = "Ya mandaste tres preguntas. Ahora vota las de los demás.";
      else msg.textContent = "Revisa tu pregunta: entre 3 y 200 caracteres.";
    } catch (e) { msg.textContent = "No pudimos mandar tu pregunta. Intenta de nuevo en un minuto."; }
    finally { btn.disabled = false; btn.textContent = "Mandar pregunta"; }
  });

  // ---------- En vivo, o cada 5 segundos ----------
  let sondeo = null, enVivoAhora = false;
  function marca(vivo) {
    enVivoAhora = vivo;
    $("vivo").classList.toggle("en-vivo", vivo);
    $("vivo-txt").textContent = vivo ? "En vivo" : "Actualizando cada 5 s";
    if (vivo && sondeo) { clearInterval(sondeo); sondeo = null; }
    if (!vivo && !sondeo) sondeo = setInterval(() => { if (!document.hidden) cargarMuro(); }, 5000);
  }
  async function conectarEnVivo() {
    if (!listo()) { $("vivo-txt").textContent = "Sin conexión a la base"; return; }
    let suscrito = false;
    const espera = setTimeout(() => { if (!suscrito) marca(false); }, 8000);
    try {
      const { createClient } = await import(LIBRERIA);
      const sb = createClient(base(), CFG.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
      sb.channel("muro-en-vivo")
        .on("postgres_changes", { event: "*", schema: "public", table: "muro" }, aplicarCambio)
        .subscribe((estado) => {
          if (estado === "SUBSCRIBED") { suscrito = true; clearTimeout(espera); if (!enVivoAhora) cargarMuro(); marca(true); }
          else if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT" || estado === "CLOSED") { suscrito = false; marca(false); }
        });
    } catch (e) { clearTimeout(espera); marca(false); }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { cargarMuro(); contar(); } });

  // ---------- El resumen de hoy ----------
  async function resumen() {
    if (!listo()) return;
    let r; try { r = await rpc("resumen_de_hoy"); } catch (e) { return; }
    if (!r || !r.texto) return;
    const f = new Date(r.fecha + "T12:00:00");
    const hoy = new Date().toDateString() === f.toDateString();
    const dia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(f);
    $("resumen-fecha").textContent = (hoy ? "Hoy, " : "El más reciente, ") + dia;
    const caja = $("resumen-texto"); caja.replaceChildren();
    String(r.texto).split(/\n+/).filter(Boolean).forEach((t) => { const p = document.createElement("p"); p.textContent = t; caja.append(p); });
    const ul = $("resumen-fuentes"); ul.replaceChildren();
    (Array.isArray(r.fuentes) ? r.fuentes : []).forEach((x) => {
      if (!x || typeof x.liga !== "string" || !/^https:\/\//i.test(x.liga)) return;
      const li = document.createElement("li"), a = document.createElement("a");
      a.href = x.liga; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = String(x.titulo || x.liga);
      li.append(a); ul.append(li);
    });
  }

  // ---------- Vista para proyectar ----------
  const vista = () => document.body.classList.toggle("pantalla", location.hash === "#pantalla");
  window.addEventListener("hashchange", vista); vista();

  // ---------- Confeti rojo, negro y blanco ----------
  function confeti() {
    if (quieto) return;
    const cv = $("confeti"), cx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colores = ["#C8102E", "#111111", "#FFFFFF", "#E8899A"];
    const ps = Array.from({ length: 100 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .55, vx: (Math.random() - .5) * 11, vy: -Math.random() * 13 - 6, w: Math.random() * 8 + 4, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: colores[Math.floor(Math.random() * colores.length)] }));
    const t0 = performance.now();
    (function cuadro(t) {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach((p) => { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); cx.restore(); });
      if (t - t0 < 2800) requestAnimationFrame(cuadro); else cx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }

  // ---------- Arranque ----------
  contar(); setInterval(() => { if (!document.hidden) contar(); }, 15000);
  cargarMuro(); conectarEnVivo(); resumen();
  setInterval(() => { if (!document.hidden && enVivoAhora) cargarMuro(); }, 60000);   // repaso por si se perdió un aviso
})();
