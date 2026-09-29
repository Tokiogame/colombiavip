/* ============================================
   BANCO DE PREGUNTAS — whitelist escrita
   ============================================
   A cada persona le salen al azar CANT_CONCEPTOS preguntas de "concepto"
   y CANT_SITUACIONES de "situacion", así nadie tiene el mismo examen.
   - id: único y sin espacios. Si lo cambias, a quien tenga un borrador
     guardado se le sortea otra pregunta en su lugar.
   - min: mínimo de caracteres de la respuesta.
   Puedes agregar, quitar o cambiar preguntas libremente.
*/

export const CANT_CONCEPTOS = 3;
export const CANT_SITUACIONES = 3;

export const PREGUNTAS_WL = [
  // ---------- conceptos ----------
  { id: "mg", tipo: "concepto", min: 80, texto: "Explica con tus palabras qué es el metagaming (MG) y pon un ejemplo." },
  { id: "pg", tipo: "concepto", min: 80, texto: "¿Qué es el powergaming (PG)? Da un ejemplo." },
  { id: "ic-ooc", tipo: "concepto", min: 80, texto: "¿Qué diferencia hay entre IC (dentro del personaje) y OOC (fuera del personaje)? ¿Cuándo está bien hablar OOC?" },
  { id: "nvl", tipo: "concepto", min: 80, texto: "¿Qué significa no valorar la vida (NVL)? Pon un ejemplo de algo que sería NVL." },
  { id: "pk-ck", tipo: "concepto", min: 80, texto: "¿Qué diferencia hay entre un PK y un CK? ¿Qué pasa con tu personaje en cada caso?" },
  { id: "rdm", tipo: "concepto", min: 60, texto: "¿Qué es el RDM (Random Deathmatch) y por qué está prohibido?" },
  { id: "vdm", tipo: "concepto", min: 60, texto: "¿Qué es el VDM (Vehicle Deathmatch)? Da un ejemplo." },
  { id: "fairplay", tipo: "concepto", min: 80, texto: "¿Qué es el fair play (juego limpio) en el rol? Explícalo con un ejemplo." },
  { id: "zona-segura", tipo: "concepto", min: 60, texto: "¿Qué es una zona segura y qué cosas no se pueden hacer en ella?" },
  { id: "rol-entorno", tipo: "concepto", min: 80, texto: "¿Qué es el rol de entorno y por qué es importante para la ciudad?" },
  { id: "forzar-rol", tipo: "concepto", min: 80, texto: "¿Qué es forzar el rol? Pon un ejemplo de alguien forzando rol a otro jugador." },
  { id: "bugs", tipo: "concepto", min: 60, texto: "¿Qué haces si encuentras un bug que te da dinero o ventaja? ¿Por qué?" },
  { id: "combat-log", tipo: "concepto", min: 60, texto: "¿Qué es el combat logging (desconectarse en medio de un rol) y por qué se sanciona?" },

  // ---------- situaciones ----------
  { id: "atraco-arma", tipo: "situacion", min: 80, texto: "Te están atracando con un arma y tú tienes una en el bolsillo. ¿Qué haces y por qué?" },
  { id: "info-discord", tipo: "situacion", min: 60, texto: "Un amigo te dice por Discord dónde está escondido el que te robó. ¿Puedes ir a buscarlo en el rol? ¿Por qué?" },
  { id: "choque", tipo: "situacion", min: 80, texto: "Vas manejando a toda velocidad y chocas contra un poste. ¿Cómo sigues el rol?" },
  { id: "caido", tipo: "situacion", min: 80, texto: "Te dejan herido en el piso después de un tiroteo. ¿Qué haces mientras esperas a los EMS?" },
  { id: "rehen", tipo: "situacion", min: 80, texto: "Eres rehén en un atraco al banco. ¿Cómo actúa tu personaje?" },
  { id: "policia-para", tipo: "situacion", min: 80, texto: "La policía te para en un retén y tienes algo ilegal en el carro. ¿Qué haces?" },
  { id: "insulto-ooc", tipo: "situacion", min: 60, texto: "Otro jugador te insulta de verdad (OOC) por el micrófono en medio del rol. ¿Qué haces?" },
  { id: "rompe-rol", tipo: "situacion", min: 60, texto: "Estás en medio de un rol y otro jugador lo rompe a propósito. ¿Qué haces en ese momento y después?" },
  { id: "falla-juego", tipo: "situacion", min: 60, texto: "Se te cae el juego en medio de una persecución con la policía. ¿Qué haces cuando vuelves a entrar?" },
  { id: "nuevo", tipo: "situacion", min: 80, texto: "Acabas de llegar a la ciudad sin dinero ni trabajo. ¿Cómo empiezas a construir la vida de tu personaje?" },
  { id: "amigo-staff", tipo: "situacion", min: 60, texto: "Tienes un amigo en el staff y te ofrece dinero o un carro dentro del juego. ¿Qué haces?" },
];

// mezcla (Fisher–Yates) y toma las primeras n
function sortear(lista, n) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, n);
}

// arma el examen de una persona. Si trae ids de un borrador, conserva los que
// sigan existiendo y completa lo que falte con otras al azar.
export function armarExamen(idsGuardados = []) {
  const porId = new Map(PREGUNTAS_WL.map(p => [p.id, p]));
  const guardadas = idsGuardados.map(id => porId.get(id)).filter(Boolean);

  const cupo = { concepto: CANT_CONCEPTOS, situacion: CANT_SITUACIONES };

  // las del borrador se quedan en su mismo orden (hasta llenar el cupo de cada tipo)
  const ya = guardadas.filter(p => cupo[p.tipo]-- > 0);

  // lo que falte se sortea; conceptos y situaciones mezclados entre sí
  const nuevas = sortear([
    ...sortear(PREGUNTAS_WL.filter(p => p.tipo === "concepto" && !ya.includes(p)), Math.max(0, cupo.concepto)),
    ...sortear(PREGUNTAS_WL.filter(p => p.tipo === "situacion" && !ya.includes(p)), Math.max(0, cupo.situacion)),
  ], Infinity);

  return [...ya, ...nuevas];
}
