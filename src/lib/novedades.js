/* Novedades: lo comparten la web, el prerender (scripts/prerender.js), el panel y api/novedades.js.
   Sin React ni navegador para que funcione en todos lados. */

export const TIPOS = {
  actualizacion: { nombre: "Actualización", color: "#e0b02c" },
  evento: { nombre: "Evento", color: "#3ecf6e" },
  parche: { nombre: "Parche", color: "#4b82e8" },
  anuncio: { nombre: "Anuncio", color: "#e5484d" },
};
export const tipoDe = t => TIPOS[t] || TIPOS.actualizacion;

// lo que necesita una tarjeta (sin el texto completo, para no cargar de más)
export const CAMPOS_TARJETA = "slug, titulo, tipo, resumen, imagen, fecha";

export const rutaNovedad = slug => `/novedades/${slug}`;

// "Nuevos trabajos: taxi y grúa" -> "nuevos-trabajos-taxi-y-grua"
export const crearSlug = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "");

// fecha en hora de Colombia, escrita igual en el servidor y en el navegador
// (sin Intl: así el HTML prerenderizado y el de React coinciden siempre)
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function fechaTexto(iso) {
  const d = new Date(Date.parse(iso) - 5 * 3600e3);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

// publicada hace menos de 7 días (para el punto de "nuevo" del menú)
export const esReciente = (iso, ahora = Date.now()) => ahora - Date.parse(iso) < 7 * 864e5;

/* ---------- texto de la novedad ----------
   Se escribe igual que un mensaje de Discord, así el staff puede copiar el anuncio y pegarlo:
     # / ## / ### Título    -> subtítulo
     > cita  ·  >>> cita    -> bloque de cita (>>> toma todo lo que sigue)
     -# texto               -> letra pequeña
     - algo  ·  1. algo     -> viñetas / lista numerada
     **negrita**  *cursiva*  __subrayado__  ~~tachado~~  `código`  ||spoiler||
     [texto](https://…) y links sueltos
     <:emoji:123>           -> emoji propio del servidor (se ve con la imagen de Discord)
   Las menciones (@everyone, @here, <@…>, <#…>) no se muestran en la web.
   Se convierte en bloques y luego cada quien los pinta (React en la web, texto en Discord). */
const MENCION = /@everyone|@here|<@[!&]?\d+>|<#\d+>|<id:\w+>/g;

// lo que se ve en la web: sin menciones ni espacios de más al final de cada línea
const limpiar = texto => String(texto || "").replace(/\r/g, "")
  .replace(/<t:(\d+)(?::\w)?>/g, (_, s) => fechaTexto(new Date(s * 1000).toISOString()))
  .replace(MENCION, "").replace(/[ \t]+$/gm, "");

export function bloques(texto) {
  const lineas = limpiar(texto).split("\n");
  const salida = [];
  let parrafo = [];
  const cerrar = () => { if (parrafo.length) salida.push({ tipo: "p", texto: parrafo.join("\n") }); parrafo = []; };
  // viñetas y números seguidos (aunque haya líneas en blanco entre ellos) van en la misma lista
  const enLista = (tipo, item) => {
    cerrar();
    const ultimo = salida[salida.length - 1];
    if (ultimo?.tipo === tipo) ultimo.items.push(item);
    else salida.push({ tipo, items: [item] });
  };

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    let m;
    if (/^>>> ?/.test(l)) {
      cerrar();
      salida.push({ tipo: "cita", bloques: bloques([l.replace(/^>>> ?/, ""), ...lineas.slice(i + 1)].join("\n")) });
      break;
    }
    if (/^> ?/.test(l)) {
      cerrar();
      const dentro = [];
      for (; i < lineas.length && /^> ?/.test(lineas[i]); i++) dentro.push(lineas[i].replace(/^> ?/, ""));
      i--;
      const b = bloques(dentro.join("\n"));
      if (b.length) salida.push({ tipo: "cita", bloques: b });
      continue;
    }
    if (!l.trim()) { cerrar(); continue; }
    if ((m = l.match(/^-#\s+(.*)/))) { cerrar(); salida.push({ tipo: "sub", texto: m[1] }); }
    else if ((m = l.match(/^(#{1,3})\s+(.*)/))) { cerrar(); salida.push({ tipo: m[1].length === 3 ? "h3" : "h2", texto: m[2] }); }
    else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) enLista("ul", m[1]);
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) enLista("ol", m[1]);
    else parrafo.push(l.trim());
  }
  cerrar();
  return salida;
}

// formato dentro de una línea. Devuelve nodos:
//   { t: "texto" } · { tag: "b" | "i" | "u" | "s" | "code" | "spoiler", hijos: [...] }
//   { tag: "a", href, hijos: [...] } · { emoji: "https://cdn.discordapp.com/…", nombre }
const EN_LINEA = new RegExp([
  /\*\*\*(.+?)\*\*\*/,                               // 1 negrita + cursiva
  /\*\*(.+?)\*\*/,                                   // 2 negrita
  /__(.+?)__/,                                       // 3 subrayado
  /\*(?!\s)(.+?)\*/,                                 // 4 cursiva
  /(?<![\w])_(?!\s)(.+?)_(?![\w])/,                  // 5 cursiva
  /~~(.+?)~~/,                                       // 6 tachado
  /\|\|(.+?)\|\|/,                                   // 7 spoiler
  /`([^`]+)`/,                                       // 8 código
  /\[([^\]]+)\]\(<?(https?:\/\/[^)\s>]+)>?\)/,       // 9-10 enlace con texto
  /<(a?):(\w+):(\d+)>/,                              // 11-13 emoji del servidor
  /<?(https?:\/\/[^\s<>]*[^\s<>.,;:!?)'"])>?/,       // 14 link suelto
].map(r => r.source).join("|"), "g");

export function enLinea(texto) {
  const salida = [];
  const re = new RegExp(EN_LINEA);
  let desde = 0, m;
  while ((m = re.exec(texto))) {
    if (m.index > desde) salida.push({ t: texto.slice(desde, m.index) });
    salida.push(
      m[1] ? { tag: "b", hijos: [{ tag: "i", hijos: enLinea(m[1]) }] }
      : m[2] ? { tag: "b", hijos: enLinea(m[2]) }
      : m[3] ? { tag: "u", hijos: enLinea(m[3]) }
      : m[4] || m[5] ? { tag: "i", hijos: enLinea(m[4] || m[5]) }
      : m[6] ? { tag: "s", hijos: enLinea(m[6]) }
      : m[7] ? { tag: "spoiler", hijos: enLinea(m[7]) }
      : m[8] ? { tag: "code", hijos: [{ t: m[8] }] }
      : m[9] ? { tag: "a", href: m[10], hijos: enLinea(m[9]) }
      : m[12] ? { emoji: `https://cdn.discordapp.com/emojis/${m[13]}.${m[11] ? "gif" : "webp"}?size=48`, nombre: m[12] }
      : { tag: "a", href: m[14], hijos: [{ t: m[14] }] });
    desde = re.lastIndex;
  }
  if (desde < texto.length) salida.push({ t: texto.slice(desde) });
  return salida;
}

// texto plano (para descripciones, JSON-LD y Discord)
const plano = nodos => nodos.map(n => n.t ?? (n.emoji ? "" : plano(n.hijos))).join("");
const planoBloque = b => b.tipo === "cita" ? b.bloques.map(planoBloque).join(" ")
  : b.items ? b.items.map(t => plano(enLinea(t))).join(" · ")
  : plano(enLinea(b.texto));
export const textoPlano = t => bloques(t).map(planoBloque).join(" ").replace(/\s+/g, " ").trim();

// todas las imágenes de una novedad: la portada y después la galería
export const imagenesDe = n => [n.imagen, ...(n.galeria || [])].filter(Boolean);
export const MAX_IMAGENES = 10;
