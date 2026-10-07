import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App, { leerRuta } from "./App.jsx";
import "./styles/style.css";
import "./styles/efectos.css";
import "./styles/novedades.css";

const raiz = document.getElementById("root");

// el prerender deja en la página la ruta que pintó y los datos que usó (novedades)
let pre = null;
try { pre = JSON.parse(document.getElementById("datos-pagina")?.textContent || "null"); } catch (e) {}

const ruta = leerRuta(location.pathname);
const mismaPagina = pre && pre.ruta.pagina === ruta.pagina && pre.ruta.slug === ruta.slug;
const app = (
  <StrictMode>
    <App ruta={ruta} datos={mismaPagina ? pre.datos : {}} />
  </StrictMode>
);

// la barra de direcciones queda limpia: sin "/index.html" ni "#seccion"
// (si alguien entra con un link tipo /#vip, primero se baja a esa sección y luego se limpia)
addEventListener("load", () => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id) document.getElementById(id)?.scrollIntoView();
  history.replaceState(null, "", location.pathname.replace(/index\.html$/, "") + location.search);
});

// los enlaces internos (#vip, #faq…) bajan a su sección sin escribir el # en la URL
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const id = decodeURIComponent(a.getAttribute("href").slice(1));
  const destino = id && document.getElementById(id);
  e.preventDefault();
  if (destino) destino.scrollIntoView();
  else scrollTo({ top: 0 });
});

// en producción el HTML ya viene prerenderizado: React lo retoma en vez de pintarlo de cero
// (una novedad recién publicada todavía no tiene su HTML: Vercel sirve el de /novedades
// y aquí se pinta de cero la página que toca)
if (raiz.hasChildNodes() && mismaPagina) hydrateRoot(raiz, app);
else {
  raiz.replaceChildren();
  createRoot(raiz).render(app);
}
