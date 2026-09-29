import { DISCORD_URL, CFX_URL, CONNECT } from "../config.js";
import { img } from "../lib/supabase.js";
import { Aparecer, Copiar, Magnetico } from "./ui.jsx";

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

export function Pie() {
  return (
    <footer className="pie">
      <div className="pie-in">
        <div className="pie-marca">
          <img src={img("logo-mini.webp")} alt="Colombia VIP" width="110" height="60" />
          <p>Servidor de rol serio en FiveM. Aquí se rolea a lo colombiano.</p>
        </div>
        <nav className="pie-nav">
          <a href="#entrar">Cómo entrar</a>
          <a href="#normativa">Normativa</a>
          <a href="#whitelist">Whitelist</a>
          <a href="#postulaciones">Postulaciones</a>
          <a href="#vip">Tienda VIP</a>
          <a href="#guias">Guías</a>
          <a href="#faq">Preguntas</a>
          <a href={DISCORD_URL} target="_blank" rel="noopener">Discord</a>
        </nav>
        <Copiar texto={CONNECT} />
      </div>
      <p className="pie-legal">
        © {new Date().getFullYear()} <a href="admin.html" className="oculto">Colombia VIP</a> · Servidor de rol en FiveM. GTA V es marca de Rockstar Games.
        <span className="pie-autor">Web hecha por <b>Pope (Ñato)</b></span>
      </p>
    </footer>
  );
}
