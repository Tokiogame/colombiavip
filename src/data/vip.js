/* ============================================
   TIENDA VIP — edita aquí categorías y artículos
   ============================================
   - precio: número en pesos colombianos, sin puntos (35000 = $35.000)
   - imagen: opcional. Pon el archivo en public/img/vip/ y escribe solo
     el nombre (ej. "sultan.webp"). Sin imagen se muestra el ícono.
   - destacado: true le pone la etiqueta "Más vendido"
   - agotado: true deja la tarjeta pero sin botón de pedir
   Los de abajo son EJEMPLOS: cámbialos por lo que venden de verdad.
*/

// canal o forma de abrir ticket que se le explica al jugador
export const VIP_TICKET = "abre un ticket en el canal #tienda-vip del Discord";

export const CATEGORIAS = [
  { id: "carros", nombre: "Carros", icono: "carro" },
  { id: "motos", nombre: "Motos", icono: "moto" },
  { id: "casas", nombre: "Casas", icono: "casa" },
  { id: "otros", nombre: "Otros", icono: "estrella" },
];

export const ARTICULOS = [
  // ---------- carros ----------
  {
    categoria: "carros",
    nombre: "Toyota Hilux",
    precio: 40000,
    descripcion: "La camioneta de toda la vida. Aguanta trocha y carretera.",
    incluye: ["Placa personalizada", "Maletero grande"],
    destacado: true,
  },
  {
    categoria: "carros",
    nombre: "Mazda 3",
    precio: 30000,
    descripcion: "Sedán cómodo para moverse por la ciudad con estilo.",
    incluye: ["Placa personalizada"],
  },
  {
    categoria: "carros",
    nombre: "Chevrolet Tahoe",
    precio: 50000,
    descripcion: "Grande, pesada y con presencia. Para llegar con todo el combo.",
    incluye: ["Placa personalizada", "Vidrios polarizados"],
  },

  // ---------- motos ----------
  {
    categoria: "motos",
    nombre: "Yamaha DT 125",
    precio: 20000,
    descripcion: "La moto de mandados por excelencia.",
    incluye: ["Placa personalizada"],
    destacado: true,
  },
  {
    categoria: "motos",
    nombre: "Pulsar NS 200",
    precio: 25000,
    descripcion: "Rápida y ágil para meterse entre el trancón.",
    incluye: ["Placa personalizada"],
  },

  // ---------- casas ----------
  {
    categoria: "casas",
    nombre: "Apartamento en el centro",
    precio: 45000,
    descripcion: "Apartamento amoblado cerca de todo.",
    incluye: ["Armario", "Almacenamiento"],
  },

  // ---------- otros ----------
  {
    categoria: "otros",
    nombre: "Cambio de nombre",
    precio: 15000,
    descripcion: "Cambia el nombre y apellido de tu personaje.",
    incluye: [],
  },
];
