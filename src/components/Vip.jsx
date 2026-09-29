import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DISCORD_URL } from "../config.js";
import { CATEGORIAS_RESPALDO, ARTICULOS_RESPALDO, VIP_TICKET, imagenVip } from "../data/vip.js";
import { sb } from "../lib/supabase.js";
import { Aparecer, Cabecera, Tarjeta3D, useToast } from "./ui.jsx";

const ICONOS = {
  carro: <><path d="M3 16v-4l2.2-5A2 2 0 0 1 7 6h10a2 2 0 0 1 1.8 1l2.2 5v4" /><path d="M3 12h18M3 16h18" /><circle cx="7" cy="16.5" r="1.8" /><circle cx="17" cy="16.5" r="1.8" /></>,
  moto: <><circle cx="5.5" cy="16" r="3.5" /><circle cx="18.5" cy="16" r="3.5" /><path d="M5.5 16 9 9h5l4.5 7M14 9l-1.5-3H10M9 9l3 7h6" /></>,
  casa: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></>,
  barco: <><path d="M3 15h18l-2.5 5h-13zM12 3v12M12 4l6 8h-6" /></>,
  avion: <path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7.5 4.5V16l-7.5-2.5V18l2 1.5V21L12 20l-3.5 1v-1.5l2-1.5v-4.5L3 16v-2.5L10.5 9z" />,
  dinero: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.8" /><path d="M6 9.5v5M18 9.5v5" /></>,
  ropa: <path d="M9 3 4 5.5 2.5 10l3 1.3V21h13v-9.7l3-1.3L20 5.5 15 3a3 3 0 0 1-6 0z" />,
  exclusivo: <><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M9 3 7.5 9 12 21l4.5-12L15 3" /></>,
  negocio: <><path d="M3 9.5 4.5 4h15L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0" /><path d="M4.5 12v8h15v-8M10 20v-5h4v5" /></>,
  mansion: <><path d="M2 21h20M4 21V10l8-6 8 6v11" /><path d="M2 11.5 12 4l10 7.5M8 21v-7M12 21v-7M16 21v-7M6.5 14h11" /><circle cx="12" cy="9" r="1.2" /></>,
  estrella: <path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" />,
};

function Icono({ nombre }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      {ICONOS[nombre] ?? ICONOS.estrella}
    </svg>
  );
}

function Articulo({ a, icono }) {
  const toast = useToast();

  // deja el mensaje copiado para pegarlo en el ticket y abre el Discord
  async function pedir() {
    try {
      await navigator.clipboard.writeText(`Hola, quiero comprar: ${a.nombre}`);
      toast("Mensaje copiado. Pégalo en tu ticket del Discord.");
    } catch (e) {
      toast(`Pide «${a.nombre}» en tu ticket del Discord.`);
    }
    open(DISCORD_URL, "_blank", "noopener");
  }

  return (
    <Tarjeta3D className={`articulo ${a.destacado ? "destacado" : ""}`} inclinacion={5}>
      <div className="articulo-img">
        {a.imagen
          ? <img src={imagenVip(a.imagen)} alt={a.nombre} loading="lazy" />
          : <span className="articulo-ico"><Icono nombre={icono} /></span>}
        {a.destacado && <span className="articulo-marca">Más vendido</span>}
      </div>
      <div className="articulo-cuerpo">
        <h3>{a.nombre}</h3>
        <p>{a.descripcion}</p>
        {a.incluye?.length > 0 && <ul>{a.incluye.map(x => <li key={x}>{x}</li>)}</ul>}
        <div className="articulo-pie">
          {a.agotado
            ? <span className="estado cerrada">Agotado</span>
            : <motion.button type="button" className="btn btn-sm" onClick={pedir} whileTap={{ scale: 0.95 }}>Pedir</motion.button>}
        </div>
      </div>
    </Tarjeta3D>
  );
}

export default function Vip() {
  const [elegida, setElegida] = useState(null);
  const [categorias, setCategorias] = useState(sb ? [] : CATEGORIAS_RESPALDO);
  const [todos, setTodos] = useState(sb ? null : ARTICULOS_RESPALDO);
  // si la elegida ya no existe (o aún no hay), queda la primera
  const categoria = categorias.find(c => c.id === elegida) ?? categorias[0];
  const cat = categoria?.id;
  const articulos = todos?.filter(a => a.categoria === cat);

  // categorías y artículos se editan en el panel; si las tablas no existen quedan los de respaldo
  useEffect(() => {
    if (!sb) return;
    Promise.all([
      sb.from("vip_categorias").select("*").order("orden"),
      sb.from("vip").select("*").order("orden"),
    ]).then(([c, a]) => {
      if (a.error) {
        setCategorias(CATEGORIAS_RESPALDO);
        setTodos(ARTICULOS_RESPALDO);
        return;
      }
      setCategorias(c.error ? CATEGORIAS_RESPALDO : c.data);
      setTodos(a.data);
    });
  }, []);

  return (
    <section id="vip" className="bloque bloque-alt">
      <Cabecera num="05" titulo="Tienda VIP">
        Apoya al servidor y llévate algo exclusivo para tu personaje. Para comprar, {VIP_TICKET} y el staff te atiende.
      </Cabecera>

      <Aparecer className="vip-pasos" y={14}>
        <span><b>1</b>Escoge lo que quieres y dale a «Pedir»</span>
        <span><b>2</b>Pega el mensaje en tu ticket del Discord</span>
        <span><b>3</b>El staff te dice el precio y te lo entrega en la ciudad</span>
      </Aparecer>

      <div className="vip-tabs" role="tablist">
        {categorias.map(c => (
          <button key={c.id} type="button" role="tab" aria-selected={cat === c.id}
            className={cat === c.id ? "activa" : ""} onClick={() => setElegida(c.id)}>
            <Icono nombre={c.icono} />
            {c.nombre}
            {cat === c.id && <motion.i className="vip-tab-fondo" layoutId="vip-tab" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={cat + (todos ? "" : "-cargando")}
          className="articulos"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {todos === null ? [0, 1, 2].map(i => <div key={i} className="video-cargando" />)
            : !categoria ? <p className="vip-vacio">Pronto abriremos la tienda.</p>
            : articulos.length
            ? articulos.map(a => <Articulo key={a.id ?? a.nombre} a={a} icono={categoria.icono} />)
            : <p className="vip-vacio">Pronto habrá artículos en esta categoría.</p>}
        </motion.div>
      </AnimatePresence>

      <p className="nota">Pregunta el precio en tu ticket. Las compras no son reembolsables y se entregan una vez confirmado el pago.</p>
    </section>
  );
}
