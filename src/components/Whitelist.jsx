import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WEBHOOK_URL, ROL_STAFF_ID } from "../config.js";
import { sb } from "../lib/supabase.js";
import { entregar, slug } from "../lib/envio.js";
import { armarExamen } from "../data/preguntas-wl.js";
import { Aparecer, Cabecera, Tarjeta3D } from "./ui.jsx";
import { Aviso, Campo, Casilla, Texto, resumenErrores, validar } from "./formulario.jsx";

const CLAVE_BORRADOR = "wl-borrador";
const MIN_HISTORIA = 400;

// borrador: { datos, paso, preguntas: [ids] }. La versión anterior guardaba
// solo los campos sueltos; se aprovechan como datos.
function leerBorrador() {
  try {
    const b = JSON.parse(localStorage.getItem(CLAVE_BORRADOR) || "{}");
    return b.datos ? b : { datos: b };
  } catch (e) { return { datos: {} }; }
}

const FASES = [
  ["Fase 1", "Whitelist escrita", "Respóndela paso a paso con tus propias palabras. A cada persona le tocan preguntas distintas, así que copiar no sirve."],
  ["Fase 2", "Whitelist de voz", "Si apruebas la escrita, te citamos en el Discord para una entrevista con el staff. Necesitas micrófono y te haremos preguntas de rol y de la normativa."],
];

const largo = v => String(v ?? "").trim().length;

export default function Whitelist() {
  const form = useRef(null);
  const paso$ = useRef(null);
  const navego = useRef(false);   // para no robar el foco al cargar la página
  const [inicial] = useState(leerBorrador);
  const [examen, setExamen] = useState(() => armarExamen(inicial.preguntas));
  const [datos, setDatos] = useState(inicial.datos || {});
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [dir, setDir] = useState(1);

  const pasos = [
    { id: "ooc", titulo: "Datos fuera del rol (OOC)", completo: d => d.discord?.trim() && +d.edad >= 16 && d.experiencia },
    { id: "pj", titulo: "Tu personaje (IC)", completo: d => d.personaje?.trim() && +d.edad_pj >= 18 && largo(d.historia) >= MIN_HISTORIA },
    ...examen.map((p, i) => ({
      id: "q_" + p.id,
      titulo: `Pregunta ${i + 1} de ${examen.length}`,
      pregunta: p,
      completo: d => largo(d["q_" + p.id]) >= p.min,
    })),
    { id: "final", titulo: "Último paso", completo: () => true },
  ];

  // si el borrador traía un paso, se retoma, pero nunca después de uno incompleto
  const [paso, setPaso] = useState(() => {
    const d = inicial.datos || {};
    const primeroIncompleto = pasos.findIndex(p => !p.completo(d));
    return Math.min(inicial.paso || 0, primeroIncompleto);
  });
  const actual = pasos[paso];
  const esFinal = actual.id === "final";

  // guarda el borrador (datos, paso y qué preguntas le tocaron) en este navegador
  useEffect(() => {
    if (enviada) return;
    try {
      localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ datos, paso, preguntas: examen.map(p => p.id) }));
    } catch (e) {}
  }, [datos, paso, examen, enviada]);

  function alEscribir(e) {
    const { name, value, type } = e.target;
    if (!name) return;
    if (errores[name]) setErrores(({ [name]: _, ...resto }) => resto);
    if (type !== "checkbox") setDatos(d => ({ ...d, [name]: value }));
  }

  function irA(n) {
    navego.current = true;
    setDir(n > paso ? 1 : -1);
    setPaso(n);
    setErrores({});
    setAviso(null);
    // si el inicio del formulario quedó arriba de la pantalla, se sube hasta él
    const arriba = form.current?.getBoundingClientRect().top;
    if (arriba < 0) form.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function siguiente() {
    const errs = validar(paso$.current);
    setErrores(errs);
    const n = Object.keys(errs).length;
    if (n) return setAviso({ texto: resumenErrores(n), tipo: "mal" });
    irA(paso + 1);
  }

  async function enviar() {
    const errs = validar(paso$.current);
    setErrores(errs);
    const n = Object.keys(errs).length;
    if (n) return setAviso({ texto: resumenErrores(n), tipo: "mal" });

    // por si algo quedó a medias (borrador viejo, otra pestaña…)
    const incompleto = pasos.findIndex(p => !p.completo(datos));
    if (incompleto !== -1) {
      irA(incompleto);
      return setAviso({ texto: "Te falta completar este paso.", tipo: "mal" });
    }

    if (!sb && !WEBHOOK_URL)
      return setAviso({ texto: "Falta configurar Supabase o el webhook de Discord en src/config.js.", tipo: "mal" });

    const d = datos;
    setEnviando(true);
    setAviso({ texto: "Enviando…" });

    // cada respuesta va con su pregunta, así el staff ve qué le tocó a cada quien
    const respuestas = [
      { p: "Edad", r: d.edad },
      { p: "Experiencia en rol", r: d.experiencia },
      { p: "Nos conoció por", r: d.referido?.trim() || "-" },
      { p: "Edad del personaje", r: d.edad_pj },
      { p: "Historia del personaje", r: d.historia.trim() },
      ...examen.map(p => ({ p: p.texto, r: d["q_" + p.id].trim() })),
    ];

    const txt = [
      `WHITELIST — ${d.personaje}`,
      `Fecha: ${new Date().toLocaleString("es-CO")}`,
      `Discord: ${d.discord}`,
      "Acepta WL de voz: Sí",
      "",
      ...respuestas.flatMap(x => [x.p, x.r, ""]),
    ].join("\n");

    try {
      await entregar(
        { tipo: "whitelist", discord: d.discord.trim(), personaje: d.personaje.trim(), datos: respuestas },
        {
          url: WEBHOOK_URL,
          rol: ROL_STAFF_ID,
          aviso: "nueva solicitud de whitelist",
          titulo: d.personaje,
          color: 0xe0b02c,
          campos: [
            { name: "Discord", value: d.discord.slice(0, 100), inline: true },
            { name: "Edad", value: String(d.edad), inline: true },
            { name: "Experiencia", value: d.experiencia, inline: true },
            { name: "Historia (inicio)", value: d.historia.slice(0, 300) + (d.historia.length > 300 ? "…" : "") },
          ],
          txt,
          archivo: `whitelist-${slug(d.personaje)}.txt`,
        },
      );
      try { localStorage.removeItem(CLAVE_BORRADOR); } catch (err) {}
      setEnviada(true);
      setAviso(null);
    } catch (err) {
      setAviso({ texto: "No se pudo enviar. Intenta de nuevo en un rato o avisa en el Discord.", tipo: "mal" });
    } finally {
      setEnviando(false);
    }
  }

  // Enter en un campo = siguiente (en el último paso, enviar)
  function alEnviar(e) {
    e.preventDefault();
    if (enviando) return;
    esFinal ? enviar() : siguiente();
  }

  function otraSolicitud() {
    setExamen(armarExamen());
    setDatos({});
    setPaso(0);
    setEnviada(false);
  }

  const v = n => datos[n] ?? "";

  return (
    <section id="whitelist" className="bloque bloque-alt">
      <Cabecera num="03" titulo="Whitelist">Para entrar a la ciudad pasas por dos filtros. Así mantenemos el rol serio.</Cabecera>

      <ol className="fases">
        {FASES.map(([num, titulo, texto], i) => (
          <Aparecer as="li" key={num} delay={i * 0.12}>
            <Tarjeta3D className="fase" inclinacion={5}>
              <span className="fase-num">{num}</span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </Tarjeta3D>
          </Aparecer>
        ))}
      </ol>

      <Aparecer>
        {enviada ? (
          <motion.div className="formulario wl-lista" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="wl-lista-ico" aria-hidden="true">✓</span>
            <h3>¡Listo! Tu solicitud llegó al staff</h3>
            <p>La revisamos normalmente entre 24 y 72 horas. Pendiente del Discord: si la apruebas, te citamos para la whitelist de voz.</p>
            <button type="button" className="wl-otra" onClick={otraSolicitud}>Enviar otra solicitud</button>
          </motion.div>
        ) : (
          <form ref={form} className="formulario wl" noValidate onSubmit={alEnviar} onInput={alEscribir} onChange={alEscribir}>
            <div className="wl-progreso">
              <span>Paso {paso + 1} de {pasos.length}</span>
              <i><motion.b animate={{ scaleX: (paso + 1) / pasos.length }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} /></i>
            </div>

            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.fieldset
                key={actual.id}
                ref={paso$}
                custom={dir}
                variants={{
                  entra: d => ({ opacity: 0, x: d * 40 }),
                  quieto: { opacity: 1, x: 0 },
                  sale: d => ({ opacity: 0, x: d * -40 }),
                }}
                initial="entra"
                animate="quieto"
                exit="sale"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onAnimationComplete={fase => {
                  // al cambiar de paso, el cursor queda listo en el primer campo
                  if (fase === "quieto" && navego.current)
                    paso$.current?.querySelector("input:not([type=checkbox]), textarea, select")?.focus({ preventScroll: true });
                }}
              >
                <legend><span>{paso + 1}</span> {actual.titulo}</legend>

                {actual.id === "ooc" && <>
                  <div className="fila">
                    <Campo etiqueta="Usuario de Discord" error={errores.discord}>
                      <input name="discord" required placeholder="usuario" defaultValue={v("discord")} />
                    </Campo>
                    <Campo etiqueta="Edad" error={errores.edad}>
                      <input name="edad" type="number" min="16" max="99" required defaultValue={v("edad")} />
                    </Campo>
                  </div>
                  <div className="fila">
                    <Campo etiqueta="¿Cuánto tiempo llevas haciendo rol?" error={errores.experiencia}>
                      <select name="experiencia" required defaultValue={v("experiencia")}>
                        <option value="">Elige una opción</option>
                        <option>Es mi primera vez</option>
                        <option>Menos de 6 meses</option>
                        <option>Entre 6 meses y 1 año</option>
                        <option>Más de 1 año</option>
                      </select>
                    </Campo>
                    <Campo etiqueta="¿Cómo conociste el servidor?">
                      <input name="referido" placeholder="TikTok, un amigo…" defaultValue={v("referido")} />
                    </Campo>
                  </div>
                </>}

                {actual.id === "pj" && <>
                  <div className="fila">
                    <Campo etiqueta="Nombre y apellido del personaje" error={errores.personaje}>
                      <input name="personaje" required placeholder="Ej: Andrés Quintero" defaultValue={v("personaje")} />
                    </Campo>
                    <Campo etiqueta="Edad del personaje" error={errores.edad_pj}>
                      <input name="edad_pj" type="number" min="18" max="90" required defaultValue={v("edad_pj")} />
                    </Campo>
                  </div>
                  <Texto etiqueta={<>Historia del personaje <span className="min">mínimo {MIN_HISTORIA} caracteres</span></>}
                    nombre="historia" min={MIN_HISTORIA} rows={7} error={errores.historia} valorInicial={v("historia")}
                    placeholder="De dónde viene, a qué se dedica, por qué llega a la ciudad…" />
                </>}

                {actual.pregunta && (
                  <Texto etiqueta={<span className="wl-pregunta">{actual.pregunta.texto}</span>}
                    nombre={actual.id} min={actual.pregunta.min} rows={5} error={errores[actual.id]}
                    valorInicial={v(actual.id)} placeholder="Responde con tus propias palabras…" />
                )}

                {esFinal && <>
                  <p className="wl-repaso">Ya casi. Revisa que tu usuario de Discord (<b>{datos.discord}</b>) esté bien escrito: por ahí te contactamos.</p>
                  <Casilla nombre="acepta" error={errores.acepta}>Leí y acepto la normativa del servidor.</Casilla>
                  <Casilla nombre="acepta_voz" error={errores.acepta_voz}>Acepto presentar la whitelist de voz en el Discord.</Casilla>
                </>}
              </motion.fieldset>
            </AnimatePresence>

            <div className="form-pie wl-nav">
              {paso > 0 && (
                <button type="button" className="btn btn-linea" onClick={() => irA(paso - 1)} disabled={enviando}>← Anterior</button>
              )}
              <motion.button type="submit" className={`btn ${esFinal ? "btn-brillo" : ""}`} disabled={enviando} whileTap={{ scale: 0.96 }}>
                {esFinal ? (enviando ? "Enviando…" : "Enviar solicitud") : "Siguiente →"}
              </motion.button>
              <Aviso aviso={aviso} />
            </div>
            <p className="nota">Tu avance se guarda solo en este navegador por si se te cierra la pestaña.</p>
          </form>
        )}
      </Aparecer>
    </section>
  );
}
