import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/style.css";
import "./styles/efectos.css";

const raiz = document.getElementById("root");
const app = (
  <StrictMode>
    <App />
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
if (raiz.hasChildNodes()) hydrateRoot(raiz, app);
else createRoot(raiz).render(app);
