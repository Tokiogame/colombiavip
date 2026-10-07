/* ============================================
   Panel de staff · Colombia VIP
   La config de Supabase está en src/config.js
   ============================================ */

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, WEBHOOK_URL } from "../config.js";
import { sb } from "../lib/supabase.js";
import { ICONOS_VIP, imagenVip } from "../data/vip.js";
import "../styles/style.css";
import "../styles/admin.css";

const esc = t => String(t ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => el.querySelectorAll(s);

const toast = $("#toast");
let toastTimer;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.add("ver");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("ver"), 2400);
}

function avisar(form, texto, tipo) {
  const el = $(".aviso", form);
  el.textContent = texto;
  el.className = "aviso " + (tipo || "");
}

const fecha = iso => new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
const colorValido = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : "#e0b02c");
const slug = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Supabase devuelve { error } en vez de lanzar; esto lo convierte en excepción
async function q(consulta) {
  const { data, error, count } = await consulta;
  if (error) throw error;
  return count ?? data;
}

function fallo(err) {
  console.error(err);
  mostrarToast("Error: " + (err.message || "no se pudo completar"));
}

// cerrar modales con la × o clic afuera
$$("dialog").forEach(d => {
  $(".cerrar", d).addEventListener("click", () => d.close());
  d.addEventListener("click", e => { if (e.target === d) d.close(); });
});


/* ---------- sesión ---------- */
const vistaLogin = $("#vista-login");
const vistaPanel = $("#vista-panel");
const formLogin = $("#form-login");

if (!sb) {
  avisar(formLogin, "Falta configurar Supabase en src/config.js.", "mal");
  $("button", formLogin).disabled = true;
}

// El staff entra con usuario y contraseña de la tabla "staff" (no usa correos).
// El login devuelve un token que viaja en cada consulta como x-staff-token,
// y las políticas de la base de datos solo dejan editar si el token es válido.
// El token solo vive en memoria: al cerrar, recargar o salir de la página
// hay que volver a entrar.
let sesion = null;
let db = null;

// versión anterior guardaba la sesión en el navegador; se limpia
try { localStorage.removeItem("staff-sesion"); } catch (err) {}

formLogin.addEventListener("submit", async e => {
  e.preventDefault();
  const { usuario, password } = Object.fromEntries(new FormData(formLogin));
  const nombre = usuario.trim().toLowerCase();
  if (!nombre || !password) return avisar(formLogin, "Escribe usuario y contraseña.", "mal");

  const boton = $("button", formLogin);
  boton.disabled = true;
  avisar(formLogin, "Entrando…");
  try {
    const token = await q(sb.rpc("staff_login", { p_usuario: nombre, p_clave: password }));
    if (!token) return avisar(formLogin, "Usuario o contraseña incorrectos.", "mal");
    entrar({ token, usuario: nombre });
  } catch (err) {
    console.error(err);
    avisar(formLogin, err.code === "PGRST202"
      ? "Falta ejecutar supabase/schema.sql en el SQL Editor de Supabase."
      : "No se pudo conectar con la base de datos.", "mal");
  } finally {
    boton.disabled = false;
  }
});

async function entrar(s) {
  sesion = s;
  db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { "x-staff-token": s.token } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // el rol decide qué pestañas y botones se ven (la base de datos igual lo controla)
  let yo;
  try { [yo] = await q(db.rpc("staff_yo")); } catch (err) { console.error(err); }
  if (!yo) {
    db = null;
    sesion = null;
    return avisar(formLogin, "No se pudo leer tu rol. ¿Ya ejecutaste el schema.sql actualizado?", "mal");
  }
  sesion.rol = yo.rol;
  $$("[data-roles]").forEach(el => (el.hidden = !el.dataset.roles.split(" ").includes(yo.rol)));
  const chipRol = $("#mi-rol");
  chipRol.textContent = NOMBRE_ROL[yo.rol];
  chipRol.className = `chip rol-${yo.rol}`;

  avisar(formLogin, "");
  formLogin.reset();
  $("#usuario").textContent = s.usuario;
  $(".adm-tabs button").click();   // siempre arranca en Solicitudes
  vistaLogin.hidden = true;
  vistaPanel.hidden = false;

  await cargarFacciones();
  cargarSolicitudes();
  abrirDesdeLink();
  if (puede("admin", "staff")) cargarVideos();
  if (puede("admin", "staff")) cargarVip();
  if (puede("admin")) cargarStaff();
}

const NOMBRE_ROL = { admin: "Admin", staff: "Staff", entrevistador: "Entrevistador" };
const puede = (...roles) => roles.includes(sesion?.rol);

// borra el token en la base de datos para que no sirva más
function cerrarSesion() {
  if (!sesion) return;
  const token = sesion.token;
  sesion = null;
  db = null;
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/staff_logout`, {
    method: "POST",
    keepalive: true,  // deja terminar la petición aunque se cierre la pestaña
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "x-staff-token": token,
    },
    body: "{}",
  }).catch(() => {});
}

$("#salir").addEventListener("click", async () => {
  await cerrarSesion();
  vistaPanel.hidden = true;
  vistaLogin.hidden = false;
});

// volver a la web también cierra la sesión
$(".adm-top .marca").addEventListener("click", async e => {
  e.preventDefault();
  const destino = e.currentTarget.href;
  await cerrarSesion();
  location.href = destino;
});

addEventListener("pagehide", cerrarSesion);


/* ---------- pestañas ---------- */
$$(".adm-tabs button").forEach(b =>
  b.addEventListener("click", () => {
    $$(".adm-tabs button").forEach(x => x.setAttribute("aria-selected", x === b));
    $$(".tab").forEach(t => (t.hidden = t.id !== "tab-" + b.dataset.tab));
  })
);


/* ============================================
   SOLICITUDES
   ============================================ */
const listaSol = $("#lista-sol");
const fTipo = $("#f-tipo");
const fEstado = $("#f-estado");
const fBuscar = $("#f-buscar");
const POR_PAGINA = 50;
let solicitudes = [];
let totalSol = 0;
let pedidoSol = 0;   // para descartar respuestas viejas si cambian los filtros mientras carga

// aplica los filtros de arriba (tipo, estado y búsqueda) a una consulta
function conFiltros(consulta) {
  if (fEstado.value) consulta = consulta.eq("estado", fEstado.value);
  if (fTipo.value === "whitelist") consulta = consulta.eq("tipo", "whitelist");
  else if (fTipo.value) consulta = consulta.eq("faccion_id", fTipo.value);

  // la búsqueda la hace la base de datos, así encuentra también las que no están cargadas
  const b = fBuscar.value.trim().replace(/[,()*%\\:"'.]/g, " ").trim();
  if (b) consulta = consulta.or(`discord.ilike.*${b}*,personaje.ilike.*${b}*`);
  return consulta;
}

// "mas" agrega la siguiente tanda; si no, arranca de cero con los filtros actuales
async function cargarSolicitudes(mas = false) {
  const pedido = ++pedidoSol;
  const desde = mas ? solicitudes.length : 0;
  if (!mas) listaSol.innerHTML = '<p class="vacia">Cargando…</p>';

  let consulta = db.from("solicitudes")
    .select("id, tipo, faccion_id, faccion_nombre, discord, personaje, estado, creado", { count: "exact" })
    .order("creado", { ascending: false })
    .range(desde, desde + POR_PAGINA - 1);

  consulta = conFiltros(consulta);

  try {
    const { data, count, error } = await consulta;
    if (error) throw error;
    if (pedido !== pedidoSol) return;
    solicitudes = mas ? solicitudes.concat(data) : data;
    totalSol = count ?? solicitudes.length;
    pintarSolicitudes();
  } catch (err) {
    if (pedido !== pedidoSol) return;
    if (!mas) listaSol.innerHTML = '<p class="vacia">No se pudieron cargar las solicitudes.</p>';
    fallo(err);
  }
  if (!mas) contarPendientes();
}

function pintarSolicitudes() {
  if (!solicitudes.length) {
    listaSol.innerHTML = '<p class="vacia">No hay solicitudes con estos filtros.</p>';
    return;
  }

  const faltan = totalSol - solicitudes.length;
  listaSol.innerHTML = solicitudes.map(s => {
    const fac = facciones.find(f => f.id === s.faccion_id);
    const color = s.tipo === "whitelist" ? "#e0b02c" : colorValido(fac?.color);
    return `
    <button class="item" data-id="${s.id}" style="--c:${color}">
      <span class="item-txt">
        <b>${esc(s.personaje)}</b>
        <small>${s.tipo === "whitelist" ? "Whitelist" : esc(s.faccion_nombre)} · ${esc(s.discord)} · ${fecha(s.creado)}</small>
      </span>
      <span class="chip ${s.estado}">${s.estado}</span>
    </button>`;
  }).join("") + `
    <p class="lista-pie">
      Mostrando ${solicitudes.length} de ${totalSol}
      ${faltan > 0 ? `<button type="button" class="btn btn-linea btn-mini" id="mas-sol">Cargar ${Math.min(faltan, POR_PAGINA)} más</button>` : ""}
    </p>`;
}

async function contarPendientes() {
  try {
    const n = await q(db.from("solicitudes").select("id", { count: "exact", head: true }).eq("estado", "pendiente"));
    const badge = $("#badge-pend");
    badge.textContent = n;
    badge.hidden = !n;
  } catch (err) { console.error(err); }
}

let esperaBusqueda;
fTipo.addEventListener("change", () => cargarSolicitudes());
fEstado.addEventListener("change", () => cargarSolicitudes());
fBuscar.addEventListener("input", () => {
  clearTimeout(esperaBusqueda);
  esperaBusqueda = setTimeout(() => cargarSolicitudes(), 300);
});
$("#recargar-sol").addEventListener("click", () => cargarSolicitudes());

// borra todas las que coinciden con los filtros (sin filtros, todas)
$("#borrar-sol").addEventListener("click", async () => {
  const hayFiltros = fTipo.value || fEstado.value || fBuscar.value.trim();
  let n;
  try {
    n = await q(conFiltros(db.from("solicitudes").select("id", { count: "exact", head: true })));
  } catch (err) { return fallo(err); }
  if (!n) return mostrarToast("No hay solicitudes para borrar.");

  const cuales = hayFiltros ? `las ${n} solicitudes que coinciden con los filtros` : `TODAS las solicitudes (${n})`;
  const escrito = prompt(`Vas a borrar ${cuales}.\nNo se puede deshacer. Los mensajes de Discord no se borran.\n\nEscribe BORRAR para confirmar:`);
  if (escrito?.trim().toUpperCase() !== "BORRAR") return mostrarToast("No se borró nada.");

  try {
    // Supabase no deja borrar sin filtro: "creado no es nulo" las incluye a todas
    const borradas = await q(conFiltros(db.from("solicitudes").delete({ count: "exact" }).not("creado", "is", null)));
    mostrarToast(`${borradas} solicitudes borradas.`);
  } catch (err) { fallo(err); }
  cargarSolicitudes();
});

// detalle
const dlgSol = $("#dlg-sol");
let solActual = null;

async function abrirSolicitud(id) {
  try {
    solActual = await q(db.from("solicitudes").select("*").eq("id", id).single());
  } catch (err) { return fallo(err); }

  const s = solActual;
  $("#sol-tipo").textContent = s.tipo === "whitelist" ? "Whitelist" : "Postulación · " + s.faccion_nombre;
  $("#sol-titulo").textContent = s.personaje;
  $("#sol-meta").innerHTML = `
    <span>Discord: <b>${esc(s.discord)}</b> <button type="button" data-copiar="${esc(s.discord)}">copiar</button></span>
    <span>Enviada: <b>${fecha(s.creado)}</b></span>
    <span>Estado: <span class="chip ${s.estado}">${s.estado}</span>${s.revisado_por ? ` por <b>${esc(s.revisado_por)}</b>` : ""}</span>`;
  $("#sol-datos").innerHTML = (s.datos || []).map(d =>
    `<dl><dt>${esc(d.p)}</dt><dd>${esc(d.r)}</dd></dl>`).join("");
  $("#sol-nota").value = s.nota || "";
  dlgSol.showModal();
  dlgSol.scrollTop = 0;
}

listaSol.addEventListener("click", e => {
  if (e.target.closest("#mas-sol")) {
    e.target.closest("#mas-sol").disabled = true;
    return cargarSolicitudes(true);
  }
  const item = e.target.closest(".item");
  if (item) abrirSolicitud(item.dataset.id);
});

// el botón "Revisar en el panel" del mensaje de Discord trae ?sol=<id>
function abrirDesdeLink() {
  const id = new URLSearchParams(location.search).get("sol");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return;
  history.replaceState(null, "", location.pathname);
  abrirSolicitud(id);
}

$("#sol-meta").addEventListener("click", async e => {
  const b = e.target.closest("[data-copiar]");
  if (!b) return;
  try {
    await navigator.clipboard.writeText(b.dataset.copiar);
    mostrarToast("Discord copiado.");
  } catch (err) { mostrarToast(b.dataset.copiar); }
});

/* ---------- mensaje de Discord ----------
   Al aprobar o rechazar se edita el mensaje que llegó al canal: color, estado
   y quién lo revisó. La nota del staff NO se publica. */
const ESTADO_DISCORD = {
  aprobada: { color: 0x2fa865, icono: "✅", texto: "Aprobada" },
  rechazada: { color: 0xe5484d, icono: "❌", texto: "Rechazada" },
  pendiente: { color: null, icono: "⏳", texto: "Pendiente" },
};

async function actualizarDiscord(s, estado) {
  if (!/^[0-9]+$/.test(s.discord_msg || "")) return true;   // llegó antes de este cambio o sin webhook
  const fac = facciones.find(f => f.id === s.faccion_id);
  const urls = [...new Set([fac?.webhook, WEBHOOK_URL].filter(Boolean))];
  const e = ESTADO_DISCORD[estado];

  for (const url of urls) {
    const dir = `${url}/messages/${s.discord_msg}`;
    const r = await fetch(dir).catch(() => null);
    if (!r?.ok) continue;   // el mensaje no es de este webhook: prueba el siguiente
    const m = await r.json();
    const viejo = m.embeds?.[0] || {};

    const campos = (viejo.fields || []).filter(c => !c.name.startsWith("📌"));
    if (estado !== "pendiente") {
      campos.unshift({ name: "📌 Estado", value: `${e.icono} **${e.texto}** por **${sesion.usuario}** · <t:${Math.floor(Date.now() / 1000)}:R>` });
    }
    const embed = {
      author: viejo.author && { name: viejo.author.name, icon_url: viejo.author.icon_url },
      title: viejo.title,
      description: viejo.description,
      color: e.color ?? parseInt(colorValido(fac?.color).slice(1), 16),
      thumbnail: viejo.thumbnail && { url: viejo.thumbnail.url },
      fields: campos,
      footer: { text: estado === "pendiente" ? "Colombia VIP · Apruébala o recházala en el panel de admin" : `Colombia VIP · ${e.texto} en el panel de admin` },
      timestamp: viejo.timestamp,
    };
    const boton = m.components?.[0]?.components?.[0];
    const cuerpo = {
      content: estado === "pendiente"
        ? `📋 Nueva postulación a **${s.faccion_nombre}**`
        : `${e.icono} Postulación **${e.texto.toLowerCase()}** · **${s.faccion_nombre}** · ${s.personaje}`,
      embeds: [embed],
      allowed_mentions: { parse: [] },
      components: boton?.url
        ? [{ type: 1, components: [{ type: 2, style: 5, label: "Revisar en el panel", emoji: { name: "🗂️" }, url: boton.url }] }]
        : [],
    };
    const p = await fetch(`${dir}?with_components=true`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    }).catch(() => null);
    return !!p?.ok;
  }
  return false;
}

$$("[data-estado]", dlgSol).forEach(b =>
  b.addEventListener("click", async () => {
    const estado = b.dataset.estado;
    const cambios = { estado, nota: $("#sol-nota").value.trim(), revisado_por: estado === "pendiente" ? "" : sesion.usuario };
    try {
      let { error } = await db.from("solicitudes").update(cambios).eq("id", solActual.id);
      // si todavía no se corrió el SQL de la columna revisado_por
      if (error?.code === "PGRST204") {
        delete cambios.revisado_por;
        ({ error } = await db.from("solicitudes").update(cambios).eq("id", solActual.id));
      }
      if (error) throw error;
      dlgSol.close();
      const enDiscord = await actualizarDiscord(solActual, estado);
      mostrarToast(`Solicitud de ${solActual.personaje}: ${estado}.` + (enDiscord ? "" : " (No se pudo actualizar el mensaje de Discord.)"));
      cargarSolicitudes();
    } catch (err) { fallo(err); }
  })
);

$("#sol-borrar").addEventListener("click", async () => {
  if (!confirm(`¿Eliminar la solicitud de ${solActual.personaje}? No se puede deshacer.`)) return;
  try {
    await q(db.from("solicitudes").delete().eq("id", solActual.id));
    dlgSol.close();
    mostrarToast("Solicitud eliminada.");
    cargarSolicitudes();
  } catch (err) { fallo(err); }
});


/* ============================================
   FACCIONES
   ============================================ */
const listaFac = $("#lista-fac");
const dlgFac = $("#dlg-fac");
const formFac = $("#form-fac");
const contPreguntas = $("#fac-preguntas");
let facciones = [];
let facActual = null;

async function cargarFacciones() {
  try {
    facciones = await q(db.from("facciones").select("*").order("orden"));
  } catch (err) {
    listaFac.innerHTML = '<p class="vacia">No se pudieron cargar las facciones.</p>';
    return fallo(err);
  }
  pintarFacciones();

  // el filtro de solicitudes muestra una opción por facción
  const elegido = fTipo.value;
  $$("option[data-fac]", fTipo).forEach(o => o.remove());
  fTipo.insertAdjacentHTML("beforeend", facciones.map(f =>
    `<option data-fac value="${esc(f.id)}">${esc(f.nombre)}</option>`).join(""));
  fTipo.value = elegido;
  if (fTipo.value !== elegido) fTipo.value = "";
}

function pintarFacciones() {
  if (!facciones.length) {
    listaFac.innerHTML = '<p class="vacia">No hay facciones. Crea la primera.</p>';
    return;
  }
  listaFac.innerHTML = facciones.map(f => `
    <div class="item" style="--c:${colorValido(f.color)}">
      <span class="item-txt">
        <b>${esc(f.nombre)}</b>
        <small>${esc(f.sigla)} · ${f.preguntas.length} preguntas</small>
      </span>
      <span class="chip ${f.abierta ? "abierta" : "cerrada"}">${f.abierta ? "Abierta" : "Cerrada"}</span>
      <span class="item-acc">
        <button type="button" data-acc="alternar" data-id="${esc(f.id)}">${f.abierta ? "Cerrar" : "Abrir"}</button>
        <button type="button" data-acc="editar" data-id="${esc(f.id)}">Editar</button>
        <button type="button" data-acc="borrar" data-id="${esc(f.id)}" class="peligro">Eliminar</button>
      </span>
    </div>`).join("");
}

listaFac.addEventListener("click", async e => {
  const b = e.target.closest("[data-acc]");
  if (!b) return;
  const f = facciones.find(x => x.id === b.dataset.id);

  try {
    if (b.dataset.acc === "editar") return abrirFaccion(f);

    if (b.dataset.acc === "alternar") {
      await q(db.from("facciones").update({ abierta: !f.abierta }).eq("id", f.id));
      mostrarToast(`${f.nombre}: postulaciones ${f.abierta ? "cerradas" : "abiertas"}.`);
    }

    if (b.dataset.acc === "borrar") {
      if (!confirm(`¿Eliminar ${f.nombre}? Las solicitudes que ya llegaron se conservan.`)) return;
      await q(db.from("facciones").delete().eq("id", f.id));
      mostrarToast(`${f.nombre} eliminada.`);
    }
    cargarFacciones();
  } catch (err) { fallo(err); }
});

function filaPregunta(p = { texto: "", min: 6 }) {
  const div = document.createElement("div");
  div.className = "pregunta";
  div.innerHTML = `
    <textarea rows="2" placeholder="Escribe la pregunta" aria-label="Pregunta"></textarea>
    <input type="number" min="0" aria-label="Mínimo de caracteres" title="Mínimo de caracteres">
    <button type="button" class="quitar" aria-label="Quitar pregunta">×</button>
    <input class="opciones" placeholder="Opciones separadas por coma (ej: Sí, No). Vacío = respuesta escrita" aria-label="Opciones">`;
  $("textarea", div).value = p.texto;
  $("input", div).value = p.min ?? 0;
  $(".opciones", div).value = (p.opciones || []).join(", ");
  $(".quitar", div).addEventListener("click", () => div.remove());
  contPreguntas.append(div);
}

$("#agregar-pregunta").addEventListener("click", () => {
  filaPregunta();
  $("textarea", contPreguntas.lastElementChild).focus();
});

function abrirFaccion(f) {
  facActual = f || null;
  formFac.reset();
  avisar(formFac, "");
  $("#fac-titulo").textContent = f ? f.nombre : "Nueva facción";

  const el = formFac.elements;
  el.nombre.value = f?.nombre || "";
  el.sigla.value = f?.sigla || "";
  el.descripcion.value = f?.descripcion || "";
  el.color.value = colorValido(f?.color);
  el.icono.value = f?.icono || "escudo";
  el.orden.value = f ? f.orden : facciones.length + 1;
  el.abierta.checked = f ? f.abierta : true;
  el.requisitos.value = (f?.requisitos || ["Whitelist aprobada"]).join("\n");
  el.webhook.value = f?.webhook || "";
  el.rol.value = f?.rol || "";

  contPreguntas.innerHTML = "";
  (f?.preguntas?.length ? f.preguntas : [{ texto: "", min: 6 }]).forEach(filaPregunta);

  dlgFac.showModal();
  dlgFac.scrollTop = 0;
}

$("#nueva-fac").addEventListener("click", () => abrirFaccion());

formFac.addEventListener("submit", async e => {
  e.preventDefault();
  const el = formFac.elements;

  const preguntas = [...$$(".pregunta", contPreguntas)]
    .map(d => {
      const texto = $("textarea", d).value.trim();
      const opciones = $(".opciones", d).value.split(",").map(o => o.trim()).filter(Boolean);
      // con opciones es de elegir una; sin opciones es de escribir con mínimo de caracteres
      return opciones.length ? { texto, opciones } : { texto, min: Math.max(0, +$("input", d).value || 0) };
    })
    .filter(p => p.texto);

  if (!el.nombre.value.trim() || !el.descripcion.value.trim())
    return avisar(formFac, "Pon el nombre y la descripción.", "mal");
  if (!preguntas.length)
    return avisar(formFac, "Agrega al menos una pregunta.", "mal");
  if (el.webhook.value.trim() && !/^https:\/\/(\w+\.)?discord(app)?\.com\/api\/webhooks\//.test(el.webhook.value.trim()))
    return avisar(formFac, "El webhook no parece un link de Discord.", "mal");

  const datos = {
    nombre: el.nombre.value.trim(),
    sigla: el.sigla.value.trim(),
    descripcion: el.descripcion.value.trim(),
    color: el.color.value,
    icono: el.icono.value,
    orden: +el.orden.value || 0,
    abierta: el.abierta.checked,
    requisitos: el.requisitos.value.split("\n").map(r => r.trim()).filter(Boolean),
    preguntas,
    webhook: el.webhook.value.trim(),
    rol: el.rol.value.trim(),
  };

  const boton = $("button[type=submit]", formFac);
  boton.disabled = true;
  avisar(formFac, "Guardando…");

  try {
    if (facActual) {
      await q(db.from("facciones").update(datos).eq("id", facActual.id));
    } else {
      // el id sale del nombre; si ya existe se le agrega un número
      const base = slug(datos.nombre) || "faccion";
      let id = base;
      for (let n = 2; facciones.some(f => f.id === id); n++) id = `${base}-${n}`;
      await q(db.from("facciones").insert({ id, ...datos }));
    }
    dlgFac.close();
    mostrarToast(`${datos.nombre} guardada.`);
    cargarFacciones();
  } catch (err) {
    avisar(formFac, "No se pudo guardar: " + err.message, "mal");
  } finally {
    boton.disabled = false;
  }
});


/* ============================================
   TIENDA VIP
   ============================================ */
const listaVip = $("#lista-vip");
const dlgVip = $("#dlg-vip");
const formVip = $("#form-vip");
const fVipCat = $("#f-vip-cat");
const fVipBuscar = $("#f-vip-buscar");
const previewVip = $("#vip-preview");
let articulos = [];
let vipActual = null;

const nombreCat = id => categorias.find(c => c.id === id)?.nombre || id;

/* ---------- categorías (pestañas de la tienda) ---------- */
const listaCat = $("#lista-cat");
const dlgCat = $("#dlg-cat");
const formCat = $("#form-cat");
let categorias = [];
let catActual = null;

formCat.elements.icono.innerHTML = Object.entries(ICONOS_VIP)
  .map(([id, nombre]) => `<option value="${id}">${nombre}</option>`).join("");

async function cargarCategorias() {
  try {
    categorias = await q(db.from("vip_categorias").select("*").order("orden"));
  } catch (err) {
    categorias = [];
    listaCat.innerHTML = err.code === "42P01" || err.code === "PGRST205"
      ? '<p class="vacia">Falta crear la tabla «vip_categorias»: ejecuta supabase/schema.sql en el SQL Editor.</p>'
      : '<p class="vacia">No se pudieron cargar las categorías.</p>';
    fallo(err);
  }
  if (categorias.length) pintarCategorias();
  else if (!listaCat.innerHTML.includes("Falta")) listaCat.innerHTML = '<p class="vacia">No hay categorías. Crea la primera.</p>';

  // los selects de artículos muestran las categorías actuales
  const opciones = categorias.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join("");
  const elegido = fVipCat.value;
  fVipCat.innerHTML = '<option value="">Todas las categorías</option>' + opciones;
  fVipCat.value = categorias.some(c => c.id === elegido) ? elegido : "";
  formVip.elements.categoria.innerHTML = opciones;
}

function pintarCategorias() {
  listaCat.innerHTML = categorias.map((c, i) => {
    const n = articulos.filter(a => a.categoria === c.id).length;
    return `
    <div class="item">
      <span class="item-txt">
        <b>${esc(c.nombre)}</b>
        <small>${n} ${n === 1 ? "artículo" : "artículos"} · ícono: ${esc(ICONOS_VIP[c.icono] || c.icono)}</small>
      </span>
      <span class="item-acc">
        <button type="button" data-acc="subir" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Subir">↑</button>
        <button type="button" data-acc="bajar" data-i="${i}" ${i === categorias.length - 1 ? "disabled" : ""} aria-label="Bajar">↓</button>
        <button type="button" data-acc="editar" data-i="${i}">Editar</button>
        <button type="button" data-acc="borrar" data-i="${i}" class="peligro">Eliminar</button>
      </span>
    </div>`;
  }).join("");
}

listaCat.addEventListener("click", async e => {
  const b = e.target.closest("[data-acc]");
  if (!b) return;
  const i = +b.dataset.i;
  const c = categorias[i];

  try {
    if (b.dataset.acc === "editar") return abrirCategoria(c);

    if (b.dataset.acc === "borrar") {
      const n = articulos.filter(a => a.categoria === c.id).length;
      const aviso = n
        ? `¿Eliminar la categoría ${c.nombre} y sus ${n} ${n === 1 ? "artículo" : "artículos"}? No se puede deshacer.`
        : `¿Eliminar la categoría ${c.nombre}?`;
      if (!confirm(aviso)) return;
      if (n) {
        const fotos = articulos.filter(a => a.categoria === c.id).map(a => a.imagen);
        await q(db.from("vip").delete().eq("categoria", c.id));
        fotos.forEach(borrarFoto);
      }
      await q(db.from("vip_categorias").delete().eq("id", c.id));
      mostrarToast(`Categoría ${c.nombre} eliminada.`);
    }

    if (b.dataset.acc === "subir" || b.dataset.acc === "bajar") {
      // reescribe el orden completo para que no queden empates
      const orden = [...categorias];
      const j = b.dataset.acc === "subir" ? i - 1 : i + 1;
      [orden[i], orden[j]] = [orden[j], orden[i]];
      await Promise.all(orden.map((x, n) => q(db.from("vip_categorias").update({ orden: n + 1 }).eq("id", x.id))));
    }
    cargarVip();
  } catch (err) { fallo(err); }
});

function abrirCategoria(c) {
  catActual = c || null;
  formCat.reset();
  avisar(formCat, "");
  $("#cat-titulo").textContent = c ? c.nombre : "Nueva categoría";
  formCat.elements.nombre.value = c?.nombre || "";
  formCat.elements.icono.value = c?.icono || "estrella";
  dlgCat.showModal();
  formCat.elements.nombre.focus();
}

$("#nueva-cat").addEventListener("click", () => abrirCategoria());

formCat.addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = formCat.elements.nombre.value.trim();
  if (!nombre) return avisar(formCat, "Ponle un nombre.", "mal");
  const datos = { nombre, icono: formCat.elements.icono.value };

  const boton = $("button[type=submit]", formCat);
  boton.disabled = true;
  avisar(formCat, "Guardando…");
  try {
    if (catActual) {
      await q(db.from("vip_categorias").update(datos).eq("id", catActual.id));
    } else {
      // el id sale del nombre; si ya existe se le agrega un número
      const base = slug(nombre).slice(0, 36) || "categoria";
      let id = base;
      for (let n = 2; categorias.some(c => c.id === id); n++) id = `${base}-${n}`;
      await q(db.from("vip_categorias").insert({ id, ...datos, orden: Math.max(0, ...categorias.map(c => c.orden)) + 1 }));
    }
    dlgCat.close();
    mostrarToast(`Categoría ${nombre} guardada.`);
    cargarVip();
  } catch (err) {
    avisar(formCat, "No se pudo guardar: " + err.message, "mal");
  } finally {
    boton.disabled = false;
  }
});

/* ---------- artículos ---------- */
async function cargarVip() {
  await cargarCategorias();
  try {
    articulos = await q(db.from("vip").select("*").order("categoria").order("orden"));
  } catch (err) {
    listaVip.innerHTML = err.code === "42P01" || err.code === "PGRST205"
      ? '<p class="vacia">Falta crear la tabla «vip»: ejecuta supabase/schema.sql en el SQL Editor.</p>'
      : '<p class="vacia">No se pudieron cargar los artículos.</p>';
    return fallo(err);
  }
  pintarVip();
  if (categorias.length) pintarCategorias();  // actualiza cuántos artículos tiene cada una
}

function pintarVip() {
  // sin tildes ni mayúsculas: "camion" encuentra "Camión"
  const normal = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const busca = normal(fVipBuscar.value.trim());
  const visibles = articulos.filter(a =>
    (!fVipCat.value || a.categoria === fVipCat.value) &&
    (!busca || normal([a.nombre, nombreCat(a.categoria), ...(a.incluye || [])].join(" ")).includes(busca)));
  if (!visibles.length) {
    listaVip.innerHTML = busca
      ? `<p class="vacia">Ningún artículo coincide con «${esc(fVipBuscar.value.trim())}».</p>`
      : '<p class="vacia">No hay artículos aquí. Agrega el primero.</p>';
    return;
  }
  listaVip.innerHTML = visibles.map(a => `
    <div class="item">
      <span class="miniatura" ${a.imagen ? `style="background-image:url('${esc(imagenVip(a.imagen))}')"` : ""}></span>
      <span class="item-txt">
        <b>${esc(a.nombre)}</b>
        <small>${esc(nombreCat(a.categoria))}${a.incluye?.length ? " · " + esc(a.incluye.join(", ")) : ""}</small>
      </span>
      ${a.destacado ? '<span class="chip pendiente">Más vendido</span>' : ""}
      ${a.agotado ? '<span class="chip cerrada">Agotado</span>' : ""}
      <span class="item-acc">
        <button type="button" data-acc="agotado" data-id="${a.id}">${a.agotado ? "Hay stock" : "Agotar"}</button>
        <button type="button" data-acc="editar" data-id="${a.id}">Editar</button>
        <button type="button" data-acc="borrar" data-id="${a.id}" class="peligro">Eliminar</button>
      </span>
    </div>`).join("");
}

fVipCat.addEventListener("change", pintarVip);
fVipBuscar.addEventListener("input", pintarVip);

listaVip.addEventListener("click", async e => {
  const b = e.target.closest("[data-acc]");
  if (!b) return;
  const a = articulos.find(x => x.id === b.dataset.id);

  try {
    if (b.dataset.acc === "editar") return abrirVip(a);

    if (b.dataset.acc === "agotado") {
      await q(db.from("vip").update({ agotado: !a.agotado }).eq("id", a.id));
      mostrarToast(`${a.nombre}: ${a.agotado ? "disponible otra vez" : "agotado"}.`);
    }

    if (b.dataset.acc === "borrar") {
      if (!confirm(`¿Eliminar «${a.nombre}» de la tienda?`)) return;
      await q(db.from("vip").delete().eq("id", a.id));
      borrarFoto(a.imagen);
      mostrarToast(`${a.nombre} eliminado.`);
    }
    cargarVip();
  } catch (err) { fallo(err); }
});

/* ---------- imagen: adjunta (va a Supabase Storage) o por link ---------- */
const quitarFoto = $("#vip-quitar-foto");
let fotoNueva = null;      // imagen adjunta que se sube al guardar
let fotoNuevaUrl = "";     // vista previa local de esa imagen
let fotoHuella = "";       // huella (SHA-256) del archivo original: con ella se nombra al subirla

// huella del archivo: la misma imagen da siempre la misma, aunque cambie el nombre del archivo
async function huella(archivo) {
  const hash = await crypto.subtle.digest("SHA-256", await archivo.arrayBuffer());
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

// en qué parte del bucket "vip" está una foto subida (null si es un link externo)
function rutaFoto(url) {
  const marca = "/storage/v1/object/public/vip/";
  return url?.startsWith(SUPABASE_URL) && url.includes(marca) ? decodeURIComponent(url.split(marca)[1]) : null;
}

// borra del bucket una foto que ya no se usa (si falla, solo queda el archivo huérfano)
async function borrarFoto(url) {
  const ruta = rutaFoto(url);
  if (ruta) await db.storage.from("vip").remove([ruta]).catch(console.error);
}

// achica la imagen a máximo 1200 px y la pasa a WebP para que la tienda cargue rápido
async function comprimir(archivo) {
  const bmp = await createImageBitmap(archivo);
  const escala = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(bmp.width * escala);
  lienzo.height = Math.round(bmp.height * escala);
  lienzo.getContext("2d").drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
  bmp.close();
  // si el navegador no sabe hacer WebP devuelve PNG
  return new Promise(ok => lienzo.toBlob(ok, "image/webp", 0.85));
}

function soltarFotoNueva() {
  if (fotoNuevaUrl) URL.revokeObjectURL(fotoNuevaUrl);
  fotoNueva = null;
  fotoNuevaUrl = "";
  fotoHuella = "";
  formVip.elements.archivo.value = "";
}

function pintarPreviewVip() {
  const url = fotoNuevaUrl || imagenVip(formVip.elements.imagen.value.trim());
  previewVip.innerHTML = url ? `<img src="${esc(url)}" alt="" onerror="this.outerHTML='<p>No se pudo cargar esa imagen.</p>'">` : "";
  quitarFoto.hidden = !url;
}

formVip.elements.imagen.addEventListener("input", () => {
  soltarFotoNueva();
  pintarPreviewVip();
});

formVip.elements.archivo.addEventListener("change", async e => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  if (!archivo.type.startsWith("image/")) return avisar(formVip, "Ese archivo no es una imagen.", "mal");
  if (archivo.size > 15 * 1024 * 1024) return avisar(formVip, "La imagen pesa más de 15 MB.", "mal");

  avisar(formVip, "Preparando imagen…");
  try {
    const [blob, id] = await Promise.all([comprimir(archivo), huella(archivo)]);
    soltarFotoNueva();
    fotoNueva = blob;
    fotoHuella = id;
    fotoNuevaUrl = URL.createObjectURL(blob);
    formVip.elements.imagen.value = "";
    avisar(formVip, "");
    pintarPreviewVip();
  } catch (err) {
    console.error(err);
    avisar(formVip, "No se pudo leer esa imagen. Prueba con otra (PNG o JPG).", "mal");
  }
});

quitarFoto.addEventListener("click", () => {
  soltarFotoNueva();
  formVip.elements.imagen.value = "";
  pintarPreviewVip();
});

dlgVip.addEventListener("close", soltarFotoNueva);

function abrirVip(a) {
  vipActual = a || null;
  formVip.reset();
  avisar(formVip, "");
  $("#vip-titulo").textContent = a ? a.nombre : "Agregar artículo";

  const el = formVip.elements;
  if (!categorias.length) return mostrarToast("Primero crea una categoría.");
  const cat = a?.categoria || fVipCat.value || categorias[0].id;
  el.nombre.value = a?.nombre || "";
  el.categoria.value = cat;
  el.orden.value = a ? a.orden : articulos.filter(x => x.categoria === cat).length + 1;
  el.descripcion.value = a?.descripcion || "";
  el.incluye.value = (a?.incluye || []).join("\n");
  el.imagen.value = a?.imagen || "";
  el.destacado.checked = !!a?.destacado;
  el.agotado.checked = !!a?.agotado;

  soltarFotoNueva();
  pintarPreviewVip();
  dlgVip.showModal();
  dlgVip.scrollTop = 0;
}

$("#nuevo-vip").addEventListener("click", () => abrirVip());

formVip.addEventListener("submit", async e => {
  e.preventDefault();
  const el = formVip.elements;

  if (!el.nombre.value.trim()) return avisar(formVip, "Ponle un nombre.", "mal");

  // no dejar dos artículos con el mismo nombre (sin importar mayúsculas, tildes ni espacios).
  // Se consulta la base en este momento por si otro del staff lo acaba de agregar.
  const comparable = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const boton = $("button[type=submit]", formVip);
  boton.disabled = true;   // desde ya, para que un doble clic no alcance a guardar dos veces
  avisar(formVip, "Revisando…");
  let existentes;
  try {
    existentes = await q(db.from("vip").select("id, nombre, categoria, imagen"));
  } catch (err) {
    boton.disabled = false;
    return avisar(formVip, "No se pudo revisar si el nombre ya existe: " + err.message, "mal");
  }
  const repetido = existentes.find(x => x.id !== vipActual?.id && comparable(x.nombre) === comparable(el.nombre.value));
  if (repetido) {
    boton.disabled = false;
    return avisar(formVip, `Ya hay un artículo llamado «${repetido.nombre}» en ${nombreCat(repetido.categoria)}. Usa otro nombre o edita ese.`, "mal");
  }

  // tampoco dos artículos con la misma imagen: adjunta (misma huella) o por link (mismo link)
  const link = el.imagen.value.trim();
  const mismaFoto = existentes.find(x => x.id !== vipActual?.id && x.imagen && (fotoNueva
    ? rutaFoto(x.imagen)?.startsWith(fotoHuella + ".")
    : link && x.imagen === link));
  if (mismaFoto) {
    boton.disabled = false;
    return avisar(formVip, `Esa imagen ya la usa «${mismaFoto.nombre}» en ${nombreCat(mismaFoto.categoria)}. Escoge otra.`, "mal");
  }

  const datos = {
    nombre: el.nombre.value.trim(),
    categoria: el.categoria.value,
    orden: +el.orden.value || 0,
    descripcion: el.descripcion.value.trim(),
    incluye: el.incluye.value.split("\n").map(r => r.trim()).filter(Boolean),
    imagen: el.imagen.value.trim(),
    destacado: el.destacado.checked,
    agotado: el.agotado.checked,
  };

  avisar(formVip, fotoNueva ? "Subiendo imagen…" : "Guardando…");
  let subida = null;
  try {
    if (fotoNueva) {
      const ext = fotoNueva.type === "image/webp" ? "webp" : "png";
      subida = `${fotoHuella}.${ext}`;
      const { error } = await db.storage.from("vip").upload(subida, fotoNueva, {
        contentType: fotoNueva.type,
        upsert: true,   // si quedó de un intento anterior, se reemplaza
        cacheControl: "31536000",
      });
      if (error) {
        subida = null;
        throw new Error(/bucket/i.test(error.message)
          ? "falta crear la carpeta de imágenes: ejecuta supabase/schema.sql en Supabase."
          : error.message);
      }
      datos.imagen = db.storage.from("vip").getPublicUrl(subida).data.publicUrl;
      avisar(formVip, "Guardando…");
    }

    if (vipActual) await q(db.from("vip").update(datos).eq("id", vipActual.id));
    else await q(db.from("vip").insert(datos));
    subida = null;

    // si cambió la foto, la anterior ya no sirve
    if (vipActual?.imagen && vipActual.imagen !== datos.imagen) borrarFoto(vipActual.imagen);
    dlgVip.close();
    mostrarToast(`${datos.nombre} guardado.`);
    cargarVip();
  } catch (err) {
    // la foto se alcanzó a subir pero el artículo no se guardó: no dejarla suelta
    // (salvo que sea la misma que ya tenía este artículo)
    if (subida && rutaFoto(vipActual?.imagen) !== subida) db.storage.from("vip").remove([subida]).catch(console.error);
    avisar(formVip, "No se pudo guardar: " + err.message, "mal");
  } finally {
    boton.disabled = false;
  }
});


/* ============================================
   VIDEOS
   ============================================ */
const listaVid = $("#lista-vid");
const dlgVid = $("#dlg-vid");
const formVid = $("#form-vid");
const preview = $("#vid-preview");
let videos = [];
let vidActual = null;

// acepta watch?v=, youtu.be/, shorts/, embed/, live/ o el ID solo
function idYoutube(texto) {
  const t = texto.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  const m = t.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}

async function cargarVideos() {
  try {
    videos = await q(db.from("videos").select("*").order("orden"));
  } catch (err) {
    listaVid.innerHTML = '<p class="vacia">No se pudieron cargar los videos.</p>';
    return fallo(err);
  }

  if (!videos.length) {
    listaVid.innerHTML = '<p class="vacia">Aún no hay videos. La web muestra «Pronto subiremos las guías».</p>';
    return;
  }
  listaVid.innerHTML = videos.map((v, i) => `
    <div class="item">
      <span class="miniatura" style="background-image:url(https://i.ytimg.com/vi/${esc(v.yt)}/mqdefault.jpg)"></span>
      <span class="item-txt">
        <b>${esc(v.titulo)}</b>
        <small>${esc(v.descripcion) || "Sin descripción"}</small>
      </span>
      <span class="item-acc">
        <button type="button" data-acc="subir" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Subir">↑</button>
        <button type="button" data-acc="bajar" data-i="${i}" ${i === videos.length - 1 ? "disabled" : ""} aria-label="Bajar">↓</button>
        <button type="button" data-acc="editar" data-i="${i}">Editar</button>
        <button type="button" data-acc="borrar" data-i="${i}" class="peligro">Eliminar</button>
      </span>
    </div>`).join("");
}

listaVid.addEventListener("click", async e => {
  const b = e.target.closest("[data-acc]");
  if (!b) return;
  const i = +b.dataset.i;
  const v = videos[i];

  try {
    if (b.dataset.acc === "editar") return abrirVideo(v);

    if (b.dataset.acc === "borrar") {
      if (!confirm(`¿Eliminar el video «${v.titulo}»?`)) return;
      await q(db.from("videos").delete().eq("id", v.id));
      mostrarToast("Video eliminado.");
    }

    if (b.dataset.acc === "subir" || b.dataset.acc === "bajar") {
      // reescribe el orden completo para que no queden empates
      const orden = [...videos];
      const j = b.dataset.acc === "subir" ? i - 1 : i + 1;
      [orden[i], orden[j]] = [orden[j], orden[i]];
      await Promise.all(orden.map((x, n) => q(db.from("videos").update({ orden: n + 1 }).eq("id", x.id))));
    }
    cargarVideos();
  } catch (err) { fallo(err); }
});

function pintarPreview() {
  const link = formVid.elements.link.value;
  const id = idYoutube(link);
  preview.innerHTML = !link.trim() ? ""
    : id ? `<img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="">`
    : "<p>No reconozco ese link de YouTube.</p>";
}
formVid.elements.link.addEventListener("input", pintarPreview);

function abrirVideo(v) {
  vidActual = v || null;
  formVid.reset();
  avisar(formVid, "");
  $("#vid-titulo").textContent = v ? "Editar video" : "Agregar video";
  if (v) {
    formVid.elements.link.value = "https://www.youtube.com/watch?v=" + v.yt;
    formVid.elements.titulo.value = v.titulo;
    formVid.elements.descripcion.value = v.descripcion;
  }
  pintarPreview();
  dlgVid.showModal();
}

$("#nuevo-vid").addEventListener("click", () => abrirVideo());

formVid.addEventListener("submit", async e => {
  e.preventDefault();
  const el = formVid.elements;
  const yt = idYoutube(el.link.value);
  if (!yt) return avisar(formVid, "Pega un link de YouTube válido.", "mal");
  if (!el.titulo.value.trim()) return avisar(formVid, "Ponle un título.", "mal");

  const datos = { yt, titulo: el.titulo.value.trim(), descripcion: el.descripcion.value.trim() };
  const boton = $("button[type=submit]", formVid);
  boton.disabled = true;
  avisar(formVid, "Guardando…");

  try {
    if (vidActual) await q(db.from("videos").update(datos).eq("id", vidActual.id));
    else await q(db.from("videos").insert({ ...datos, orden: Math.max(0, ...videos.map(v => v.orden)) + 1 }));
    dlgVid.close();
    mostrarToast("Video guardado.");
    cargarVideos();
  } catch (err) {
    avisar(formVid, "No se pudo guardar: " + err.message, "mal");
  } finally {
    boton.disabled = false;
  }
});


/* ============================================
   STAFF (usuarios del panel)
   ============================================ */
const listaStaff = $("#lista-staff");
const dlgStaff = $("#dlg-staff");
const formStaff = $("#form-staff");
let staffEditando = null;

async function cargarStaff() {
  let usuarios;
  try {
    usuarios = await q(db.rpc("staff_listar"));
  } catch (err) {
    listaStaff.innerHTML = '<p class="vacia">No se pudieron cargar los usuarios.</p>';
    return fallo(err);
  }

  const yo = sesion?.usuario;
  listaStaff.innerHTML = usuarios.map(({ usuario, rol }) => `
    <div class="item">
      <span class="item-txt"><b>${esc(usuario)}</b></span>
      ${usuario === yo ? '<span class="chip tu">Tú</span>' : ""}
      <span class="chip rol-${esc(rol)}">${NOMBRE_ROL[rol] || esc(rol)}</span>
      <span class="item-acc">
        <button type="button" data-acc="editar" data-u="${esc(usuario)}" data-rol="${esc(rol)}">Editar</button>
        <button type="button" data-acc="borrar" data-u="${esc(usuario)}" class="peligro" ${usuario === yo ? "disabled" : ""}>Eliminar</button>
      </span>
    </div>`).join("");
}

// modo: "nuevo" (crear), "editar" (rol y contraseña de otro) o "mia" (mi contraseña)
let modoStaff = "nuevo";

function abrirStaff(modo, usuario = "", rol = "entrevistador") {
  modoStaff = modo;
  staffEditando = usuario || null;
  formStaff.reset();
  avisar(formStaff, "");
  const el = formStaff.elements;

  $("#staff-titulo").textContent =
    modo === "nuevo" ? "Crear usuario" : modo === "mia" ? "Mi contraseña" : "Editar " + usuario;
  $("#staff-campo-usuario").hidden = modo === "mia";
  $("#staff-campo-rol").hidden = modo === "mia";
  $("#staff-nota-clave").textContent = modo === "editar" ? "déjala vacía para no cambiarla" : "mínimo 6 caracteres";

  el.usuario.value = usuario;
  el.usuario.readOnly = modo !== "nuevo";
  el.rol.value = rol;
  // no dejar que el admin se quite su propio rol
  el.rol.disabled = modo === "editar" && usuario === sesion?.usuario;

  dlgStaff.showModal();
  (modo === "nuevo" ? el.usuario : el.clave).focus();
}

$("#nuevo-staff").addEventListener("click", () => abrirStaff("nuevo"));
$("#mi-clave").addEventListener("click", () => abrirStaff("mia", sesion?.usuario));

listaStaff.addEventListener("click", async e => {
  const b = e.target.closest("[data-acc]");
  if (!b) return;
  const u = b.dataset.u;
  if (b.dataset.acc === "editar") return abrirStaff("editar", u, b.dataset.rol);

  if (!confirm(`¿Eliminar el usuario ${u}? Ya no podrá entrar al panel.`)) return;
  try {
    await q(db.rpc("staff_borrar", { p_usuario: u }));
    mostrarToast(`Usuario ${u} eliminado.`);
    cargarStaff();
  } catch (err) { fallo(err); }
});

formStaff.addEventListener("submit", async e => {
  e.preventDefault();
  const el = formStaff.elements;
  const nombre = el.usuario.value.trim().toLowerCase();
  const clave = el.clave.value;
  const rol = el.rol.value;

  if (modoStaff === "nuevo" && !/^[a-z0-9._-]{2,40}$/.test(nombre))
    return avisar(formStaff, "Usuario: solo letras, números, punto o guion (sin espacios ni tildes).", "mal");
  const cambiaClave = modoStaff !== "editar" || clave !== "";
  if (cambiaClave && clave.length < 6) return avisar(formStaff, "La contraseña debe tener mínimo 6 caracteres.", "mal");
  if (cambiaClave && clave !== el.clave2.value) return avisar(formStaff, "Las contraseñas no coinciden.", "mal");

  // al crear, no pisar a alguien que ya existe
  if (modoStaff === "nuevo" && $$(`[data-u="${nombre}"]`, listaStaff).length)
    return avisar(formStaff, "Ese usuario ya existe. Usa «Editar».", "mal");

  const boton = $("button[type=submit]", formStaff);
  boton.disabled = true;
  avisar(formStaff, "Guardando…");
  try {
    if (modoStaff === "mia") {
      await q(db.rpc("staff_mi_clave", { p_clave: clave }));
      mostrarToast("Tu contraseña quedó cambiada.");
    } else {
      await q(db.rpc("staff_guardar", { p_usuario: nombre, p_clave: clave, p_rol: rol }));
      mostrarToast(modoStaff === "nuevo" ? `Usuario ${nombre} creado como ${NOMBRE_ROL[rol]}.` : `${nombre} actualizado.`);
      cargarStaff();
    }
    dlgStaff.close();
  } catch (err) {
    avisar(formStaff, "No se pudo guardar: " + err.message, "mal");
  } finally {
    boton.disabled = false;
  }
});
