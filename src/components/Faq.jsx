import { useState } from "react";
import { motion } from "motion/react";
import { PREGUNTAS } from "../data/faq.js";
import { Aparecer, Cabecera } from "./ui.jsx";

// `connect …` -> <code>connect …</code>
const conCodigo = t => t.split(/`([^`]+)`/).map((p, i) => (i % 2 ? <code key={i}>{p}</code> : p));

export default function Faq() {
  const [abierta, setAbierta] = useState(-1);

  return (
    <section id="faq" className="bloque bloque-alt">
      <Cabecera num="08" titulo="Preguntas frecuentes" />

      <div className="faq">
        {PREGUNTAS.map(([pregunta, respuesta], i) => (
          <Aparecer key={pregunta} delay={i * 0.05} y={16}>
            <div className={`faq-item ${abierta === i ? "abierta" : ""}`}>
              <h3 className="faq-preg">
                <button type="button" aria-expanded={abierta === i} aria-controls={`faq-${i}`} onClick={() => setAbierta(a => (a === i ? -1 : i))}>
                  {pregunta}
                  <motion.span className="faq-mas" animate={{ rotate: abierta === i ? 45 : 0 }}>+</motion.span>
                </button>
              </h3>
              {/* la respuesta siempre está en el HTML (Google la lee); cerrada solo se colapsa */}
              <motion.div id={`faq-${i}`} initial={false} inert={abierta !== i}
                animate={abierta === i ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: "hidden" }}>
                <p>{conCodigo(respuesta)}</p>
              </motion.div>
            </div>
          </Aparecer>
        ))}
      </div>
    </section>
  );
}
