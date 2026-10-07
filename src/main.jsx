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

// en producción el HTML ya viene prerenderizado: React lo retoma en vez de pintarlo de cero
if (raiz.hasChildNodes()) hydrateRoot(raiz, app);
else createRoot(raiz).render(app);
