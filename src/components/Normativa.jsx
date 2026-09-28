import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CAPITULOS, FECHA_REVISION } from "../data/normativa.js";
import { Aparecer, Cabecera } from "./ui.jsx";

// sin tildes y en minúscula, conservando el largo del texto (para ubicar el resaltado)
const plano = t => [...t].map(c => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()[0] ?? c).join("");

// "**negrita** normal" -> [{ b: true, t: "negrita" }, { b: false, t: " normal" }]
const partes = texto => texto.split(/(\*\*[^*]+\*\*)/).filter(Boolean)
  .map(t => (t.startsWith("**") ? { b: true, t: t.slice(2, -2) } : { b: false, t }));

function resaltar(texto, q) {
  if (q.length < 2) return texto;
  const p = plano(texto);
  const salida = [];
  let desde = 0;
  let i;
  while ((i = p.indexOf(q, desde)) !== -1) {
    if (i > desde) salida.push(texto.slice(desde, i));
    salida.push(<mark key={i}>{texto.slice(i, i + q.length)}</mark>);
    desde = i + q.length;
  }
  salida.push(texto.slice(desde));
  return salida;
}

function Norma({ texto, q }) {
  return partes(texto).map((p, i) =>
    p.b ? <b key={i}>{resaltar(p.t, q)}</b> : <span key={i}>{resaltar(p.t, q)}</span>);
}

function Capitulo({ c, abierto, alternar, q }) {
  const normas = c.normas.filter(n => !q || plano(n.replace(/\*\*/g, "")).includes(q));
  if (q && !normas.length) return null;
  const visible = q ? true : abierto;

  return (
    <motion.div layout className={`capitulo ${visible ? "abierto" : ""}`}>
      <button type="button" className="capitulo-cab" aria-expanded={visible} onClick={alternar}>
        <span>{c.cap}</span> {c.titulo}
        {q && <small className="coincidencias">{normas.length}</small>}
      </button>
      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            className="capitulo-cuerpo"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ol>
              {normas.map((n, i) => (
                <motion.li key={n} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Norma texto={n} q={q.length > 1 ? q : ""} />
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Normativa() {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(0);
  const q = plano(busqueda.trim());

  const hayResultados = !q || CAPITULOS.some(c => c.normas.some(n => plano(n.replace(/\*\*/g, "")).includes(q)));

  return (
    <section id="normativa" className="bloque">
      <Cabecera num="02" titulo="Normativa">
        Desconocer una norma no te libra de la sanción. Última revisión: <time dateTime={FECHA_REVISION.iso}>{FECHA_REVISION.texto}</time>.
      </Cabecera>

      <Aparecer className="buscador">
        <label htmlFor="buscar-norma" className="sr">Buscar en la normativa</label>
        <input
          type="search"
          id="buscar-norma"
          placeholder="Buscar en la normativa: robo, rehenes, metagaming…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {!hayResultados && <small>No hay normas con esa palabra.</small>}
      </Aparecer>

      <div className="normas">
        {CAPITULOS.map((c, i) => (q && !c.normas.some(n => plano(n.replace(/\*\*/g, "")).includes(q))) ? null : (
          <Aparecer key={c.cap} delay={i * 0.06} y={20}>
            <Capitulo c={c} q={q} abierto={abierto === i} alternar={() => setAbierto(a => (a === i ? -1 : i))} />
          </Aparecer>
        ))}
      </div>
    </section>
  );
}
