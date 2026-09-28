import { useRef, useState } from "react";
import { motion } from "motion/react";
import { WEBHOOK_URL, ROL_STAFF_ID } from "../config.js";
import { sb } from "../lib/supabase.js";
import { entregar, slug } from "../lib/envio.js";
import { Aparecer, Cabecera, Tarjeta3D } from "./ui.jsx";
import { Aviso, Campo, Casilla, Texto, resumenErrores, validar } from "./formulario.jsx";

const CLAVE_BORRADOR = "wl-borrador";

function leerBorrador() {
  try { return JSON.parse(localStorage.getItem(CLAVE_BORRADOR) || "{}"); } catch (e) { return {}; }
}

const FASES = [
  ["Fase 1", "Whitelist escrita", "Llena el formulario de abajo con tus propias palabras. Si copias y pegas de internet, se nota y se rechaza."],
  ["Fase 2", "Whitelist de voz", "Si apruebas la escrita, te citamos en el Discord para una entrevista con el staff. Necesitas micrófono y te haremos preguntas de rol y de la normativa."],
];

export default function Whitelist() {
  const form = useRef(null);
  const [version, setVersion] = useState(0);   // cambia para vaciar el formulario
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const b = version === 0 ? leerBorrador() : {};

  function alEscribir(e) {
    const nombre = e.target.name;
    if (errores[nombre]) setErrores(({ [nombre]: _, ...resto }) => resto);
    try {
      const datos = Object.fromEntries(new FormData(form.current));
      delete datos.acepta;
      delete datos.acepta_voz;
      localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
    } catch (err) {}
  }

  async function enviar(e) {
    e.preventDefault();
    const errs = validar(form.current);
    setErrores(errs);
    const n = Object.keys(errs).length;
    if (n) return setAviso({ texto: resumenErrores(n), tipo: "mal" });

    if (!sb && !WEBHOOK_URL)
      return setAviso({ texto: "Falta configurar Supabase o el webhook de Discord en src/config.js.", tipo: "mal" });

    const d = Object.fromEntries(new FormData(form.current));
    setEnviando(true);
    setAviso({ texto: "Enviando…" });

    const datos = [
      { p: "Edad", r: d.edad },
      { p: "Experiencia en rol", r: d.experiencia },
      { p: "Nos conoció por", r: d.referido || "-" },
      { p: "Edad del personaje", r: d.edad_pj },
      { p: "Historia del personaje", r: d.historia },
      { p: "¿Qué es metagaming?", r: d.mg },
      { p: "¿Qué es powergaming?", r: d.pg },
      { p: "Atraco con arma en el bolsillo", r: d.caso1 },
      { p: "Info recibida por Discord", r: d.caso2 },
    ];

    const txt = [
      `WHITELIST — ${d.personaje}`,
      `Fecha: ${new Date().toLocaleString("es-CO")}`,
      `Discord: ${d.discord}`,
      "Acepta WL de voz: Sí",
      "",
      ...datos.flatMap(x => [x.p + ":", x.r, ""]),
    ].join("\n");

    try {
      await entregar(
        { tipo: "whitelist", discord: d.discord.trim(), personaje: d.personaje.trim(), datos },
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
      setVersion(v => v + 1);
      setAviso({ texto: "¡Listo! Tu solicitud llegó al staff. Pendiente del Discord.", tipo: "bien" });
    } catch (err) {
      setAviso({ texto: "No se pudo enviar. Intenta de nuevo en un rato o avisa en el Discord.", tipo: "mal" });
    } finally {
      setEnviando(false);
    }
  }

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
        <form key={version} ref={form} className="formulario" noValidate onSubmit={enviar} onInput={alEscribir} onChange={alEscribir}>
          <fieldset>
            <legend><span>A</span> Datos fuera del rol (OOC)</legend>
            <div className="fila">
              <Campo etiqueta="Usuario de Discord" error={errores.discord}>
                <input name="discord" required placeholder="usuario" defaultValue={b.discord} />
              </Campo>
              <Campo etiqueta="Edad" error={errores.edad}>
                <input name="edad" type="number" min="16" max="99" required defaultValue={b.edad} />
              </Campo>
            </div>
            <div className="fila">
              <Campo etiqueta="¿Cuánto tiempo llevas haciendo rol?" error={errores.experiencia}>
                <select name="experiencia" required defaultValue={b.experiencia || ""}>
                  <option value="">Elige una opción</option>
                  <option>Es mi primera vez</option>
                  <option>Menos de 6 meses</option>
                  <option>Entre 6 meses y 1 año</option>
                  <option>Más de 1 año</option>
                </select>
              </Campo>
              <Campo etiqueta="¿Cómo conociste el servidor?">
                <input name="referido" placeholder="TikTok, un amigo…" defaultValue={b.referido} />
              </Campo>
            </div>
          </fieldset>

          <fieldset>
            <legend><span>B</span> Tu personaje (IC)</legend>
            <div className="fila">
              <Campo etiqueta="Nombre y apellido del personaje" error={errores.personaje}>
                <input name="personaje" required placeholder="Ej: Andrés Quintero" defaultValue={b.personaje} />
              </Campo>
              <Campo etiqueta="Edad del personaje" error={errores.edad_pj}>
                <input name="edad_pj" type="number" min="18" max="90" required defaultValue={b.edad_pj} />
              </Campo>
            </div>
            <Texto etiqueta={<>Historia del personaje <span className="min">mínimo 400 caracteres</span></>}
              nombre="historia" min={400} rows={7} error={errores.historia} valorInicial={b.historia}
              placeholder="De dónde viene, a qué se dedica, por qué llega a la ciudad…" />
          </fieldset>

          <fieldset>
            <legend><span>C</span> Conocimientos de rol</legend>
            <Texto etiqueta="Explica con tus palabras qué es el metagaming y pon un ejemplo." nombre="mg" min={80} error={errores.mg} valorInicial={b.mg} />
            <Texto etiqueta="¿Qué es el powergaming? Da un ejemplo." nombre="pg" min={80} error={errores.pg} valorInicial={b.pg} />
            <Texto etiqueta="Te están atracando con un arma y tú tienes una en el bolsillo. ¿Qué haces y por qué?" nombre="caso1" min={80} error={errores.caso1} valorInicial={b.caso1} />
            <Texto etiqueta="Un amigo te dice por Discord dónde está escondido el que te robó. ¿Puedes ir a buscarlo en el rol?" nombre="caso2" min={60} error={errores.caso2} valorInicial={b.caso2} />
          </fieldset>

          <Casilla nombre="acepta" error={errores.acepta}>Leí y acepto la normativa del servidor.</Casilla>
          <Casilla nombre="acepta_voz" error={errores.acepta_voz}>Acepto presentar la whitelist de voz en el Discord.</Casilla>

          <div className="form-pie">
            <motion.button type="submit" className="btn btn-brillo" disabled={enviando} whileTap={{ scale: 0.96 }}>
              {enviando ? "Enviando…" : "Enviar solicitud"}
            </motion.button>
            <Aviso aviso={aviso} />
          </div>
          <p className="nota">Tu borrador se guarda solo en este navegador por si se te cierra la pestaña.</p>
        </form>
      </Aparecer>
    </section>
  );
}
