// POST /api/novedades — lo llama el panel después de guardar, despublicar o borrar una novedad.
//   1. Comprueba que el token sea de alguien del staff (admin o staff).
//   2. Pide a Vercel que vuelva a compilar la web, para que la página de la novedad
//      exista en HTML y entre al sitemap (variable VERCEL_DEPLOY_HOOK).
//   3. Si se pide, la anuncia en Discord una sola vez (variable DISCORD_NOVEDADES_WEBHOOK),
//      escrita como los anuncios del canal: # título, el texto tal cual, las fotos en mosaico
//      y, si el staff lo marca, @everyone @here al final.
// Las dos variables se configuran en Vercel > Settings > Environment Variables y nunca
// llegan al navegador.
import { SITE_URL, SUPABASE_URL, SUPABASE_KEY } from "../src/config.js";
import { imagenesDe, rutaNovedad, tipoDe, videosDe } from "../src/lib/novedades.js";

const supabase = (ruta, token, opciones = {}) => fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
  ...opciones,
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "x-staff-token": token,
    ...opciones.headers,
  },
});

// el mensaje de Discord (máximo 2000 letras): si el texto no cabe se corta en una línea
// completa y queda el enlace a la web para leer el resto. Si hay fotos el enlace va entre <>
// para que Discord no le agregue su vista previa (si no, la vista previa trae la imagen de la web).
// Los videos van como links sueltos: Discord les pone su reproductor (YouTube y .mp4).
function mensajeDiscord(n, enlace, mencionar) {
  const videos = videosDe(n);
  const conMedios = videos.length + imagenesDe(n).length > 0;
  const cabeza = `# ${n.titulo}\n`;
  const pie = videos.map(u => "\n" + u).join("")
    + `\n\n-# ${tipoDe(n.tipo).nombre} · [Leer en la web](${conMedios ? `<${enlace}>` : enlace})`
    + (mencionar ? "\n@everyone @here" : "");
  let texto = n.contenido.replace(/\r/g, "").replace(/@everyone|@here/g, "").replace(/[ \t]+$/gm, "").trim();
  const cabe = 2000 - cabeza.length - pie.length;
  if (texto.length > cabe) {
    texto = texto.slice(0, cabe - 2);
    const corte = texto.lastIndexOf("\n");
    texto = (corte > 0 ? texto.slice(0, corte) : texto).trimEnd() + "\n…";
  }
  return cabeza + texto + pie;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Solo POST" });

  const token = String(req.headers["x-staff-token"] || "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return res.status(401).json({ error: "Falta la sesión del panel" });

  // quién es (la misma función que usa el panel al entrar)
  const yo = await supabase("rpc/staff_yo", token, { method: "POST", body: "{}" }).then(r => (r.ok ? r.json() : []));
  if (!["admin", "staff"].includes(yo?.[0]?.rol)) return res.status(403).json({ error: "Sin permiso" });

  const { id, anunciar, mencionar } = req.body || {};
  const respuesta = { reconstruyendo: false, discord: "no" };

  // 1) recompilar la web
  if (process.env.VERCEL_DEPLOY_HOOK) {
    const r = await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: "POST" }).catch(() => null);
    respuesta.reconstruyendo = !!r?.ok;
  } else respuesta.reconstruyendo = "sin-config";

  // 2) anunciar en Discord (solo publicadas y solo una vez)
  if (anunciar && typeof id === "string") {
    const webhook = process.env.DISCORD_NOVEDADES_WEBHOOK;
    if (!webhook) respuesta.discord = "sin-config";
    else {
      const [n] = await supabase(`novedades?id=eq.${encodeURIComponent(id)}&select=*`, token).then(r => (r.ok ? r.json() : []));
      if (!n?.publicado) respuesta.discord = "no-publicada";
      else if (n.anunciada) respuesta.discord = "ya-anunciada";
      else {
        const enlace = SITE_URL + rutaNovedad(n.slug).slice(1);
        // varias fotos con el mismo "url" Discord las junta en un mosaico (muestra hasta 4)
        const fotos = imagenesDe(n).slice(0, 4);
        const r = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Colombia VIP RP",
            avatar_url: SITE_URL + "img/logo.png",
            content: mensajeDiscord(n, enlace, !!mencionar),
            allowed_mentions: { parse: mencionar ? ["everyone"] : [] },
            embeds: fotos.map(url => ({ url: enlace, image: { url } })),
          }),
        }).catch(() => null);
        if (r?.ok) {
          await supabase(`novedades?id=eq.${encodeURIComponent(id)}`, token, {
            method: "PATCH",
            body: JSON.stringify({ anunciada: new Date().toISOString() }),
          });
          respuesta.discord = "enviado";
        } else respuesta.discord = "error";
      }
    }
  }

  res.status(200).json(respuesta);
}
