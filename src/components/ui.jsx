import { createContext, useCallback, useContext, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";

/* ---------- aviso flotante ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [texto, setTexto] = useState(null);
  const timer = useRef();

  const mostrar = useCallback(t => {
    setTexto(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTexto(null), 2400);
  }, []);

  return (
    <ToastCtx.Provider value={mostrar}>
      {children}
      <AnimatePresence>
        {texto && (
          <motion.div
            className="toast ver"
            role="status"
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            style={{ translate: "none" }}
          >
            {texto}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastCtx.Provider>
  );
}

/* ---------- copiar el connect ---------- */
export function Copiar({ texto }) {
  const toast = useToast();
  const [ok, setOk] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast("Copiado. Pégalo en la consola de FiveM (F8).");
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch (e) {
      toast(texto);
    }
  }

  return (
    <motion.button className="copiar" type="button" onClick={copiar} whileTap={{ scale: 0.96 }}>
      <code>{texto}</code>
      <span className={ok ? "copiado" : ""}>{ok ? "¡Listo!" : "Copiar"}</span>
    </motion.button>
  );
}

/* ---------- aparece al llegar con el scroll ---------- */
export function Aparecer({ children, delay = 0, y = 28, className, as = "div", ...resto }) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...resto}
    >
      {children}
    </M>
  );
}

/* ---------- cabecera de cada sección ---------- */
export function Cabecera({ num, titulo, children }) {
  return (
    <header className="bloque-cab">
      <motion.span
        className="num"
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {num}
      </motion.span>
      <div>
        <motion.h2
          initial={{ opacity: 0, y: 30, clipPath: "inset(0 0 100% 0)" }}
          whileInView={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {titulo}
        </motion.h2>
        {children && (
          <Aparecer as="p" delay={0.25} y={14}>
            {children}
          </Aparecer>
        )}
      </div>
    </header>
  );
}

/* ---------- botón que se pega al cursor ---------- */
export function Magnetico({ as = "a", className, children, fuerza = 0.25, ...resto }) {
  const M = motion[as];
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });

  function mover(e) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * fuerza);
    y.set((e.clientY - r.top - r.height / 2) * fuerza);
  }
  const soltar = () => { x.set(0); y.set(0); };

  return (
    <M className={className} style={{ x, y }} onPointerMove={mover} onPointerLeave={soltar} whileTap={{ scale: 0.95 }} {...resto}>
      {children}
    </M>
  );
}

/* ---------- tarjeta con brillo que sigue al cursor e inclinación 3D ---------- */
export function Tarjeta3D({ className, style, children, inclinacion = 8, ...resto }) {
  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });

  function mover(e) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * inclinacion * 2);
    rx.set((0.5 - py) * inclinacion * 2);
    e.currentTarget.style.setProperty("--mx", `${px * 100}%`);
    e.currentTarget.style.setProperty("--my", `${py * 100}%`);
  }
  const soltar = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      className={`brillo ${className || ""}`}
      style={{ ...style, rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={mover}
      onPointerLeave={soltar}
      {...resto}
    >
      {children}
    </motion.div>
  );
}
