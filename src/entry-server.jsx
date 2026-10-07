// Se usa solo al compilar: genera el HTML de cada página para que buscadores y
// vistas previas lean el contenido sin ejecutar JavaScript (scripts/prerender.js).
import { renderToString } from "react-dom/server";
import App from "./App.jsx";

export const render = (ruta, datos) => renderToString(<App ruta={ruta} datos={datos} />);
