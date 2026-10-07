/* ============================================
   ÍCONOS
   ============================================
   Los que vienen incluidos con la web (facciones y categorías de la tienda VIP).
   Desde el panel (pestaña Íconos) se pueden subir más: esos se guardan como el
   link de la imagen, así que donde diga «icono» puede venir un nombre de aquí
   o un link https://…
   Todos se dibujan en un cuadro de 24×24 con trazo, como los de lucide.
*/

export const ICONOS = {
  // vehículos
  carro: { nombre: "Carro", svg: '<path d="M3 16v-4l2.2-5A2 2 0 0 1 7 6h10a2 2 0 0 1 1.8 1l2.2 5v4"/><path d="M3 12h18M3 16h18"/><circle cx="7" cy="16.5" r="1.8"/><circle cx="17" cy="16.5" r="1.8"/>' },
  moto: { nombre: "Moto", svg: '<circle cx="5.5" cy="16" r="3.5"/><circle cx="18.5" cy="16" r="3.5"/><path d="M5.5 16 9 9h5l4.5 7M14 9l-1.5-3H10M9 9l3 7h6"/>' },
  bici: { nombre: "Bicicleta", svg: '<circle cx="5.5" cy="16" r="3.5"/><circle cx="18.5" cy="16" r="3.5"/><path d="M5.5 16 9 9h6l3.5 7M9 9l3 7 3-7M8 6h3M14 6h2l-1 3"/>' },
  camion: { nombre: "Camión", svg: '<path d="M2 6h11v10H2zM13 9h5l4 4v3h-9"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>' },
  barco: { nombre: "Barco", svg: '<path d="M3 15h18l-2.5 5h-13zM12 3v12M12 4l6 8h-6"/>' },
  avion: { nombre: "Avión", svg: '<path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7.5 4.5V16l-7.5-2.5V18l2 1.5V21L12 20l-3.5 1v-1.5l2-1.5v-4.5L3 16v-2.5L10.5 9z"/>' },
  helicoptero: { nombre: "Helicóptero", svg: '<path d="M3 4h16M11 4v3"/><path d="M5 12a5 5 0 0 1 5-5h3a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2H8a3 3 0 0 1-3-3z"/><path d="M17 11h4M21 9v4M9 15v3M14 15v3M6 18h11"/>' },

  // lugares
  casa: { nombre: "Casa", svg: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>' },
  mansion: { nombre: "Mansión", svg: '<path d="M2 21h20M4 21V10l8-6 8 6v11"/><path d="M2 11.5 12 4l10 7.5M8 21v-7M12 21v-7M16 21v-7M6.5 14h11"/><circle cx="12" cy="9" r="1.2"/>' },
  negocio: { nombre: "Negocio", svg: '<path d="M3 9.5 4.5 4h15L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0"/><path d="M4.5 12v8h15v-8M10 20v-5h4v5"/>' },
  ubicacion: { nombre: "Ubicación", svg: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>' },

  // facciones
  cruz: { nombre: "Cruz médica", svg: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>' },
  escudo: { nombre: "Escudo", svg: '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m12 8 1.2 2.5 2.8.4-2 1.9.5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-1.9 2.8-.4z" fill="currentColor"/>' },
  balanza: { nombre: "Balanza", svg: '<path d="M12 3v18M7 21h10M5 7h14M12 5V3"/><path d="M5 7 2 14a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>' },
  sirena: { nombre: "Sirena", svg: '<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M4 21h16v-3H4zM12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4"/>' },
  herramienta: { nombre: "Mecánico", svg: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>' },
  maletin: { nombre: "Maletín", svg: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>' },
  arma: { nombre: "Arma", svg: '<path d="M3 7h18v4h-7l-1 3h-3l-1.5 5H5l1.5-8H3z"/><path d="M11 11v3"/>' },
  calavera: { nombre: "Calavera", svg: '<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><path d="M10 20v-2M14 20v-2"/>' },

  // tienda y varios
  exclusivo: { nombre: "Exclusivo (diamante)", svg: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3 7.5 9 12 21l4.5-12L15 3"/>' },
  corona: { nombre: "Corona", svg: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/><path d="M5 19h14"/>' },
  dinero: { nombre: "Dinero", svg: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>' },
  compras: { nombre: "Compras", svg: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>' },
  regalo: { nombre: "Regalo", svg: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>' },
  ropa: { nombre: "Ropa", svg: '<path d="M9 3 4 5.5 2.5 10l3 1.3V21h13v-9.7l3-1.3L20 5.5 15 3a3 3 0 0 1-6 0z"/>' },
  llave: { nombre: "Llave", svg: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14.5 8.5l2 2"/>' },
  cafe: { nombre: "Comida / café", svg: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3"/>' },
  trofeo: { nombre: "Trofeo", svg: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6"/>' },
  corazon: { nombre: "Corazón", svg: '<path d="M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20z"/>' },
  fuego: { nombre: "Fuego", svg: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>' },
  rayo: { nombre: "Rayo", svg: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>' },
  estrella: { nombre: "Estrella", svg: '<path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/>' },
};

// un ícono subido desde el panel se guarda como el link de su imagen
export const esIconoPropio = v => /^https:\/\//i.test(v || "");

// url() de CSS a prueba de comillas raras en el link
const urlCss = v => `url("${String(v).replace(/["\\\n\r()]/g, encodeURIComponent)}")`;

// HTML del ícono (lo usa el panel; la web usa el componente Icono)
export function iconoHtml(valor, respaldo = "estrella") {
  if (esIconoPropio(valor)) return `<span class="icono-propio" aria-hidden="true" style='--img:${urlCss(valor).replace(/'/g, "%27")}'></span>`;
  const svg = (ICONOS[valor] ?? ICONOS[respaldo]).svg;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${svg}</svg>`;
}

export const estiloIconoPropio = v => ({ "--img": urlCss(v) });
