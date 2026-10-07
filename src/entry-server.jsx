// Se usa solo al compilar: genera el HTML de la página para que buscadores y
// vistas previas lean el contenido sin ejecutar JavaScript (scripts/prerender.js).
import { renderToString } from "react-dom/server";
import App from "./App.jsx";

export const render = () => renderToString(<App />);
