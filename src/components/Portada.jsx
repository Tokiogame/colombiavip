import { useEffect, useMemo, useRef, useState } from "react";
import { motion, animate, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { DISCORD_URL, CFX_CODIGO, CONNECT } from "../config.js";
import { img } from "../lib/supabase.js";
import { Copiar, Magnetico } from "./ui.jsx";
import { AvisoNovedad } from "./Novedades.jsx";

const suave = [0.22, 1, 0.36, 1];

// "Aquí se rolea" entra letra por letra. Las letras sueltas se ocultan a lectores y
// buscadores; la frase completa va en un span .sr
function Letras({ texto, delay = 0 }) {
  return [<span key="sr" className="sr">{texto}</span>, ...texto.split("").map((l, i) => (
    <motion.span
      key={i}
      className="letra"
      aria-hidden="true"
      initial={{ opacity: 0, y: "0.6em", rotateX: -90 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay: delay + i * 0.035, ease: suave }}
    >
      {l === " " ? " " : l}
    </motion.span>
  ))];
}

// pseudoaleatorio fijo: el HTML prerenderizado y el navegador sacan las mismas chispas
const azar = n => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };

// chispas doradas que suben en el fondo
function Chispas({ cantidad = 28 }) {
  const chispas = useMemo(() => Array.from({ length: cantidad }, (_, i) => ({
    left: azar(i * 5) * 100,
    tam: 2 + azar(i * 5 + 1) * 3,
    dur: 7 + azar(i * 5 + 2) * 9,
    delay: -azar(i * 5 + 3) * 16,
    deriva: (azar(i * 5 + 4) - 0.5) * 80,
  })), [cantidad]);

  return (
    <div className="chispas" aria-hidden="true">
      {chispas.map((c, i) => (
        <i key={i} style={{
          left: `${c.left}%`,
          width: c.tam,
          height: c.tam,
          animationDuration: `${c.dur}s`,
          animationDelay: `${c.delay}s`,
          "--deriva": `${c.deriva}px`,
        }} />
      ))}
    </div>
  );
}

// jugadores en línea, con el número subiendo
function EstadoServidor() {
  const [estado, setEstado] = useState({ on: false, max: 0, cargando: true });
  const jugadores = useMotionValue(0);
  const redondo = useTransform(jugadores, v => Math.round(v));

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${CFX_CODIGO}`);
        if (!r.ok) throw new Error(r.status);
        const { Data } = await r.json();
        setEstado({ on: true, max: Data.sv_maxclients ?? Data.svMaxclients, cargando: false });
        animate(jugadores, Data.clients, { duration: 1.6, ease: "easeOut" });
      } catch (e) {
        setEstado({ on: false, cargando: false });
      }
    })();
  }, [jugadores]);

  return (
    <span className={`estado-srv ${estado.on ? "on" : ""}`}>
      <i></i>
      <b>
        {estado.cargando ? "Consultando servidor…"
          : estado.on ? <>En línea · <motion.span>{redondo}</motion.span>/{estado.max} jugadores</>
          : "Servidor FiveM"}
      </b>
    </span>
  );
}

export default function Portada({ ultima }) {
  const ref = useRef(null);
  const [videoListo, setVideoListo] = useState(false);

  // parallax: el contenido baja y se desvanece al hacer scroll
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yLogo = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const yTexto = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const opacidad = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // foco de luz que sigue al mouse
  const fx = useSpring(50, { stiffness: 60, damping: 20 });
  const fy = useSpring(40, { stiffness: 60, damping: 20 });
  const foco = useTransform([fx, fy], ([x, y]) =>
    `radial-gradient(600px circle at ${x}% ${y}%, rgba(224,176,44,.16), transparent 60%)`);

  function mover(e) {
    const r = ref.current.getBoundingClientRect();
    fx.set(((e.clientX - r.left) / r.width) * 100);
    fy.set(((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <section id="inicio" className="portada" ref={ref} onPointerMove={mover}>
      {/* Video de fondo: public/img/fondo.mp4 (720p) y fondo-movil.mp4 (para celular), sin audio */}
      <div className="portada-fondo" aria-hidden="true">
        {/* si el video no carga, queda la imagen del poster */}
        <video className={`fondo-video ${videoListo ? "listo" : ""}`} autoPlay muted loop playsInline preload="metadata"
          poster={img("fondo.jpg")} onCanPlay={() => setVideoListo(true)}>
          <source src={img("fondo-movil.mp4")} type="video/mp4" media="(max-width: 700px)" />
          <source src={img("fondo.mp4")} type="video/mp4" />
        </video>
      </div>
      <motion.div className="portada-foco" style={{ background: foco }} aria-hidden="true" />
      <Chispas />

      <motion.div className="portada-in" style={{ opacity: opacidad }}>
        <motion.img
          className="portada-logo"
          src={img("logo.webp")}
          alt="Colombia VIP RP, servidor FiveM colombiano"
          width="900"
          height="493"
          fetchPriority="high"
          style={{ y: yLogo }}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.1, ease: suave }}
        />

        <motion.div style={{ y: yTexto }} className="portada-texto">
          <motion.p className="etiqueta" initial={{ opacity: 0, letterSpacing: "10px" }} animate={{ opacity: 1, letterSpacing: "3px" }}
            transition={{ duration: 1, delay: 0.5, ease: suave }}>
            <span className="bandera" aria-hidden="true"></span>FiveM colombiano · Rol serio
          </motion.p>

          <h1>
            <span className="h1-linea"><Letras texto="Aquí se rolea" delay={0.6} /></span>
            <motion.em initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 1.1, ease: suave }}>
              a lo colombiano.
            </motion.em>
          </h1>

          <motion.p className="bajada" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.35 }}>
            Antes de pisar la calle léete la normativa, haz la whitelist y mira las guías. Aquí se rolea en serio y con respeto.
          </motion.p>

          <motion.div className="acciones" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.5 }}>
            <Magnetico href="#whitelist" className="btn btn-brillo">Hacer la whitelist</Magnetico>
            <Magnetico href={DISCORD_URL} className="btn btn-discord" target="_blank" rel="noopener">Unirme al Discord</Magnetico>
          </motion.div>

          <motion.div className="conexion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.7 }}>
            <EstadoServidor />
            <Copiar texto={CONNECT} />
          </motion.div>

          <AvisoNovedad n={ultima} />
        </motion.div>
      </motion.div>

      <motion.a href="#entrar" className="bajar" aria-label="Bajar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
        <span></span>
      </motion.a>
    </section>
  );
}
