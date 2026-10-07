/* ============================================
   CONFIGURACIÓN — la usan la web y el panel
   ============================================ */

// Dirección pública de la web (canonical, sitemap y vista previa al compartir)
export const SITE_URL = "https://www.colombiaviprp.com/";

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

// Webhook del canal de Discord donde llegan las postulaciones de las facciones
// (servidor aparte del de la comunidad). Cada facción puede tener el suyo en el panel;
// si lo deja vacío, usa este.
// (Discord > Configuración del canal > Integraciones > Webhooks > Copiar URL)
export const WEBHOOK_URL = "https://discordapp.com/api/webhooks/1554722113666162740/RL3n4f6VQUlYAcMadI-0F1VKtIhbhc0svP-I8U-p4ZEolaTbpeffIludMIqCHSuUMimq";

// Rol a mencionar cuando llegue una solicitud. Si está vacío (y la facción no tiene
// uno propio en el panel), se menciona a @everyone.
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
    nombre: "EPS Zura",
    sigla: "Servicio médico de emergencias",
    color: "#e5484d",
    icono: "cruz",
    abierta: true,
    webhook: "",
    rol: "",
    descripcion: "Atiende heridos, maneja la ambulancia y salva vidas en cada rincón de la ciudad.",
    requisitos: ["Whitelist aprobada", "Mínimo 2 semanas en la ciudad", "Sin sanciones graves recientes"],
    preguntas: [
      { texto: "¿Conoces nuestras normativas generales?", opciones: ["Sí", "No"] },
      { texto: "¿Has sido EMS antes?", opciones: ["Sí", "No"] },
      { texto: "¿Eres consciente que al pertenecer a esta facción civil de EPS/EMS no puedes ser delictivo, banda o guerilla?", opciones: ["Sí", "No"] },
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
      { texto: "¿Conoces nuestras normativas generales?", opciones: ["Sí", "No"] },
      { texto: "¿Conoces nuestras normativas legales y de la Policía Nacional de Colombia?", opciones: ["Sí", "No"] },
      { texto: "¿Has sido policía antes?", opciones: ["Sí", "No"] },
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
      { texto: "¿Conoces nuestras normativas generales?", opciones: ["Sí", "No"] },
      { texto: "¿Conoces nuestras normativas legales y del Ejército Nacional de Colombia?", opciones: ["Sí", "No"] },
      { texto: "¿Has sido policía, guardia o de algún rol legal antes?", opciones: ["Sí", "No"] },
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
      { texto: "¿Conoces nuestras normativas generales?", opciones: ["Sí", "No"] },
      { texto: "¿Has interpretado roles legales o de gobernación antes?", opciones: ["Sí", "No"] },
      { texto: "¿Eres consciente que al pertenecer a esta facción civil de Fiscalía General de la Nación no puedes ser delictivo, banda o guerrilla?", opciones: ["Sí", "No"] },
      { texto: "¿A qué puesto te quieres postular?", opciones: ["Ministerio de Defensa", "Fiscal General", "Juez", "Director del CTI", "Investigador del CTI", "Agente del CTI", "Abogado"] },
      { texto: "¿Porqué quieres pertenecer a la Fiscalía General de la Nación y interpretar ese personaje?", min: 6 },
    ],
  },
];
