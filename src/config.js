/* ============================================
   CONFIGURACIÓN — la usan la web y el panel
   ============================================ */

// Invitación del Discord (todos los botones de Discord usan este link)
export const DISCORD_URL = "https://discord.gg/EKUBfARebA";

// Canal de tickets (donde está el botón del bot). Lo abre el botón «Pedir» de la tienda VIP.
// Solo funciona para quien ya está en el servidor; a los demás se les muestra DISCORD_URL.
// (Discord > clic derecho en el canal > Copiar enlace)
export const TICKET_URL = "https://discord.com/channels/1429219884922962102/1429268638883381278";

// Código del servidor en FiveM (lo que va después de cfx.re/join/)
export const CFX_CODIGO = "kqm9yk6";
export const CFX_URL = `https://cfx.re/join/${CFX_CODIGO}`;
export const CONNECT = `connect cfx.re/join/${CFX_CODIGO}`;

// Webhook del canal de Discord donde llegan las whitelist (opcional si usas el panel)
// (Discord > Configuración del canal > Integraciones > Webhooks > Copiar URL)
export const WEBHOOK_URL = "";

// Rol a mencionar cuando llegue una solicitud (déjalo vacío si no quieres ping)
export const ROL_STAFF_ID = "";

// Supabase > Project Settings > API. Usa la anon / publishable key,
// NUNCA la secret / service_role: esta clave queda visible en la página.
export const SUPABASE_URL = "https://qoyylutgicgolvqagtzr.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveXlsdXRnaWNnb2x2cWFndHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NjM4NjAsImV4cCI6MjEwNjEzOTg2MH0.n2ZhV5R4FCHxyJPlzkckf6shxsoohc-M4Q5pcb1GU04";

// Facciones de respaldo: solo se usan si Supabase no responde.
// Las de verdad se editan desde el panel (admin.html > Facciones).
export const FACCIONES_RESPALDO = [
  {
    id: "ems",
    nombre: "EMS Zura",
    sigla: "Servicio médico de emergencias",
    color: "#e5484d",
    icono: "cruz",
    abierta: true,
    webhook: "",
    rol: "",
    descripcion: "Atiende heridos, maneja la ambulancia y salva vidas en cada rincón de la ciudad.",
    requisitos: ["Whitelist aprobada", "Mínimo 2 semanas en la ciudad", "Sin sanciones graves recientes"],
    preguntas: [
      { texto: "¿Por qué quieres pertenecer a EMS Zura?", min: 150 },
      { texto: "Llegas a un tiroteo con varios heridos y la policía aún no controla la zona. ¿Qué haces?", min: 120 },
      { texto: "¿Qué harías si un compañero EMS está ayudando a una banda?", min: 80 },
    ],
  },
  {
    id: "policia",
    nombre: "Policía Nacional",
    sigla: "PONAL",
    color: "#2fa865",
    icono: "escudo",
    abierta: true,
    webhook: "",
    rol: "",
    descripcion: "Patrulla las calles, responde a los robos y mantiene el orden dentro de la ciudad.",
    requisitos: ["Whitelist aprobada", "Mínimo 2 semanas en la ciudad", "Conocer la normativa de robos"],
    preguntas: [
      { texto: "¿Por qué quieres entrar a la Policía Nacional?", min: 150 },
      { texto: "Durante un atraco con rehenes, los atracadores piden un carro. ¿Cómo manejas la negociación?", min: 120 },
      { texto: "¿Qué es el abuso de poder y cómo lo evitarías con tu personaje?", min: 80 },
    ],
  },
  {
    id: "ejercito",
    nombre: "Ejército Nacional",
    sigla: "Fuerzas militares",
    color: "#a3a84a",
    icono: "estrella",
    abierta: true,
    webhook: "",
    rol: "",
    descripcion: "Protege zonas estratégicas, apoya operativos de alto riesgo y responde ante amenazas mayores.",
    requisitos: ["Whitelist aprobada", "Mínimo 2 semanas en la ciudad", "Disponibilidad para entrenamientos"],
    preguntas: [
      { texto: "¿Por qué quieres entrar al Ejército Nacional?", min: 150 },
      { texto: "¿Cuál crees que es la diferencia entre el rol del Ejército y el de la Policía?", min: 100 },
      { texto: "Tu superior te da una orden que va contra la normativa del servidor. ¿Qué haces?", min: 80 },
    ],
  },
  {
    id: "fiscalia",
    nombre: "Fiscalía General",
    sigla: "Fiscalía General de la Nación",
    color: "#4b82e8",
    icono: "balanza",
    abierta: true,
    webhook: "",
    rol: "",
    descripcion: "Investiga delitos, arma los casos y lleva a los criminales ante la justicia.",
    requisitos: ["Whitelist aprobada", "Mínimo 3 semanas en la ciudad", "Buena redacción y rol de investigación"],
    preguntas: [
      { texto: "¿Por qué quieres pertenecer a la Fiscalía General?", min: 150 },
      { texto: "La policía te trae a un sospechoso de homicidio sin pruebas claras. ¿Cómo procedes?", min: 120 },
      { texto: "¿Cómo manejarías un caso donde está involucrado un miembro de tu propia facción?", min: 80 },
    ],
  },
];
