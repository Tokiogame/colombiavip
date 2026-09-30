import { sb } from "./supabase.js";

// Manda al webhook el embed que ya viene armado y devuelve el id del mensaje,
// para que el panel pueda editarlo después (aprobada / rechazada).
// El .txt se adjunta solo si viene (cuando alguna respuesta no cupo en el embed).
async function enviarWebhook({ url, rol, aviso, embed, txt, archivo }, idSolicitud) {
  const logo = `${location.origin}/img/logo.png`;
  const payload = {
    username: "Colombia VIP · Postulaciones",
    avatar_url: logo,
    // menciona al rol de la facción si hay uno; si no, a @everyone
    content: `${rol ? `<@&${rol}>` : "@everyone"} ${aviso}`,
    allowed_mentions: rol ? { roles: [rol], users: [] } : { parse: ["everyone"], users: [] },
    embeds: [embed],
  };
  // botón que abre la solicitud en el panel (Discord no acepta links a localhost)
  if (location.protocol === "https:") {
    payload.components = [{
      type: 1,
      components: [{ type: 2, style: 5, label: "Revisar en el panel", emoji: { name: "🗂️" }, url: `${location.origin}/admin.html?sol=${idSolicitud}` }],
    }];
  }

  const body = new FormData();
  body.append("payload_json", JSON.stringify(payload));
  if (txt) body.append("files[0]", new Blob([txt], { type: "text/plain" }), archivo);

  const r = await fetch(`${url}?wait=true&with_components=true`, { method: "POST", body });
  if (!r.ok) throw new Error(r.status);
  return (await r.json()).id || "";
}

// Manda la solicitud al webhook (si hay URL) y la guarda en el panel (si hay Supabase).
// Basta con que llegue por uno de los dos. Primero va Discord para guardar el id del mensaje.
export async function entregar(fila, webhook) {
  if (!sb && !webhook.url) throw new Error("sin destino");
  const id = crypto.randomUUID();

  let mensaje = "";
  let llegoDiscord = false;
  if (webhook.url) {
    try {
      mensaje = await enviarWebhook(webhook, id);
      llegoDiscord = true;
    } catch (err) { console.error("webhook", err); }
  }

  if (sb) {
    let { error } = await sb.from("solicitudes").insert({ id, ...fila, discord_msg: mensaje });
    // si todavía no se corrió el SQL que crea la columna discord_msg, se guarda sin ella
    if (error?.code === "PGRST204") ({ error } = await sb.from("solicitudes").insert({ id, ...fila }));
    if (error) {
      if (!llegoDiscord) throw error;
      console.error("supabase", error);
    }
    return;
  }
  if (!llegoDiscord) throw new Error("no se pudo enviar");
}

export const slug = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
