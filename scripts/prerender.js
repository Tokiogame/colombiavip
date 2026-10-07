// Después de `vite build`: mete el HTML de la página en dist/index.html,
// agrega el JSON-LD de las preguntas frecuentes y genera sitemap.xml.
import { readFile, writeFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { SITE_URL } from "../src/config.js";
import { PREGUNTAS, sinFormato } from "../src/data/faq.js";

const dist = resolve(import.meta.dirname, "../dist");
const ssr = resolve(import.meta.dirname, "../dist-ssr");

const { render } = await import(pathToFileURL(resolve(ssr, "entry-server.js")).href);
const html = render();

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PREGUNTAS.map(([pregunta, respuesta]) => ({
    "@type": "Question",
    name: pregunta,
    acceptedAnswer: { "@type": "Answer", text: sinFormato(respuesta) },
  })),
};

const archivo = resolve(dist, "index.html");
let pagina = await readFile(archivo, "utf8");
if (!pagina.includes('<div id="root"></div>')) throw new Error("No encontré <div id=\"root\"></div> en dist/index.html");
pagina = pagina
  .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  .replace("</head>", `  <script type="application/ld+json">${JSON.stringify(faq).replace(/</g, "\u003c")}</script>\n</head>`);
await writeFile(archivo, pagina);

const hoy = new Date().toISOString().slice(0, 10);
await writeFile(resolve(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${hoy}</lastmod>
  </url>
</urlset>
`);

await rm(ssr, { recursive: true, force: true });
console.log(`prerender listo: ${(html.length / 1024).toFixed(0)} KB de HTML, ${PREGUNTAS.length} preguntas en el JSON-LD`);
