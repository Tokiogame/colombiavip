import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CONNECT } from "../config.js";
import { Aparecer, Cabecera } from "./ui.jsx";

const PREGUNTAS = [
  ["¿Cómo me conecto al servidor?", <>Abre FiveM, presiona F8 y escribe <code>{CONNECT}</code>. También puedes usar el botón «Conectarse» de arriba.</>],
  ["¿Cuánto se demora en revisar mi whitelist?", "La escrita se revisa normalmente entre 24 y 72 horas. Si la apruebas, te citamos por el Discord para la whitelist de voz, así que no te salgas del servidor."],
  ["Me rechazaron la whitelist, ¿puedo volver a intentarlo?", "Sí, a los 3 días. Revisa lo que te dijeron y vuelve a leer la normativa antes de mandarla otra vez."],
  ["¿El servidor es gratis?", "Sí, entrar es totalmente gratis. La tienda VIP es opcional: sirve para apoyar al servidor y llevarte carros, motos y otras cosas para tu personaje."],
  ["¿Cómo compro algo de la tienda VIP?", "En la página VIP escoge el artículo y dale a «Pedir». Se copia un mensaje que pegas en tu ticket del Discord y el staff te explica cómo pagar."],
  ["¿Necesito tener GTA V original?", "Sí. Necesitas GTA V legal (Steam, Epic o Rockstar) y FiveM instalado."],
  ["¿Puedo entrar a la Policía, el Ejército, la Fiscalía o los EMS apenas llego?", "No. Primero necesitas la whitelist aprobada y luego postularte desde la sección de Postulaciones. Cada facción revisa sus solicitudes."],
  ["Me banearon y creo que fue injusto, ¿qué hago?", "Abre un ticket de apelación en el Discord con pruebas (clip o captura). Nada de reclamar por privado a los staff."],
];

export default function Faq() {
  const [abierta, setAbierta] = useState(-1);

  return (
    <section id="faq" className="bloque bloque-alt">
      <Cabecera num="07" titulo="Preguntas frecuentes" />

      <div className="faq">
        {PREGUNTAS.map(([pregunta, respuesta], i) => (
          <Aparecer key={pregunta} delay={i * 0.05} y={16}>
            <div className={`faq-item ${abierta === i ? "abierta" : ""}`}>
              <button type="button" aria-expanded={abierta === i} onClick={() => setAbierta(a => (a === i ? -1 : i))}>
                {pregunta}
                <motion.span className="faq-mas" animate={{ rotate: abierta === i ? 45 : 0 }}>+</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {abierta === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: "hidden" }}>
                    <p>{respuesta}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Aparecer>
        ))}
      </div>
    </section>
  );
}
