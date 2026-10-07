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
   Formato sencillo que escribe el staff en el panel:
     línea en blanco      -> párrafo nuevo
     ## Subtítulo         -> subtítulo
     - algo               -> viñeta
     **negrita**
     [texto](https://…)   -> enlace
   Se convierte en bloques y luego cada quien los pinta (React en la web, texto en Discord). */
export function bloques(texto) {
  const salida = [];
  for (const parte of String(texto || "").replace(/\r/g, "").split(/\n{2,}/)) {
    const lineas = parte.split("\n").map(l => l.trimEnd()).filter(l => l.trim());
    let parrafo = [];
    const cerrar = () => { if (parrafo.length) salida.push({ tipo: "p", texto: parrafo.join("\n") }); parrafo = []; };
    for (const l of lineas) {
      if (/^##\s+/.test(l)) { cerrar(); salida.push({ tipo: "h2", texto: l.replace(/^##\s+/, "") }); }
      else if (/^\s*[-*•]\s+/.test(l)) {
        cerrar();
        const item = l.replace(/^\s*[-*•]\s+/, "");
        const ultimo = salida[salida.length - 1];
        if (ultimo?.tipo === "ul") ultimo.items.push(item);
        else salida.push({ tipo: "ul", items: [item] });
      } else parrafo.push(l.trim());
    }
    cerrar();
  }
  return salida;
}

// "hola **mundo** y [link](https://x)" -> [{ t: "hola " }, { b: "mundo" }, { t: " y " }, { a: "link", href: "https://x" }]
export function enLinea(texto) {
  const salida = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let desde = 0, m;
  while ((m = re.exec(texto))) {
    if (m.index > desde) salida.push({ t: texto.slice(desde, m.index) });
    salida.push(m[1] ? { b: m[1] } : { a: m[2], href: m[3] });
    desde = re.lastIndex;
  }
  if (desde < texto.length) salida.push({ t: texto.slice(desde) });
  return salida;
}

// texto plano (para descripciones, JSON-LD y Discord)
export const textoPlano = t => String(t || "")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "").replace(/^##\s+/gm, "").trim();
