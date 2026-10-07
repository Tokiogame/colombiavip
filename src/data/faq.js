// Preguntas frecuentes. Lo que va entre `comillas invertidas` sale como código.
// Las usa la sección de la web y el JSON-LD (FAQPage) que se genera al compilar.
import { CONNECT } from "../config.js";

export const PREGUNTAS = [
  ["¿Cómo me conecto al servidor?", `Abre FiveM, presiona F8 y escribe \`${CONNECT}\`. También puedes usar el botón «Conectarse» de arriba.`],
  ["¿Cómo hago la whitelist?", "Es de voz y se hace en el Discord: entra al canal de voz de whitelist y espera a que un staff te atienda. Necesitas micrófono y haberte leído la normativa."],
  ["Me rechazaron la whitelist, ¿puedo volver a intentarlo?", "Sí, a los 3 días. Revisa lo que te dijeron y vuelve a leer la normativa antes de presentarla otra vez."],
  ["¿El servidor es gratis?", "Sí, entrar es totalmente gratis. La tienda VIP es opcional: sirve para apoyar al servidor y llevarte carros, motos y otras cosas para tu personaje."],
  ["¿Cómo compro algo de la tienda VIP?", "En la página VIP escoge el artículo y dale a «Pedir». Se copia un mensaje que pegas en tu ticket del Discord y el staff te explica cómo pagar."],
  ["¿Necesito tener GTA V original?", "Sí. Necesitas GTA V legal (Steam, Epic o Rockstar) y FiveM instalado."],
  ["¿Puedo entrar a la Policía, el Ejército, la Fiscalía o los EMS apenas llego?", "No. Primero necesitas la whitelist aprobada y luego postularte desde la sección de Postulaciones. Cada facción revisa sus solicitudes."],
  ["Me banearon y creo que fue injusto, ¿qué hago?", "Abre un ticket de apelación en el Discord con pruebas (clip o captura). Nada de reclamar por privado a los staff."],
];

// texto sin las comillas invertidas (para el JSON-LD)
export const sinFormato = t => t.replace(/`/g, "");
