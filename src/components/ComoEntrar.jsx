import { useEffect, useMemo, useRef, useState } from "react";
import { motion, animate, useInView, useMotionValue, useTransform } from "motion/react";
import { CFX_URL, CONNECT } from "../config.js";
import { Cabecera, Copiar, Magnetico } from "./ui.jsx";
import steam from "../assets/iconos/steam.svg?raw";
import epic from "../assets/iconos/epicgames.svg?raw";
import rockstar from "../assets/iconos/rockstargames.svg?raw";
import fivem from "../assets/iconos/fivem.svg?raw";

const suave = [0.22, 1, 0.36, 1];

const Icono = ({ svg }) => <span className="icono" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;

const TIENDAS = [
  { nombre: "Steam", svg: steam, url: "https://store.steampowered.com/app/271590/Grand_Theft_Auto_V_Legacy/", clase: "t-steam" },
  { nombre: "Epic Games", svg: epic, url: "https://store.epicgames.com/es-ES/p/grand-theft-auto-v", clase: "t-epic" },
  { nombre: "Rockstar", svg: rockstar, url: "https://www.rockstargames.com/gta-v", clase: "t-rockstar" },
];

/* ---------- parada 1: mapa de calles de fondo ---------- */
function Mapa() {
  // calles con un poco de desorden, siempre iguales (semilla fija)
  const calles = useMemo(() => {
    let s = 7;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const lineas = [];
    for (let x = 10; x < 400; x += 26 + r() * 22) lineas.push(`M${x} 0 L${x + (r() - 0.5) * 40} 400`);
    for (let y = 10; y < 400; y += 24 + r() * 22) lineas.push(`M0 ${y} L400 ${y + (r() - 0.5) * 36}`);
    return lineas;
  }, []);

  return (
    <svg className="mapa" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {calles.map((d, i) => <path key={i} d={d} className="calle" />)}
      <path d="M-10 330 C 90 280, 150 300, 230 190 S 350 60, 420 40" className="autopista" />
      <path d="M40 -10 C 70 120, 160 170, 190 260 S 260 380, 300 420" className="autopista" />
      <circle cx="232" cy="188" r="5" className="blip" />
      <circle cx="232" cy="188" r="5" className="blip-onda" />
    </svg>
  );
}

/* ---------- parada 2: descarga de FiveM.exe ---------- */
function Descarga() {
  const ref = useRef(null);
  const visto = useInView(ref, { once: true, margin: "-60px" });
  const avance = useMotionValue(0);
  const ancho = useTransform(avance, v => `${v}%`);
  const texto = useTransform(avance, v => (v >= 100 ? "Listo para instalar" : `Descargando… ${Math.round(v)}%`));
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!visto) return;
    const c = animate(avance, 100, { duration: 3.2, ease: [0.4, 0, 0.2, 1], delay: 0.8, onComplete: () => setListo(true) });
    return () => c.stop();
  }, [visto, avance]);

  return (
    <div className={`descarga ${listo ? "lista" : ""}`} ref={ref}>
      <span className="descarga-ico"><Icono svg={fivem} /></span>
      <div className="descarga-info">
        <b>FiveM.exe</b>
        <motion.small>{texto}</motion.small>
        <span className="descarga-barra"><motion.i style={{ width: ancho }} /></span>
      </div>
      <motion.span className="descarga-ok" initial={{ scale: 0 }} animate={{ scale: listo ? 1 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>✓</motion.span>
    </div>
  );
}

/* ---------- parada 3: examen que se va aprobando ---------- */
const PASOS_WL = ["Datos fuera del rol", "Historia del personaje", "Preguntas de rol", "Entrevista de voz"];

function Examen() {
  const ref = useRef(null);
  const visto = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div className="examen" ref={ref}>
      <ul>
        {PASOS_WL.map((p, i) => (
          <li key={p}>
            <motion.span className="examen-check" initial={{ scale: 0, rotate: -90 }} animate={visto ? { scale: 1, rotate: 0 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.9 + i * 0.45 }}>✓</motion.span>
            <span className="examen-linea">
              {p}
              <motion.i initial={{ scaleX: 0 }} animate={visto ? { scaleX: 1 } : {}} transition={{ duration: 0.4, delay: 0.7 + i * 0.45 }} />
            </span>
          </li>
        ))}
      </ul>
      <motion.span className="sello" initial={{ opacity: 0, scale: 2.6, rotate: -4 }}
        animate={visto ? { opacity: 1, scale: 1, rotate: -14 } : {}}
        transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.9 + PASOS_WL.length * 0.45 }}>
        Aprobada
      </motion.span>
    </div>
  );
}

/* ---------- destino: consola F8 escribiendo el connect ---------- */
function Consola() {
  const ref = useRef(null);
  const visto = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!visto) return;
    let i = 0;
    let t;
    const inicio = setTimeout(function escribir() {
      setN(++i);
      if (i < CONNECT.length) t = setTimeout(escribir, 45 + Math.random() * 60);
    }, 1000);
    return () => { clearTimeout(inicio); clearTimeout(t); };
  }, [visto]);

  const termino = n >= CONNECT.length;

  return (
    <div className="consola" ref={ref}>
      <div className="consola-cab"><i></i><i></i><i></i><span>F8 · Consola de FiveM</span></div>
      <p className="consola-linea"><b>&gt;</b> {CONNECT.slice(0, n)}<span className={`cursor ${termino ? "" : "fijo"}`} /></p>
      <motion.p className="consola-ok" initial={{ opacity: 0, y: 6 }} animate={termino ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
        Conectando a Colombia VIP…
      </motion.p>
    </div>
  );
}

const PARADAS = [
  {
    pin: "1",
    meta: "Parada 01 · Tu PC",
    titulo: <>Consigue <em>GTA V</em></>,
    texto: "Cómpralo e instálalo en tu PC. Tiene que ser original y estar actualizado.",
    fondo: <Mapa />,
    clase: "con-mapa",
    extra: (
      <div className="tiendas">
        {TIENDAS.map(t => (
          <motion.a key={t.nombre} href={t.url} target="_blank" rel="noopener" className={`tienda ${t.clase}`}
            whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} title={`GTA V en ${t.nombre}`}>
            <Icono svg={t.svg} />
            <span>{t.nombre}</span>
          </motion.a>
        ))}
      </div>
    ),
  },
  {
    pin: "2",
    meta: "Parada 02 · Gratis",
    titulo: <>Instala <em>FiveM</em></>,
    texto: "Es el programa con el que te conectas a los servidores de rol. Lo instalas y lo abres una vez.",
    extra: (
      <>
        <Descarga />
        <Magnetico href="https://fivem.net" className="btn btn-parada" target="_blank" rel="noopener">Descargar FiveM</Magnetico>
      </>
    ),
  },
  {
    pin: "3",
    meta: "Parada 03 · Filtro",
    titulo: <>Pasa la <em>whitelist</em></>,
    texto: <>Examen escrito y entrevista de voz en el Discord. Léete bien la <a href="#normativa">normativa</a>.</>,
    extra: (
      <>
        <Examen />
        <Magnetico href="#whitelist" className="btn btn-parada">Hacer la whitelist →</Magnetico>
      </>
    ),
  },
  {
    pin: "★",
    destino: true,
    meta: "Destino · La ciudad",
    titulo: <>Entra al <em>servidor</em></>,
    texto: "Con la whitelist aprobada, dale al botón o pega el connect en la consola (F8).",
    extra: (
      <>
        <Consola />
        <Copiar texto={CONNECT} />
        <Magnetico href={CFX_URL} className="btn btn-parada btn-brillo" target="_blank" rel="noopener">Conectarse ahora →</Magnetico>
      </>
    ),
  },
];

export default function ComoEntrar() {
  return (
    <section id="entrar" className="bloque bloque-alt">
      <Cabecera num="01" titulo="Cómo entrar">Cuatro paradas desde cero hasta la ciudad. Sigue la ruta.</Cabecera>

      <motion.ol className="ruta" initial="oculto" whileInView="visible" viewport={{ once: true, margin: "-120px" }}>
        {/* la ruta se dibuja de izquierda a derecha */}
        <motion.span
          className="ruta-linea"
          aria-hidden="true"
          variants={{ oculto: { scaleX: 0, scaleY: 0 }, visible: { scaleX: 1, scaleY: 1 } }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />

        {PARADAS.map((p, i) => (
          <li key={p.meta} className={`parada ${p.destino ? "destino" : ""}`}>
            <motion.span
              className="pin"
              aria-hidden="true"
              variants={{
                oculto: { opacity: 0, y: -60, rotate: -45, scale: 0.4 },
                visible: { opacity: 1, y: 0, rotate: -45, scale: 1 },
              }}
              transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.25 + i * 0.35 }}
            >
              <b>{p.pin}</b>
              {p.destino && <span className="pin-onda" />}
            </motion.span>

            <motion.div
              className={`parada-card ${p.clase || ""}`}
              variants={{ oculto: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.7, delay: 0.4 + i * 0.35, ease: suave }}
            >
              {p.fondo}
              <p className="parada-meta">{p.meta}</p>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
              {p.extra}
            </motion.div>
          </li>
        ))}
      </motion.ol>
    </section>
  );
}
