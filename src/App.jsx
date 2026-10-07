import { MotionConfig } from "motion/react";
import { ToastProvider } from "./components/ui.jsx";
import Topbar from "./components/Topbar.jsx";
import Portada from "./components/Portada.jsx";
import ComoEntrar from "./components/ComoEntrar.jsx";
import Normativa from "./components/Normativa.jsx";
import Whitelist from "./components/Whitelist.jsx";
import Postulaciones from "./components/Postulaciones.jsx";
import Vip from "./components/Vip.jsx";
import Guias from "./components/Guias.jsx";
import Faq from "./components/Faq.jsx";
import { Cierre, Pie } from "./components/Cierre.jsx";
import { PaginaNovedad, PaginaNovedades, SeccionNovedades, useRecientes } from "./components/Novedades.jsx";

// "/" -> inicio, "/novedades" -> lista, "/novedades/<slug>" -> una novedad
export function leerRuta(path) {
  const limpio = path.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
  const m = limpio.match(/^\/novedades(?:\/([a-z0-9-]+))?$/);
  if (!m) return { pagina: "inicio" };
  return m[1] ? { pagina: "novedad", slug: m[1] } : { pagina: "novedades" };
}

function Inicio({ recientes: inicial }) {
  const recientes = useRecientes(inicial ?? []);
  return (
    <main>
      <Portada ultima={recientes[0]} />
      <ComoEntrar />
      <Normativa />
      <Whitelist />
      <Postulaciones />
      <Vip />
      <SeccionNovedades recientes={recientes} />
      <Guias />
      <Faq />
      <Cierre />
    </main>
  );
}

// ruta y datos vienen del prerender (o de main.jsx en el navegador)
export default function App({ ruta = { pagina: "inicio" }, datos = {} }) {
  const inicio = ruta.pagina === "inicio";
  const ultima = datos.recientes?.[0] ?? datos.lista?.[0] ?? datos.otras?.[0];

  return (
    // respeta a quien tiene activado "reducir movimiento" en su sistema
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <Topbar pagina={ruta.pagina} ultima={ultima} />
        {inicio && <Inicio recientes={datos.recientes} />}
        {ruta.pagina === "novedades" && <PaginaNovedades lista={datos.lista ?? []} />}
        {ruta.pagina === "novedad" && (
          <>
            <PaginaNovedad key={ruta.slug} slug={ruta.slug} novedad={datos.novedad} otras={datos.otras} />
            <Cierre />
          </>
        )}
        {ruta.pagina === "novedades" && <Cierre />}
        <Pie inicio={inicio} />
      </ToastProvider>
    </MotionConfig>
  );
}
