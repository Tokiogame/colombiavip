import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { DISCORD_URL, CFX_URL } from "../config.js";
import { sb, img } from "../lib/supabase.js";
import { CAMPOS_TARJETA, bloques, enLinea, fechaTexto, rutaNovedad, tipoDe } from "../lib/novedades.js";
import { Aparecer, Cabecera, Magnetico } from "./ui.jsx";

// Arranca con lo que trae el HTML prerenderizado y después pide a Supabase lo último
// (por si el staff publicó algo después de la última compilación de la web).
function useFresco(inicial, cargar) {
  const [valor, setValor] = useState(inicial);
  useEffect(() => {
    if (!sb) return;
    let vivo = true;
    cargar().then(({ data, error }) => { if (vivo && !error && data) setValor(data); });
    return () => { vivo = false; };
  }, []);
  return valor;
}

const publicadas = () => sb.from("novedades").select(CAMPOS_TARJETA).eq("publicado", true).order("fecha", { ascending: false });

/* ---------- piezas ---------- */
function Tipo({ tipo }) {
  const t = tipoDe(tipo);
  return <span className="nov-tipo" style={{ "--c": t.color }}>{t.nombre}</span>;
}

function Texto({ texto }) {
  return enLinea(texto).map((p, i) =>
    p.b ? <b key={i}>{p.b}</b>
    : p.a ? <a key={i} href={p.href} target="_blank" rel="noopener">{p.a}</a>
    : p.t);
}

export function Contenido({ texto }) {
  return bloques(texto).map((b, i) =>
    b.tipo === "h2" ? <h2 key={i}><Texto texto={b.texto} /></h2>
    : b.tipo === "ul" ? <ul key={i}>{b.items.map((t, j) => <li key={j}><Texto texto={t} /></li>)}</ul>
    : <p key={i}><Texto texto={b.texto} /></p>);
}

function Imagen({ n, grande }) {
  return n.imagen
    ? <img src={n.imagen} alt="" width="1200" height="675" loading={grande ? undefined : "lazy"} fetchPriority={grande ? "high" : undefined} />
    : <span className="nov-sin-img"><img src={img("logo-mini.webp")} alt="" width="110" height="60" /></span>;
}

export function Tarjeta({ n }) {
  return (
    <motion.article className="nov-tarjeta" whileHover="hover">
      <a href={rutaNovedad(n.slug)}>
        <motion.div className="nov-img" variants={{ hover: { y: -6 } }}><Imagen n={n} /></motion.div>
        <p className="nov-meta"><Tipo tipo={n.tipo} /><time dateTime={n.fecha}>{fechaTexto(n.fecha)}</time></p>
        <h3>{n.titulo}</h3>
        {n.resumen && <p className="nov-resumen-corto">{n.resumen}</p>}
      </a>
    </motion.article>
  );
}

/* ---------- portada: una línea con lo último ---------- */
export function AvisoNovedad({ n }) {
  if (!n) return null;
  return (
    <motion.a href={rutaNovedad(n.slug)} className="nov-aviso" style={{ "--c": tipoDe(n.tipo).color }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.9 }}>
      <b>{tipoDe(n.tipo).nombre}</b>
      <span>{n.titulo}</span>
      <i aria-hidden="true">→</i>
    </motion.a>
  );
}

/* ---------- inicio: las 3 últimas ---------- */
export function SeccionNovedades({ recientes }) {
  if (!recientes?.length) return null;
  return (
    <section id="novedades" className="bloque">
      <Cabecera num="06" titulo="Novedades">Actualizaciones, eventos y anuncios de la ciudad.</Cabecera>
      <div className="nov-grid">
        {recientes.slice(0, 3).map((n, i) => (
          <Aparecer key={n.slug} delay={i * 0.1}><Tarjeta n={n} /></Aparecer>
        ))}
      </div>
      <Aparecer className="nov-todas">
        <a href="/novedades" className="btn btn-linea">Ver todas las novedades</a>
      </Aparecer>
    </section>
  );
}

// la portada pide las 3 últimas y le pasa la primera al aviso
export function useRecientes(inicial) {
  return useFresco(inicial, () => publicadas().limit(3));
}

/* ---------- /novedades ---------- */
export function PaginaNovedades({ lista: inicial }) {
  const lista = useFresco(inicial, publicadas);

  return (
    <main className="nov-pagina">
      <header className="nov-cab">
        <nav className="migas" aria-label="Ruta"><a href="/">Inicio</a><span>/</span>Novedades</nav>
        <p className="etiqueta"><span className="bandera" aria-hidden="true"></span>Colombia VIP RP</p>
        <h1>Novedades del servidor</h1>
        <p>Todas las actualizaciones, eventos, parches y anuncios de la ciudad, de la más nueva a la más vieja.</p>
      </header>

      <section className="bloque nov-lista" aria-label="Todas las novedades">
        {lista.length ? (
          <div className="nov-grid">
            {lista.map((n, i) => <Aparecer key={n.slug} delay={(i % 3) * 0.08}><Tarjeta n={n} /></Aparecer>)}
          </div>
        ) : (
          <p className="nov-vacio">Todavía no hay novedades publicadas. Entra al <a href={DISCORD_URL} target="_blank" rel="noopener">Discord</a> para enterarte de todo.</p>
        )}
      </section>
    </main>
  );
}

/* ---------- /novedades/<slug> ---------- */
export function PaginaNovedad({ slug, novedad: inicial, otras = [] }) {
  // si la página no se prerenderizó (se publicó hace un momento) se busca en Supabase
  const [novedad, setNovedad] = useState(inicial ?? null);
  const [buscando, setBuscando] = useState(!inicial);

  useEffect(() => {
    if (!sb) return setBuscando(false);
    sb.from("novedades").select("*").eq("slug", slug).eq("publicado", true).maybeSingle()
      .then(({ data, error }) => {
        if (!error) setNovedad(data);
        setBuscando(false);
      });
  }, [slug]);

  useEffect(() => {
    if (novedad && !inicial) document.title = `${novedad.titulo} · Colombia VIP RP`;
    // no existe: que Google no la tome como una página válida
    if (!novedad && !buscando) {
      document.title = "Novedad no encontrada · Colombia VIP RP";
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.content = "noindex";
    }
  }, [novedad, inicial, buscando]);

  if (!novedad) {
    return (
      <main className="nov-pagina">
        <header className="nov-cab">
          <nav className="migas" aria-label="Ruta"><a href="/">Inicio</a><span>/</span><a href="/novedades">Novedades</a></nav>
          {buscando
            ? <p className="nov-vacio">Cargando…</p>
            : <>
                <h1>No encontramos esa novedad</h1>
                <p>Puede que la hayan quitado o que el enlace esté mal escrito.</p>
                <p><a href="/novedades" className="btn btn-linea">Ver todas las novedades</a></p>
              </>}
        </header>
      </main>
    );
  }

  const n = novedad;
  return (
    <main className="nov-pagina">
      <article className="nov-articulo">
        <header className="nov-cab">
          <nav className="migas" aria-label="Ruta"><a href="/">Inicio</a><span>/</span><a href="/novedades">Novedades</a></nav>
          <p className="nov-meta"><Tipo tipo={n.tipo} /><time dateTime={n.fecha}>{fechaTexto(n.fecha)}</time></p>
          <h1>{n.titulo}</h1>
          {n.resumen && <p className="nov-entrada">{n.resumen}</p>}
        </header>

        {n.imagen && <div className="nov-portada"><Imagen n={n} grande /></div>}

        <div className="nov-cuerpo">
          <Contenido texto={n.contenido} />
        </div>

        <aside className="nov-cta">
          <p>¿Quieres vivirlo dentro de la ciudad?</p>
          <div className="acciones">
            <Magnetico href={CFX_URL} className="btn" target="_blank" rel="noopener">Conectarse al servidor</Magnetico>
            <Magnetico href={DISCORD_URL} className="btn btn-discord" target="_blank" rel="noopener">Unirme al Discord</Magnetico>
          </div>
        </aside>
      </article>

      {otras.filter(o => o.slug !== n.slug).length > 0 && (
        <section className="bloque bloque-alt" aria-labelledby="mas-novedades">
          <h2 id="mas-novedades" className="nov-mas-titulo">Más novedades</h2>
          <div className="nov-grid">
            {otras.filter(o => o.slug !== n.slug).slice(0, 3).map((o, i) => (
              <Aparecer key={o.slug} delay={i * 0.1}><Tarjeta n={o} /></Aparecer>
            ))}
          </div>
          <div className="nov-todas"><a href="/novedades" className="btn btn-linea">Ver todas</a></div>
        </section>
      )}
    </main>
  );
}
