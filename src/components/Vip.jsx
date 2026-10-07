import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DISCORD_URL, TICKET_URL } from "../config.js";
import { CATEGORIAS_RESPALDO, ARTICULOS_RESPALDO, VIP_TICKET, imagenVip } from "../data/vip.js";
import { sb } from "../lib/supabase.js";
import { Aparecer, Cabecera, Tarjeta3D, useToast } from "./ui.jsx";
import Icono from "./Icono.jsx";

function Articulo({ a, icono }) {
  const toast = useToast();

  // deja el mensaje copiado para pegarlo en el ticket y abre el Discord
  async function pedir() {
    try {
      await navigator.clipboard.writeText(`Hola, quiero comprar: ${a.nombre}`);
      toast("Mensaje copiado. Abre tu ticket y pégalo ahí.");
    } catch (e) {
      toast(`Pide «${a.nombre}» en tu ticket del Discord.`);
    }
    open(TICKET_URL, "_blank", "noopener");
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
        <span><b>2</b>Se abre el canal de tickets: abre uno y pega el mensaje</span>
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

      <p className="vip-unirse">¿Todavía no estás en el Discord? <a href={DISCORD_URL} target="_blank" rel="noopener">Únete aquí</a> y luego dale a «Pedir».</p>
      <p className="nota">Pregunta el precio en tu ticket. Las compras no son reembolsables y se entregan una vez confirmado el pago.</p>
    </section>
  );
}
