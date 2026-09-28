import { sb } from "./supabase.js";

// Manda al webhook un embed corto + un .txt con todo, para no chocar
// con el límite de caracteres de los embeds de Discord.
async function enviarWebhook({ url, rol, aviso, titulo, color, campos, txt, archivo }) {
  const payload = {
    content: rol ? `<@&${rol}> ${aviso}` : aviso,
    allowed_mentions: { roles: rol ? [rol] : [] },
    embeds: [{
      title: titulo.slice(0, 250),
      color,
      fields: campos,
      footer: { text: "Respuestas completas en el archivo adjunto" },
      timestamp: new Date().toISOString(),
    }],
  };

  const body = new FormData();
  body.append("payload_json", JSON.stringify(payload));
  body.append("files[0]", new Blob([txt], { type: "text/plain" }), archivo);

  const r = await fetch(url, { method: "POST", body });
  if (!r.ok) throw new Error(r.status);
}

// Guarda la solicitud en el panel (si hay Supabase) y la manda al webhook
// (si hay URL). Basta con que llegue por uno de los dos.
export async function entregar(fila, webhook) {
  const tareas = [];
  if (sb) tareas.push(sb.from("solicitudes").insert(fila).then(({ error }) => { if (error) throw error; }));
  if (webhook.url) tareas.push(enviarWebhook(webhook));
  if (!tareas.length) throw new Error("sin destino");

  const res = await Promise.allSettled(tareas);
  if (!res.some(r => r.status === "fulfilled")) throw res[0].reason;
}

export const slug = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
