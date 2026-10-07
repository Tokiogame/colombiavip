import { ICONOS, esIconoPropio, estiloIconoPropio } from "../data/iconos.js";

// ícono incluido (por nombre) o subido desde el panel (link de la imagen)
export default function Icono({ nombre, respaldo = "estrella" }) {
  if (esIconoPropio(nombre)) return <span className="icono-propio" aria-hidden="true" style={estiloIconoPropio(nombre)} />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"
      aria-hidden="true" dangerouslySetInnerHTML={{ __html: (ICONOS[nombre] ?? ICONOS[respaldo]).svg }} />
  );
}
