import { DISCORD_URL } from "../config.js";
import { Aparecer, Cabecera, Magnetico, Tarjeta3D } from "./ui.jsx";

const FASES = [
  ["Paso 1", "Únete al Discord", "Entra al servidor de Discord y léete bien la normativa antes de presentarte."],
  ["Paso 2", "Espera tu turno", "Conéctate al canal de voz de whitelist. Necesitas micrófono y estar en un lugar sin ruido."],
  ["Paso 3", "Entrevista de voz", "Un staff te hace preguntas de rol y de la normativa. Si la pasas, ya puedes entrar a la ciudad."],
];

export default function Whitelist() {
  return (
    <section id="whitelist" className="bloque bloque-alt">
      <Cabecera num="03" titulo="Whitelist">La whitelist es de voz y se hace en el Discord con el staff. Así mantenemos el rol serio.</Cabecera>

      <ol className="fases">
        {FASES.map(([num, titulo, texto], i) => (
          <Aparecer as="li" key={num} delay={i * 0.12}>
            <Tarjeta3D className="fase" inclinacion={5}>
              <span className="fase-num">{num}</span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </Tarjeta3D>
          </Aparecer>
        ))}
      </ol>

      <Aparecer className="wl-cta">
        <Magnetico href={DISCORD_URL} className="btn btn-discord" target="_blank" rel="noopener">Ir al Discord a hacer la whitelist →</Magnetico>
      </Aparecer>
    </section>
  );
}
