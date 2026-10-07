import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CAPITULOS, FECHA_REVISION } from "../data/normativa.js";
import { DELICTIVAS, LEGALES, EPS } from "../data/normativas-facciones.js";
import { Aparecer, Cabecera } from "./ui.jsx";

const NORMATIVAS = [
  { id: "general", nombre: "General", detalle: "Todo el servidor", capitulos: CAPITULOS, numerada: true },
  { id: "delictivas", nombre: "Delictivas", detalle: "Bandas, guerrillas y civiles", capitulos: DELICTIVAS },
  { id: "legales", nombre: "Legales", detalle: "Policía, Ejército, Fiscalía y Gobierno", capitulos: LEGALES },
  { id: "eps", nombre: "EPS", detalle: "Médicos", capitulos: EPS },
];

// sin tildes y en minúscula, conservando el largo del texto (para ubicar el resaltado)
const plano = t => [...t].map(c => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()[0] ?? c).join("");

// una norma es un texto (viñeta) o { p: "…" } (párrafo)
const texto = n => (typeof n === "string" ? n : n.p);
const coincide = (n, q) => !q || plano(texto(n).replace(/\*\*/g, "")).includes(q);

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

// agrupa las viñetas seguidas en una lista y deja los párrafos sueltos
function bloques(normas) {
  const salida = [];
  normas.forEach(n => {
    const ultimo = salida[salida.length - 1];
    if (typeof n === "string" && ultimo?.lista) ultimo.items.push(n);
    else salida.push(typeof n === "string" ? { lista: true, items: [n] } : { p: n.p });
  });
  return salida;
}

// el texto de cada capítulo siempre está en el HTML para que Google lo lea; cerrado solo se colapsa
function Capitulo({ c, numerada, origen, abierto, alternar, q, id }) {
  const normas = c.normas.filter(n => coincide(n, q));
  const visible = q ? true : abierto;
  const qr = q.length > 1 ? q : "";
  const Lista = numerada ? "ol" : "ul";
  let n = 0;   // para escalonar la entrada sin que tarde demasiado en capítulos largos
  const entrada = () => ({
    initial: false,
    animate: visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 },
    transition: { delay: visible ? 0.04 * Math.min(n++, 12) : 0 },
  });

  return (
    <motion.div layout className={`capitulo ${visible ? "abierto" : ""}`}>
      <h3 className="capitulo-titulo">
        <button type="button" className="capitulo-cab" aria-expanded={visible} aria-controls={id} onClick={alternar}>
          <span>{origen ?? c.cap}</span> {c.titulo}
          {q && <small className="coincidencias">{normas.length}</small>}
        </button>
      </h3>
      <motion.div
        id={id}
        className="capitulo-cuerpo"
        inert={!visible}
        initial={false}
        animate={visible ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="capitulo-texto">
          {bloques(normas).map((b, i) => b.lista ? (
            <Lista key={i} className={numerada ? "" : "vinetas"}>
              {b.items.map((t, j) => (
                <motion.li key={j} {...entrada()}>
                  <Norma texto={t} q={qr} />
                </motion.li>
              ))}
            </Lista>
          ) : (
            <motion.p key={i} {...entrada()}>
              <Norma texto={b.p} q={qr} />
            </motion.p>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

const clave = (norm, c) => `${norm.id}-${c.cap}`;

export default function Normativa() {
  const [busqueda, setBusqueda] = useState("");
  const [activa, setActiva] = useState(NORMATIVAS[0]);
  const [abierto, setAbierto] = useState(clave(NORMATIVAS[0], CAPITULOS[0]));
  const q = plano(busqueda.trim());

  // cuántas normas coinciden con la búsqueda en cada normativa
  const cuenta = norm => norm.capitulos.reduce((s, c) => s + c.normas.filter(n => coincide(n, q)).length, 0);
  const hayResultados = !q || NORMATIVAS.some(norm => cuenta(norm) > 0);

  function elegir(norm) {
    setBusqueda("");
    setActiva(norm);
    setAbierto(clave(norm, norm.capitulos[0]));
  }

  // todas las normativas van en el HTML; buscando se muestra lo que coincide en todas,
  // si no, solo la pestaña elegida (las demás quedan ocultas)
  const lista = NORMATIVAS.flatMap(norm => norm.capitulos.map(c => ({ norm, c })));
  const seVe = ({ norm, c }) => (q ? c.normas.some(n => coincide(n, q)) : norm.id === activa.id);

  return (
    <section id="normativa" className="bloque">
      <Cabecera num="02" titulo="Normativa">
        Desconocer una norma no te libra de la sanción. Última revisión: <time dateTime={FECHA_REVISION.iso}>{FECHA_REVISION.texto}</time>.
      </Cabecera>

      <Aparecer className="pestanas" role="tablist" aria-label="Normativas">
        {NORMATIVAS.map(norm => {
          const n = q ? cuenta(norm) : null;
          return (
            <button
              key={norm.id}
              type="button"
              role="tab"
              aria-selected={!q && activa.id === norm.id}
              className={`pestana ${!q && activa.id === norm.id ? "activa" : ""} ${n === 0 ? "vacia" : ""}`}
              onClick={() => elegir(norm)}
            >
              <b>{norm.nombre}</b>
              <small>{norm.detalle}</small>
              {q && <i className="coincidencias">{n}</i>}
            </button>
          );
        })}
      </Aparecer>

      <Aparecer className="buscador">
        <label htmlFor="buscar-norma" className="sr">Buscar en las normativas</label>
        <input
          type="search"
          id="buscar-norma"
          placeholder="Buscar en todas las normativas: robo, secuestro, cateo, ascenso…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {!hayResultados && <small>No hay normas con esa palabra.</small>}
      </Aparecer>

      <div className="normas">
        {lista.map(({ norm, c }, i) => (
          <Aparecer key={clave(norm, c)} delay={Math.min(i, 8) * 0.06} y={20} hidden={!seVe({ norm, c })}>
            <Capitulo
              id={`norma-${clave(norm, c)}`}
              c={c}
              numerada={norm.numerada}
              origen={q ? norm.nombre : null}
              q={q}
              abierto={abierto === clave(norm, c)}
              alternar={() => setAbierto(a => (a === clave(norm, c) ? null : clave(norm, c)))}
            />
          </Aparecer>
        ))}
      </div>
    </section>
  );
}
