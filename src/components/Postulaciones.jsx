import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FACCIONES_RESPALDO, WEBHOOK_URL, ROL_STAFF_ID } from "../config.js";
import { sb, colorValido } from "../lib/supabase.js";
import { entregar, slug } from "../lib/envio.js";
import { Aparecer, Cabecera, Tarjeta3D } from "./ui.jsx";
import Icono from "./Icono.jsx";
import { Aviso, Campo, Casilla, Opciones, Texto, resumenErrores, validar } from "./formulario.jsx";

function Faccion({ f, onPostular }) {
  return (
    <Tarjeta3D className="faccion" style={{ "--c": colorValido(f.color) }}>
      <div className="faccion-cab">
        <motion.span className="faccion-ico" whileHover={{ rotate: [0, -12, 12, 0], transition: { duration: 0.5 } }}>
          <Icono nombre={f.icono} respaldo="escudo" />
        </motion.span>
        <span className={`estado ${f.abierta ? "" : "cerrada"}`}>{f.abierta ? "Abierta" : "Cerrada"}</span>
      </div>
      <h3>{f.nombre}</h3>
      <p className="sigla">{f.sigla}</p>
      <p>{f.descripcion}</p>
      <ul>{f.requisitos.map(r => <li key={r}>{r}</li>)}</ul>
      <motion.button className={`btn ${f.abierta ? "" : "btn-linea"}`} disabled={!f.abierta} onClick={() => onPostular(f)} whileTap={{ scale: 0.96 }}>
        {f.abierta ? "Postularme" : "Postulaciones cerradas"}
      </motion.button>
    </Tarjeta3D>
  );
}

const EMOJI = {
  cruz: "🚑", escudo: "👮", estrella: "🎖️", balanza: "⚖️", sirena: "🚨", herramienta: "🔧", maletin: "💼",
  arma: "🔫", calavera: "💀", corona: "👑", fuego: "🔥", helicoptero: "🚁", camion: "🚚", cafe: "☕",
};
const corta = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
const siNo = r => (r === "Sí" ? "✅ Sí" : r === "No" ? "❌ No" : `🔹 ${r}`);

// Mensaje de Discord: datos arriba y cada pregunta con su respuesta.
// Límites de Discord: 25 campos, 1024 caracteres por respuesta, 6000 en total.
function mensajeDiscord(f, d, usuario, id) {
  const logo = `${location.origin}/img/logo.png`;
  let total = 0;
  let recortado = false;

  const preguntas = f.preguntas.slice(0, 21).map((p, i) => {
    const r = String(d["p" + i] ?? "").trim();
    let valor = p.opciones?.length ? siNo(r) : ">>> " + r;
    if (valor.length > 1000 || total + valor.length > 4000) {
      valor = corta(valor, Math.max(120, Math.min(1000, 4000 - total)));
      recortado = true;
    }
    total += valor.length;
    return { name: corta(`${i + 1}. ${p.texto}`, 256), value: valor || "—" };
  });
  if (f.preguntas.length > 21) recortado = true;

  return {
    recortado,
    embed: {
      author: { name: "Nueva postulación", icon_url: logo },
      title: corta(`${EMOJI[f.icono] || "📋"} ${f.nombre}`, 256),
      color: parseInt(colorValido(f.color).slice(1), 16),
      thumbnail: { url: logo },
      description: [
        `### 👤 ${corta(d.personaje.trim(), 100)}`,
        `**Nombre real:** ${corta(d.nombre.trim(), 100)}`,
        // <@ID> sale como mención: el staff le da clic y abre el perfil
        `**Discord:** <@${id}>`,
        `**Usuario:** \`${usuario}\` · **ID:** \`${id}\``,
      ].join("\n"),
      fields: [
        { name: "🎂 Edad", value: `${d.edad} años`, inline: true },
        { name: "🌎 País", value: corta(d.pais.trim(), 100), inline: true },
        { name: "📅 Enviada", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
        { name: "\u200b", value: "**━━━━━━━━  PREGUNTAS  ━━━━━━━━**" },
        ...preguntas,
      ],
      footer: { text: recortado ? "Hay respuestas largas: están completas en el archivo adjunto" : "Colombia VIP · Apruébala o recházala en el panel de admin" },
      timestamp: new Date().toISOString(),
    },
  };
}

function ModalPostulacion({ f, onCerrar }) {
  const caja = useRef(null);
  const paso$ = useRef(null);
  const [datos, setDatos] = useState({});
  const [paso, setPaso] = useState(0);
  const [dir, setDir] = useState(1);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // primero tus datos, luego una pregunta por pantalla y al final la confirmación
  const pasos = [
    { id: "datos", titulo: "Tus datos" },
    ...f.preguntas.map((p, i) => ({ id: "p" + i, titulo: `Pregunta ${i + 1} de ${f.preguntas.length}`, pregunta: p })),
    { id: "final", titulo: "Último paso" },
  ];
  const actual = pasos[paso];
  const esFinal = actual.id === "final";

  useEffect(() => {
    const esc = e => e.key === "Escape" && onCerrar();
    addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onCerrar]);

  function irA(n) {
    setDir(n > paso ? 1 : -1);
    setPaso(n);
    setErrores({});
    setAviso(null);
    caja.current?.parentElement.scrollTo({ top: 0, behavior: "smooth" });
  }

  // revisa solo el paso que se ve
  function pasoValido() {
    const errs = validar(paso$.current);
    setErrores(errs);
    const n = Object.keys(errs).length;
    if (n) setAviso({ texto: resumenErrores(n), tipo: "mal" });
    return !n;
  }

  function alEscribir(e) {
    const { name, value, type } = e.target;
    if (!name) return;
    if (errores[name]) {
      const { [name]: _, ...resto } = errores;
      setErrores(resto);
      // si ya no queda nada en rojo, se quita el aviso de "hay campos por corregir"
      if (!Object.keys(resto).length) setAviso(null);
    }
    if (type !== "checkbox") setDatos(d => ({ ...d, [name]: value }));
    // al elegir una opción se pasa sola a la siguiente pregunta
    if (type === "radio" && e.type === "change") setTimeout(() => irA(paso + 1), 280);
  }

  async function enviar() {
    if (!pasoValido()) return;

    const url = f.webhook || WEBHOOK_URL;
    if (!sb && !url) return setAviso({ texto: "Falta configurar Supabase o el webhook de Discord en src/config.js.", tipo: "mal" });

    const d = datos;
    const usuario = d.discord_usuario.trim().replace(/^@/, "");
    const discord = `${usuario} (${d.discord_id.trim()})`;
    setEnviando(true);
    setAviso({ texto: "Enviando…" });

    const respuestas = [
      { p: "Nombre y Apellido", r: d.nombre },
      { p: "¿De qué país eres?", r: d.pais },
      { p: "Edad", r: d.edad },
      ...f.preguntas.map((p, i) => ({ p: p.texto, r: d["p" + i] })),
    ];
    const txt = [
      `POSTULACIÓN ${f.nombre.toUpperCase()} — ${d.personaje}`,
      `Fecha: ${new Date().toLocaleString("es-CO")}`,
      `Discord: ${discord}`,
      "",
      ...respuestas.flatMap(x => [x.p, x.r, ""]),
    ].join("\n");

    const mensaje = mensajeDiscord(f, d, usuario, d.discord_id.trim());

    try {
      await entregar(
        { tipo: "faccion", faccion_id: f.id, faccion_nombre: f.nombre, discord, personaje: d.personaje.trim(), datos: respuestas },
        {
          url,
          rol: f.rol || ROL_STAFF_ID,
          aviso: `📋 Nueva postulación a **${f.nombre}**`,
          embed: mensaje.embed,
          txt: mensaje.recortado ? txt : null,
          archivo: `postulacion-${f.id}-${slug(d.personaje)}.txt`,
        },
      );
      setAviso({ texto: "¡Postulación enviada! Te responderán por el Discord.", tipo: "bien" });
      setTimeout(onCerrar, 2200);
    } catch (err) {
      setAviso({ texto: "No se pudo enviar. Intenta de nuevo en un rato o avisa en el Discord.", tipo: "mal" });
      setEnviando(false);
    }
  }

  // Enter = siguiente (en el último paso, enviar)
  function alEnviar(e) {
    e.preventDefault();
    if (enviando) return;
    if (esFinal) enviar();
    else if (pasoValido()) irA(paso + 1);
  }

  const p = actual.pregunta;

  return (
    <motion.div className="modal-fondo" onClick={e => e.target === e.currentTarget && onCerrar()}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        ref={caja}
        className="formulario modal-caja"
        style={{ "--c": colorValido(f.color) }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-titulo"
        noValidate
        onSubmit={alEnviar}
        onInput={alEscribir}
        onChange={alEscribir}
        initial={{ opacity: 0, y: 60, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <button type="button" className="cerrar" aria-label="Cerrar" onClick={onCerrar}>×</button>
        <p className="etiqueta">{f.sigla}</p>
        <h3 id="post-titulo">Postulación · {f.nombre}</h3>

        <div className="pasos-progreso">
          <span>Paso {paso + 1} de {pasos.length}</span>
          <i><motion.b animate={{ scaleX: (paso + 1) / pasos.length }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} /></i>
        </div>

        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.fieldset
            key={actual.id}
            ref={paso$}
            className="paso"
            custom={dir}
            variants={{
              entra: d => ({ opacity: 0, x: d * 40 }),
              quieto: { opacity: 1, x: 0 },
              sale: d => ({ opacity: 0, x: d * -40 }),
            }}
            initial="entra"
            animate="quieto"
            exit="sale"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <legend><span>{paso + 1}</span> {actual.titulo}</legend>

            {actual.id === "datos" && (
              <>
                <div className="fila">
                  <Campo etiqueta="Nombre y Apellido" error={errores.nombre}>
                    <input name="nombre" required maxLength="100" defaultValue={datos.nombre} autoFocus />
                  </Campo>
                  <Campo etiqueta="Nombre IC" error={errores.personaje}>
                    <input name="personaje" required maxLength="100" placeholder="Ej: Andrés Quintero" defaultValue={datos.personaje} />
                  </Campo>
                </div>
                <div className="fila">
                  <Campo etiqueta="Usuario de Discord" error={errores.discord_usuario}>
                    <input name="discord_usuario" required maxLength="40" placeholder="Ej: pope.ecx" defaultValue={datos.discord_usuario}
                      pattern="@?[A-Za-z0-9_.]{2,32}" data-formato="Escribe tu usuario tal cual sale en Discord (letras, números, punto o guion bajo)." />
                  </Campo>
                  <Campo etiqueta="ID de Discord" error={errores.discord_id}>
                    <input name="discord_id" required inputMode="numeric" maxLength="20" placeholder="Ej: 555552228525285123" defaultValue={datos.discord_id}
                      pattern="[0-9]{17,20}" data-formato="El ID de Discord son solo números (entre 17 y 20)." />
                  </Campo>
                </div>
                <p className="nota-discord">
                  <b>Tienen que ser tu usuario y tu ID reales:</b> por ahí te contacta el staff. Si son falsos, la postulación se rechaza.
                  <span>¿Cómo saco mi ID? En Discord: Ajustes › Avanzado › activa <i>Modo desarrollador</i>. Luego clic derecho (o mantén presionado) sobre tu perfil › <i>Copiar ID de usuario</i>.</span>
                </p>
                <div className="fila">
                  <Campo etiqueta="¿De qué país eres?" error={errores.pais}>
                    <input name="pais" required maxLength="60" defaultValue={datos.pais} />
                  </Campo>
                  <Campo etiqueta="Edad" error={errores.edad}>
                    <input name="edad" type="number" min="16" max="99" required defaultValue={datos.edad} />
                  </Campo>
                </div>
              </>
            )}

            {p && (p.opciones?.length ? (
              <Opciones etiqueta={p.texto} nombre={actual.id} opciones={p.opciones} valor={datos[actual.id]} error={errores[actual.id]} />
            ) : (
              <Texto etiqueta={p.texto} nombre={actual.id} min={+p.min || 0} rows={4}
                valorInicial={datos[actual.id] || ""} error={errores[actual.id]} autoFocus />
            ))}

            {esFinal && (
              <>
                <p className="paso-repaso">Revisa que tu Discord (<b>{datos.discord_usuario} · {datos.discord_id}</b>) esté bien escrito: por ahí te van a responder.</p>
                <Casilla nombre="acepta" error={errores.acepta}>Tengo la whitelist aprobada y acepto la normativa de la facción.</Casilla>
              </>
            )}
          </motion.fieldset>
        </AnimatePresence>

        <div className="form-pie">
          {paso > 0 && (
            <button type="button" className="btn btn-linea" onClick={() => irA(paso - 1)} disabled={enviando}>← Atrás</button>
          )}
          <motion.button type="submit" className={`btn ${esFinal ? "btn-brillo" : ""}`} disabled={enviando} whileTap={{ scale: 0.96 }}>
            {esFinal ? (enviando ? "Enviando…" : "Enviar postulación") : "Siguiente →"}
          </motion.button>
          <Aviso aviso={aviso} />
        </div>
      </motion.form>
    </motion.div>
  );
}

export default function Postulaciones() {
  const [facciones, setFacciones] = useState(FACCIONES_RESPALDO);
  const [actual, setActual] = useState(null);
  const cerrar = useCallback(() => setActual(null), []);

  useEffect(() => {
    if (!sb) return;
    sb.from("facciones").select("*").order("orden").then(({ data, error }) => {
      if (!error) setFacciones(data);
    });
  }, []);

  return (
    <section id="postulaciones" className="bloque">
      <Cabecera num="04" titulo="Postulaciones">
        Sirve a la ciudad desde una facción del Estado. Necesitas tener la whitelist aprobada antes de postularte.
      </Cabecera>

      <div className="facciones">
        {facciones.map((f, i) => (
          <Aparecer key={f.id} delay={i * 0.1} className="faccion-caja">
            <Faccion f={f} onPostular={setActual} />
          </Aparecer>
        ))}
      </div>

      <AnimatePresence>
        {actual && <ModalPostulacion key={actual.id} f={actual} onCerrar={cerrar} />}
      </AnimatePresence>
    </section>
  );
}
