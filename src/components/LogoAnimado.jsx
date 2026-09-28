import { forwardRef } from "react";
import { motion } from "motion/react";
import { img } from "../lib/supabase.js";

// Safari no muestra la transparencia de los videos WebM: ahí se usa WebP animado
// (portada) o el logo quieto (barra de arriba).
const esSafari = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

const LogoAnimado = forwardRef(function LogoAnimado({ mini = false, className, ...resto }, ref) {
  if (esSafari) {
    return (
      <motion.img ref={ref} className={className} src={img(mini ? "logo.webp" : "logo-animado.webp")}
        alt="Colombia VIP" {...resto} />
    );
  }
  return (
    <motion.video ref={ref} className={className} autoPlay muted loop playsInline aria-label="Colombia VIP" {...resto}>
      <source src={img(mini ? "logo-animado-mini.webm" : "logo-animado.webm")} type="video/webm" />
    </motion.video>
  );
});

export default LogoAnimado;
