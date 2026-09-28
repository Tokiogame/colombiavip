import { MotionConfig } from "motion/react";
import { ToastProvider } from "./components/ui.jsx";
import Topbar from "./components/Topbar.jsx";
import Portada from "./components/Portada.jsx";
import ComoEntrar from "./components/ComoEntrar.jsx";
import Normativa from "./components/Normativa.jsx";
import Whitelist from "./components/Whitelist.jsx";
import Postulaciones from "./components/Postulaciones.jsx";
import Guias from "./components/Guias.jsx";
import Faq from "./components/Faq.jsx";
import { Cierre, Pie } from "./components/Cierre.jsx";

export default function App() {
  return (
    // respeta a quien tiene activado "reducir movimiento" en su sistema
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <Topbar />
        <main>
          <Portada />
          <ComoEntrar />
          <Normativa />
          <Whitelist />
          <Postulaciones />
          <Guias />
          <Faq />
          <Cierre />
        </main>
        <Pie />
      </ToastProvider>
    </MotionConfig>
  );
}
