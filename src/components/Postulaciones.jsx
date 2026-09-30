import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FACCIONES_RESPALDO, WEBHOOK_URL, ROL_STAFF_ID } from "../config.js";
import { sb, colorValido } from "../lib/supabase.js";
import { entregar, slug } from "../lib/envio.js";
import { Aparecer, Cabecera, Tarjeta3D } from "./ui.jsx";
import { Aviso, Campo, Casilla, Opciones, Texto, resumenErrores, validar } from "./formulario.jsx";

const ICONOS = {
  cruz: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />,
  escudo: <><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" /><path d="m12 8 1.2 2.5 2.8.4-2 1.9.5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-1.9 2.8-.4z" fill="currentColor" /></>,
  estrella: <path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" />,
  balanza: <><path d="M12 3v18M7 21h10M5 7h14M12 5V3" /><path d="M5 7 2 14a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z" /></>,
};

function Faccion({ f, onPostular }) {
  return (
    <Tarjeta3D className="faccion" style={{ "--c": colorValido(f.color) }}>
      <div className="faccion-cab">
        <motion.span className="faccion-ico" whileHover={{ rotate: [0, -12, 12, 0], transition: { duration: 0.5 } }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
            {ICONOS[f.icono]}
          </svg>
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
    if (errores[name]) setErrores(({ [name]: _, ...r }) => r);
    if (type !== "checkbox") setDatos(d => ({ ...d, [name]: value }));
    // al elegir una opción se pasa sola a la siguiente pregunta
    if (type === "radio" && e.type === "change") setTimeout(() => irA(paso + 1), 280);
  }

  async function enviar() {
    if (!pasoValido()) return;

    const url = f.webhook || WEBHOOK_URL;
    if (!sb && !url) return setAviso({ texto: "Falta configurar Supabase o el webhook de Discord en src/config.js.", tipo: "mal" });

    const d = datos;
    setEnviando(true);
    setAviso({ texto: "Enviando…" });

    const datos = [
      { p: "Nombre y Apellido", r: d.nombre },
      { p: "¿De qué país eres?", r: d.pais },
      { p: "Edad", r: d.edad },
      ...f.preguntas.map((p, i) => ({ p: p.texto, r: d["p" + i] })),
    ];
    const txt = [
      `POSTULACIÓN ${f.nombre.toUpperCase()} — ${d.personaje}`,
      `Fecha: ${new Date().toLocaleString("es-CO")}`,
      `Discord: ${d.discord}`,
      "",
      ...datos.flatMap(x => [x.p, x.r, ""]),
    ].join("\n");

    try {
      await entregar(
        { tipo: "faccion", faccion_id: f.id, faccion_nombre: f.nombre, discord: d.discord.trim(), personaje: d.personaje.trim(), datos },
        {
          url,
          rol: f.rol || ROL_STAFF_ID,
          aviso: `nueva postulación a ${f.nombre}`,
          titulo: `${f.nombre} · ${d.personaje}`,
          color: parseInt(colorValido(f.color).slice(1), 16),
          campos: [
            { name: "Discord", value: d.discord.slice(0, 100), inline: true },
            { name: "Edad", value: String(d.edad), inline: true },
            { name: "País", value: d.pais.slice(0, 100), inline: true },
          ],
          txt,
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
                <Campo etiqueta="Username de Discord + ID" error={errores.discord}>
                  <input name="discord" required maxLength="100" placeholder="usuario · 123456789012345678" defaultValue={datos.discord} />
                </Campo>
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
                <p className="paso-repaso">Revisa que tu Discord (<b>{datos.discord}</b>) esté bien escrito: por ahí te van a responder.</p>
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
