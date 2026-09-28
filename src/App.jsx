import { useEffect, useState } from "react";
import { MotionConfig, AnimatePresence, motion } from "motion/react";
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

// cada #enlace es una página aparte; lo que no esté aquí lleva al inicio
const PAGINAS = {
  inicio: () => <><Portada /><Cierre /></>,
  entrar: ComoEntrar,
  normativa: Normativa,
  whitelist: Whitelist,
  postulaciones: Postulaciones,
  vip: Vip,
  guias: Guias,
  faq: Faq,
};

const leerPagina = () => {
  const id = location.hash.slice(1);
  return PAGINAS[id] ? id : "inicio";
};

export default function App() {
  const [pagina, setPagina] = useState(leerPagina);

  useEffect(() => {
    const cambiar = () => setPagina(leerPagina());
    addEventListener("hashchange", cambiar);
    return () => removeEventListener("hashchange", cambiar);
  }, []);

  const Pagina = PAGINAS[pagina];

  return (
    // respeta a quien tiene activado "reducir movimiento" en su sistema
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <Topbar pagina={pagina} />
        <AnimatePresence mode="wait" onExitComplete={() => scrollTo({ top: 0, behavior: "instant" })}>
          <motion.main
            key={pagina}
            className={pagina === "inicio" ? "" : "pagina"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Pagina />
          </motion.main>
        </AnimatePresence>
        <Pie />
      </ToastProvider>
    </MotionConfig>
  );
}
