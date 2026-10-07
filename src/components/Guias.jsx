import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { sb } from "../lib/supabase.js";
import { Aparecer, Cabecera } from "./ui.jsx";

// se muestran si Supabase no está configurado; los de verdad se suben desde el panel
const RESPALDO = [
  { yt: "", titulo: "Cómo instalar FiveM y conectarte", descripcion: "Desde cero, con el F8 y el connect." },
  { yt: "", titulo: "Configurar el micrófono y la voz", descripcion: "Rangos de voz, radio y teléfono." },
  { yt: "", titulo: "Estilar tu personaje", descripcion: "Ropa, tatuajes, peinados y guardar outfits." },
];

// solo carga YouTube cuando le dan play
function Video({ v }) {
  const [jugando, setJugando] = useState(false);
  return (
    <motion.article className="video" whileHover="hover">
      <motion.div
        className={`marco ${v.yt ? "" : "vacio"}`}
        style={v.yt ? { backgroundImage: `url(https://i.ytimg.com/vi/${v.yt}/hqdefault.jpg)` } : undefined}
        variants={{ hover: { y: -6 } }}
      >
        {jugando ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1`} title={v.titulo}
            allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : v.yt && (
          <motion.button className="play" aria-label="Reproducir" onClick={() => setJugando(true)}
            variants={{ hover: { scale: 1.12 } }} whileTap={{ scale: 0.9 }} />
        )}
      </motion.div>
      <h3>{v.titulo}</h3>
      <p>{v.descripcion}</p>
    </motion.article>
  );
}

export default function Guias() {
  const [videos, setVideos] = useState(sb ? null : RESPALDO);

  useEffect(() => {
    if (!sb) return;
    sb.from("videos").select("yt, titulo, descripcion").order("orden").then(({ data, error }) => {
      // sin videos subidos todavía: tarjetas de "Próximamente"
      setVideos(error || !data.length ? RESPALDO : data);
    });
  }, []);

  return (
    <section id="guias" className="bloque">
      <Cabecera num="07" titulo="Guías en video">Lo básico para no quedar perdido el primer día.</Cabecera>

      <div className="videos">
        {videos === null && [0, 1, 2].map(i => <div key={i} className="video-cargando" />)}
        {videos?.map((v, i) => (
          <Aparecer key={v.titulo + i} delay={(i % 3) * 0.1}>
            <Video v={v} />
          </Aparecer>
        ))}
      </div>
    </section>
  );
}
