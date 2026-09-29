/* ============================================
   TIENDA VIP
   ============================================
   Categorías y artículos se manejan desde el panel (admin.html > Tienda VIP).
   Los de aquí son de respaldo: solo se muestran si Supabase no responde.
*/

import { img } from "../lib/supabase.js";

// la imagen puede ser un link (https://…) o un archivo de public/img/vip/
export const imagenVip = v => (!v ? "" : /^https?:\/\//i.test(v) ? v : img(`vip/${v}`));

// canal o forma de abrir ticket que se le explica al jugador
export const VIP_TICKET = "abre un ticket en el canal 🎫 ticket del Discord";

// íconos que se pueden escoger para una categoría (los dibujos están en Vip.jsx)
export const ICONOS_VIP = {
  carro: "Carro",
  moto: "Moto",
  casa: "Casa",
  mansion: "Mansión",
  negocio: "Negocio",
  exclusivo: "Exclusivo (diamante)",
  barco: "Barco",
  avion: "Avión",
  dinero: "Dinero",
  ropa: "Ropa",
  estrella: "Estrella",
};

// respaldo: solo si Supabase no responde o falta crear la tabla
export const CATEGORIAS_RESPALDO = [
  { id: "carros", nombre: "Carros", icono: "carro" },
  { id: "motos", nombre: "Motos", icono: "moto" },
  { id: "casas", nombre: "Casas", icono: "casa" },
  { id: "otros", nombre: "Otros", icono: "estrella" },
];

// respaldo: solo si Supabase no responde o falta crear la tabla
export const ARTICULOS_RESPALDO = [
  // ---------- carros ----------
  {
    categoria: "carros",
    nombre: "Toyota Hilux",
    descripcion: "La camioneta de toda la vida. Aguanta trocha y carretera.",
    incluye: ["Placa personalizada", "Maletero grande"],
    destacado: true,
  },
  {
    categoria: "carros",
    nombre: "Mazda 3",
    descripcion: "Sedán cómodo para moverse por la ciudad con estilo.",
    incluye: ["Placa personalizada"],
  },
  {
    categoria: "carros",
    nombre: "Chevrolet Tahoe",
    descripcion: "Grande, pesada y con presencia. Para llegar con todo el combo.",
    incluye: ["Placa personalizada", "Vidrios polarizados"],
  },

  // ---------- motos ----------
  {
    categoria: "motos",
    nombre: "Yamaha DT 125",
    descripcion: "La moto de mandados por excelencia.",
    incluye: ["Placa personalizada"],
    destacado: true,
  },
  {
    categoria: "motos",
    nombre: "Pulsar NS 200",
    descripcion: "Rápida y ágil para meterse entre el trancón.",
    incluye: ["Placa personalizada"],
  },

  // ---------- casas ----------
  {
    categoria: "casas",
    nombre: "Apartamento en el centro",
    descripcion: "Apartamento amoblado cerca de todo.",
    incluye: ["Armario", "Almacenamiento"],
  },

  // ---------- otros ----------
  {
    categoria: "otros",
    nombre: "Cambio de nombre",
    descripcion: "Cambia el nombre y apellido de tu personaje.",
    incluye: [],
  },
];
