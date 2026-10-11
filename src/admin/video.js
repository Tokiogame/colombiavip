/* Comprime un clip en el navegador antes de subirlo, para que pese poco en Supabase
   (plan gratis: 1 GB guardado y ~5 GB de descargas al mes).
   Lo deja en MP4 de máximo 1280×720, ~2 Mbps de video y 128 kbps de audio (un minuto queda
   en unos 16 MB). Los clips más largos bajan la calidad para no pasar de ~24 MB, y desde
   unos 2 minutos se dejan en 960×540. Usa Mediabunny, que codifica con la tarjeta de video del PC (WebCodecs),
   así que tarda segundos. Se carga solo cuando alguien adjunta un video. */

export const MAX_SEGUNDOS = 180;
export const MAX_ENTRADA_MB = 500;     // archivo original
const OBJETIVO_MB = 24;                // a lo que se apunta al comprimir
const MAX_SALIDA_MB = 28;              // ya comprimido (el bucket acepta hasta 30)
const AUDIO_BPS = 128_000;

// 95 -> "1:35 min", 40 -> "40 s"
const duracion = s => ((s = Math.round(s)) < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min`);

// errores que se le muestran tal cual al staff
export class ErrorVideo extends Error {}

export async function comprimirVideo(archivo, alAvanzar = () => {}) {
  if (typeof VideoEncoder === "undefined") {
    throw new ErrorVideo("Este navegador no puede comprimir videos. Usa Chrome o Edge actualizado, o súbelo a YouTube y pega el link.");
  }
  const { Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, ALL_FORMATS, Quality, canEncodeVideo, canEncodeAudio } = await import("mediabunny");

  const input = new Input({ source: new BlobSource(archivo), formats: ALL_FORMATS });
  let pista, segundos;
  try {
    pista = await input.getPrimaryVideoTrack();
    segundos = await input.computeDuration();
  } catch {
    throw new ErrorVideo("No se pudo leer ese video. Prueba con un MP4 o MOV.");
  }
  if (!pista) throw new ErrorVideo("Ese archivo no tiene video.");
  if (segundos > MAX_SEGUNDOS + 0.5) {
    throw new ErrorVideo(`El video dura ${duracion(segundos)} y el máximo es ${duracion(MAX_SEGUNDOS)}. Recórtalo o súbelo a YouTube y pega el link.`);
  }

  // bitrate según lo que dura: hasta 2 Mbps, o menos si hace falta para quedar en ~24 MB
  // (con un margen del 10 % porque el encoder no siempre cumple exacto)
  let bps = Math.min(2_000_000, Math.floor((OBJETIVO_MB * 8 * 1048576 * 0.9) / segundos - AUDIO_BPS));
  // los clips del juego suelen venir a 60 fps: a 30 se ven bien y pesan menos
  const fps = (await pista.computePacketStats(120).catch(() => null))?.averagePacketRate || 30;
  const codecVideo = (await canEncodeVideo("avc")) ? "avc" : "vp9";
  const codecAudio = (await canEncodeAudio("aac")) ? "aac" : "opus";

  const convertir = async (bps, intento) => {
    // con poco bitrate se ve mejor un video más chico que uno grande lleno de cuadritos
    const [largo, corto] = bps < 700_000 ? [854, 480] : bps < 1_400_000 ? [960, 540] : [1280, 720];
    // lado largo y corto con tope (sirve igual para videos verticales); medidas pares
    const escala = Math.min(1, largo / Math.max(pista.displayWidth, pista.displayHeight), corto / Math.min(pista.displayWidth, pista.displayHeight));
    const ancho = Math.round((pista.displayWidth * escala) / 2) * 2;

    const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
    const conversion = await Conversion.init({
      input: new Input({ source: new BlobSource(archivo), formats: ALL_FORMATS }),
      output,
      tracks: "primary",
      video: {
        width: ancho,
        codec: codecVideo,
        // "constant": el encoder se ciñe más al bitrate (con "variable" se pasa en escenas con mucho movimiento)
        quality: new Quality({ bitrate: bps, bitrateMode: "constant" }),
        ...(fps > 31 ? { frameRate: 30 } : {}),
        forceTranscode: true,
      },
      audio: { codec: codecAudio, quality: new Quality({ bitrate: AUDIO_BPS }), numberOfChannels: 2 },
      showWarnings: false,
    });
    if (!conversion.isValid) throw new ErrorVideo("Este navegador no puede comprimir ese video. Prueba en Chrome o súbelo a YouTube.");
    conversion.onProgress = p => alAvanzar(p, intento);
    await conversion.execute();
    return new Blob([output.target.buffer], { type: "video/mp4" });
  };

  let blob = await convertir(bps, 1);
  // si el encoder se pasó, otra vuelta con el bitrate rebajado en la misma proporción
  if (blob.size > MAX_SALIDA_MB * 1048576) {
    const audio = (AUDIO_BPS * segundos) / 8;
    const videoReal = (blob.size - audio) * 8 / segundos;
    bps = Math.max(300_000, Math.floor(bps * ((OBJETIVO_MB * 0.85 * 1048576 * 8) / segundos - AUDIO_BPS) / videoReal));
    blob = await convertir(bps, 2);
  }
  if (blob.size > MAX_SALIDA_MB * 1048576) {
    throw new ErrorVideo(`Aun comprimido pesa ${Math.round(blob.size / 1048576)} MB. Recórtalo o súbelo a YouTube y pega el link.`);
  }
  return { blob, segundos };
}

// una imagen fija del clip (el cuadro del segundo 1) para mostrar antes de darle play
export function cuadroDe(blob) {
  return new Promise((ok, mal) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(blob);
    const fin = r => { URL.revokeObjectURL(url); r(); };
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadeddata = () => { v.currentTime = Math.min(1, v.duration / 2 || 0); };
    v.onseeked = () => {
      const lienzo = document.createElement("canvas");
      const escala = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
      lienzo.width = Math.round(v.videoWidth * escala);
      lienzo.height = Math.round(v.videoHeight * escala);
      lienzo.getContext("2d").drawImage(v, 0, 0, lienzo.width, lienzo.height);
      lienzo.toBlob(b => fin(() => (b ? ok(b) : mal(new Error("sin miniatura")))), "image/webp", 0.8);
    };
    v.onerror = () => fin(() => mal(new Error("no se pudo leer el clip")));
    v.src = url;
  });
}
