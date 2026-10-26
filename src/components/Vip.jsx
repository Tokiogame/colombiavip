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
        {(a.nuevo || a.destacado) && (
          <span className="articulo-marcas">
            {a.nuevo && <span className="articulo-marca nuevo">Recién llegado</span>}
            {a.destacado && <span className="articulo-marca">Más vendido</span>}
          </span>
        )}
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

// categoría marcada «Próximamente» en el panel: un adelanto en vez de los artículos
const PRONTO = "PRÓXIMAMENTE";

function Proximamente({ categoria }) {
  return (
    <div className="vip-pronto">
      <span className="vip-pronto-escaneo" aria-hidden="true" />

      <div className="vip-pronto-radar" aria-hidden="true">
        <i /><i /><i />
        <span className="vip-pronto-aro" />
        <motion.span
          className="vip-pronto-ico"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        >
          <Icono nombre={categoria.icono} />
        </motion.span>
      </div>

      <p className="etiqueta">Llega pronto a la ciudad</p>
      <h3 className="vip-pronto-titulo" aria-label={PRONTO}>
        {[...PRONTO].map((l, i) => (
          <motion.span key={i} aria-hidden="true"
            initial={{ opacity: 0, y: 28, rotateX: -90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.25 + i * 0.045, type: "spring", stiffness: 320, damping: 20 }}
          >{l}</motion.span>
        ))}
      </h3>
      <p className="vip-pronto-txt">
        Estamos preparando <b>{categoria.nombre}</b> para el server. Pendiente del Discord: los primeros en enterarse se llevan lo mejor.
      </p>

      <div className="vip-pronto-cajas" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="vip-pronto-caja"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.12 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <b>???</b>
          </motion.div>
        ))}
      </div>

      <a className="btn btn-linea" href={DISCORD_URL} target="_blank" rel="noopener">Avísame en el Discord</a>
    </div>
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
            {c.proximamente && <span className="vip-tab-pronto">Pronto</span>}
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
            : categoria.proximamente ? <Proximamente categoria={categoria} />
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
