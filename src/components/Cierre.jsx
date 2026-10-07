import { DISCORD_URL, CFX_URL, CONNECT } from "../config.js";
import { img } from "../lib/supabase.js";
import { Aparecer, Copiar, Magnetico, useToast } from "./ui.jsx";

const AUTOR_DISCORD = "pope.exc";

// franja animada del servidor (public/img/barra.mp4); lleva al Discord
function Cinta() {
  return (
    <a className="cinta cinta-video" href={DISCORD_URL} target="_blank" rel="noopener" aria-label="Unirme al Discord de Colombia VIP">
      <video autoPlay muted loop playsInline preload="metadata" poster={img("barra.jpg")}>
        <source src={img("barra.mp4")} type="video/mp4" />
      </video>
    </a>
  );
}

export function Cierre() {
  return (
    <>
      <Cinta />
      <section className="cta">
        <div className="cta-in">
          <Aparecer as="p" className="etiqueta">La ciudad te espera</Aparecer>
          <Aparecer as="h2" delay={0.1}>¿Listo para entrar?</Aparecer>
          <Aparecer as="p" delay={0.2}>Únete a la comunidad, resuelve tus dudas y entérate primero de las novedades.</Aparecer>
          <Aparecer className="acciones" delay={0.3}>
            <Magnetico href={DISCORD_URL} className="btn btn-discord" target="_blank" rel="noopener">Unirme al Discord</Magnetico>
            <Magnetico href={CFX_URL} className="btn btn-linea" target="_blank" rel="noopener">Conectarse al servidor</Magnetico>
          </Aparecer>
        </div>
      </section>
    </>
  );
}

// crédito del autor: al tocarlo copia su usuario de Discord
function Autor() {
  const toast = useToast();
  async function copiar() {
    try {
      await navigator.clipboard.writeText(AUTOR_DISCORD);
      toast(`Discord copiado: ${AUTOR_DISCORD}`);
    } catch (e) {
      toast(`Discord: ${AUTOR_DISCORD}`);
    }
  }
  return (
    <span className="pie-autor">
      Web hecha por <button type="button" onClick={copiar} title="Copiar su Discord">Pope (Ñato)</button>
      <small> · Discord: {AUTOR_DISCORD}</small>
    </span>
  );
}

// fuera del inicio, los enlaces a secciones llevan a /#seccion
export function Pie({ inicio = true }) {
  const ir = id => (inicio ? `#${id}` : `/#${id}`);
  return (
    <footer className="pie">
      <div className="pie-in">
        <div className="pie-marca">
          <img src={img("logo-mini.webp")} alt="Colombia VIP" width="110" height="60" />
          <p>Servidor de rol serio en FiveM. Aquí se rolea a lo colombiano.</p>
        </div>
        <nav className="pie-nav">
          <a href={ir("entrar")}>Cómo entrar</a>
          <a href={ir("normativa")}>Normativa</a>
          <a href={ir("whitelist")}>Whitelist</a>
          <a href={ir("postulaciones")}>Postulaciones</a>
          <a href={ir("vip")}>Tienda VIP</a>
          <a href="/novedades">Novedades</a>
          <a href={ir("guias")}>Guías</a>
          <a href={ir("faq")}>Preguntas</a>
          <a href={DISCORD_URL} target="_blank" rel="noopener">Discord</a>
        </nav>
        <Copiar texto={CONNECT} />
      </div>
      <p className="pie-legal">
        © {new Date().getFullYear()} <a href="/admin.html" className="oculto">Colombia VIP</a> · Servidor de rol en FiveM. GTA V es marca de Rockstar Games.
        <Autor />
      </p>
    </footer>
  );
}
