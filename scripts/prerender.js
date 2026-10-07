// Después de `vite build`: genera el HTML de cada página (inicio, /novedades y una por
// cada novedad publicada), con su <head> para Google y redes, y el sitemap.xml.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { SITE_URL, SUPABASE_URL, SUPABASE_KEY } from "../src/config.js";
import { PREGUNTAS, sinFormato } from "../src/data/faq.js";
import { CAMPOS_TARJETA, rutaNovedad, textoPlano, tipoDe } from "../src/lib/novedades.js";

const dist = resolve(import.meta.dirname, "../dist");
const ssr = resolve(import.meta.dirname, "../dist-ssr");
const { render } = await import(pathToFileURL(resolve(ssr, "entry-server.js")).href);

const url = ruta => SITE_URL + ruta.replace(/^\//, "");
const attr = t => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const json = o => JSON.stringify(o).replace(/</g, "\\u003c");
const recorta = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t);

/* ---------- novedades publicadas ---------- */
let novedades = [];
try {
  // para probar en local sin tocar Supabase: NOVEDADES_PRUEBA=archivo.json npm run build
  if (process.env.NOVEDADES_PRUEBA) novedades = JSON.parse(await readFile(process.env.NOVEDADES_PRUEBA, "utf8"));
  else {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/novedades?select=*&publicado=eq.true&order=fecha.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    novedades = await r.json();
  }
  novedades = novedades.filter(n => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(n.slug));
} catch (err) {
  // sin la tabla o sin red la web igual se publica, solo que sin novedades
  console.warn("prerender: no se pudieron leer las novedades —", err.message);
}
const campos = CAMPOS_TARJETA.split(", ");
const tarjeta = n => Object.fromEntries(campos.map(c => [c, n[c]]));
const tarjetas = novedades.map(tarjeta);

/* ---------- plantilla ---------- */
const plantilla = await readFile(resolve(dist, "index.html"), "utf8");
if (!plantilla.includes('<div id="root"></div>')) throw new Error('No encontré <div id="root"></div> en dist/index.html');

function cambiarMeta(html, clave, valor) {
  const re = new RegExp(`(<meta (?:name|property)="${clave}" content=")[^"]*(")`);
  if (re.test(html)) return html.replace(re, `$1${attr(valor)}$2`);
  return html.replace("</head>", `  <meta property="${clave}" content="${attr(valor)}">\n</head>`);
}

function pagina({ ruta, datos, meta, jsonld = [] }) {
  let html = plantilla;
  if (meta) {
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${attr(meta.titulo)}</title>`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${meta.url}$2`);
    const pares = {
      description: meta.descripcion,
      "og:type": meta.tipo || "website",
      "og:url": meta.url,
      "og:title": meta.tituloCorto || meta.titulo,
      "og:description": meta.descripcion,
      "twitter:title": meta.tituloCorto || meta.titulo,
      "twitter:description": meta.descripcion,
    };
    if (meta.imagen) Object.assign(pares, { "og:image": meta.imagen, "twitter:image": meta.imagen, "og:image:alt": meta.tituloCorto || meta.titulo });
    if (meta.publicado) pares["article:published_time"] = meta.publicado;
    for (const [k, v] of Object.entries(pares)) html = cambiarMeta(html, k, v);
  }
  const scripts = [
    ...jsonld.map(j => `<script type="application/ld+json">${json(j)}</script>`),
    `<script id="datos-pagina" type="application/json">${json({ ruta, datos })}</script>`,
  ].map(s => "  " + s).join("\n");
  return html
    .replace('<div id="root"></div>', `<div id="root">${render(ruta, datos)}</div>`)
    .replace("</head>", `${scripts}\n</head>`);
}

async function escribir(ruta, html) {
  const carpeta = resolve(dist, "." + ruta);
  await mkdir(carpeta, { recursive: true });
  await writeFile(resolve(carpeta, "index.html"), html);
}

const migas = (...pasos) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: pasos.map(([nombre, ruta], i) => ({ "@type": "ListItem", position: i + 1, name: nombre, item: url(ruta) })),
});

/* ---------- inicio ---------- */
await writeFile(resolve(dist, "index.html"), pagina({
  ruta: { pagina: "inicio" },
  datos: { recientes: tarjetas.slice(0, 3) },
  jsonld: [{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PREGUNTAS.map(([pregunta, respuesta]) => ({
      "@type": "Question",
      name: pregunta,
      acceptedAnswer: { "@type": "Answer", text: sinFormato(respuesta) },
    })),
  }],
}));

/* ---------- /novedades ---------- */
await escribir("/novedades", pagina({
  ruta: { pagina: "novedades" },
  datos: { lista: tarjetas },
  meta: {
    titulo: "Novedades y actualizaciones · Colombia VIP RP",
    tituloCorto: "Novedades de Colombia VIP RP",
    descripcion: "Actualizaciones, eventos, parches y anuncios del servidor FiveM colombiano Colombia VIP RP. Entérate de todo lo nuevo en la ciudad.",
    url: url("/novedades"),
  },
  jsonld: [
    migas(["Inicio", "/"], ["Novedades", "/novedades"]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Novedades de Colombia VIP RP",
      url: url("/novedades"),
      inLanguage: "es-CO",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: novedades.map((n, i) => ({ "@type": "ListItem", position: i + 1, url: url(rutaNovedad(n.slug)), name: n.titulo })),
      },
    },
  ],
}));

/* ---------- una página por novedad ---------- */
for (const n of novedades) {
  const ruta = rutaNovedad(n.slug);
  const descripcion = recorta(textoPlano(n.resumen || n.contenido) || n.titulo, 160);
  await escribir(ruta, pagina({
    ruta: { pagina: "novedad", slug: n.slug },
    datos: { novedad: n, otras: tarjetas.filter(o => o.slug !== n.slug).slice(0, 3) },
    meta: {
      titulo: `${n.titulo} · Colombia VIP RP`,
      tituloCorto: n.titulo,
      descripcion,
      url: url(ruta),
      tipo: "article",
      imagen: n.imagen || undefined,
      publicado: n.fecha,
    },
    jsonld: [
      migas(["Inicio", "/"], ["Novedades", "/novedades"], [n.titulo, ruta]),
      {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: n.titulo.slice(0, 110),
        description: descripcion,
        articleSection: tipoDe(n.tipo).nombre,
        datePublished: n.fecha,
        dateModified: n.fecha,
        inLanguage: "es-CO",
        mainEntityOfPage: url(ruta),
        image: [n.imagen || url("/img/og.jpg")],
        author: { "@type": "Organization", name: "Colombia VIP RP", url: SITE_URL },
        publisher: { "@id": url("/#org") },
      },
    ],
  }));
}

/* ---------- sitemap ---------- */
const hoy = new Date().toISOString().slice(0, 10);
const entradas = [
  [url("/"), hoy],
  [url("/novedades"), novedades[0]?.fecha.slice(0, 10) ?? hoy],
  ...novedades.map(n => [url(rutaNovedad(n.slug)), n.fecha.slice(0, 10)]),
];
await writeFile(resolve(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas.map(([loc, mod]) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${mod}</lastmod>\n  </url>`).join("\n")}
</urlset>
`);

await rm(ssr, { recursive: true, force: true });
console.log(`prerender listo: inicio, /novedades y ${novedades.length} novedades; sitemap con ${entradas.length} direcciones`);
