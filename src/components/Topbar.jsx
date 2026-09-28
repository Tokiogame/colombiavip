import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { DISCORD_URL, CFX_URL } from "../config.js";
import { Magnetico } from "./ui.jsx";
import LogoAnimado from "./LogoAnimado.jsx";

const ENLACES = [
  ["entrar", "Cómo entrar"],
  ["normativa", "Normativa"],
  ["whitelist", "Whitelist"],
  ["postulaciones", "Postulaciones"],
  ["vip", "VIP"],
  ["guias", "Guías"],
  ["faq", "Preguntas"],
];

export default function Topbar({ pagina }) {
  const [solida, setSolida] = useState(false);
  const [abierta, setAbierta] = useState(false);

  // barra de progreso de lectura
  const { scrollYProgress } = useScroll();
  const progreso = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const pintar = () => setSolida(scrollY > 40);
    addEventListener("scroll", pintar, { passive: true });
    pintar();
    return () => removeEventListener("scroll", pintar);
  }, []);

  return (
    <motion.header
      className={`top ${solida || pagina !== "inicio" ? "solida" : ""}`}
      initial={{ y: -90 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div className="progreso" style={{ scaleX: progreso }} aria-hidden="true" />
      <div className="top-in">
        <a href="#inicio" className="marca" aria-label="Inicio"><LogoAnimado mini className="marca-logo" width="200" height="112" /></a>

        <nav className={`nav ${abierta ? "abierta" : ""}`}>
          {ENLACES.map(([id, texto]) => (
            <a key={id} href={`#${id}`} className={`${pagina === id ? "activo" : ""} ${id === "vip" ? "nav-vip" : ""}`} onClick={() => setAbierta(false)}>
              {texto}
              {pagina === id && <motion.i className="nav-marca" layoutId="nav-marca" />}
            </a>
          ))}
        </nav>

        <div className="top-acc">
          <a href={DISCORD_URL} className="ico-discord" target="_blank" rel="noopener" aria-label="Discord"></a>
          <Magnetico href={CFX_URL} className="btn btn-sm" target="_blank" rel="noopener">Conectarse</Magnetico>
          <button className="menu-btn" aria-label="Abrir menú" aria-expanded={abierta} onClick={() => setAbierta(a => !a)}>
            <span></span><span></span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
