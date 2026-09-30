import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// devuelve qué tiene mal el campo, o "" si está bien
function problema(c) {
  const v = c.value.trim();
  if (c.type === "radio") return c.required && !c.form.querySelector(`input[name="${c.name}"]:checked`) ? "Elige una opción." : "";
  if (c.type === "checkbox") return c.required && !c.checked ? "Debes marcar esta casilla." : "";
  if (c.required && !v) return "Este campo es obligatorio.";
  if (c.dataset.min && v.length < +c.dataset.min) {
    const faltan = +c.dataset.min - v.length;
    return `Respuesta muy corta: te faltan ${faltan} caracteres (mínimo ${c.dataset.min}).`;
  }
  if (c.type === "number" && v) {
    if (c.min && +v < +c.min) return `El mínimo es ${c.min}.`;
    if (c.max && +v > +c.max) return `El máximo es ${c.max}.`;
    if (!c.checkValidity()) return "Escribe un número válido.";
  }
  return "";
}

// revisa todo el formulario; devuelve { nombre: mensaje } y enfoca el primer error
export function validar(form) {
  const errores = {};
  let primero = null;
  for (const c of form.elements) {
    if (!c.name || c.type === "hidden" || c.type === "submit") continue;
    const msg = problema(c);
    if (msg) {
      errores[c.name] = msg;
      primero ??= c;
    }
  }
  primero?.focus();
  return errores;
}

export const resumenErrores = n =>
  n === 1 ? "Hay 1 campo por corregir (marcado en rojo)." : `Hay ${n} campos por corregir (marcados en rojo).`;

function MsgError({ error }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.span className="error-msg" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
          {error}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// etiqueta + control + mensaje de error
export function Campo({ etiqueta, error, children, extra }) {
  return (
    <label className={error ? "error" : ""}>
      {etiqueta} {extra}
      {children}
      <MsgError error={error} />
    </label>
  );
}

// textarea con contador de caracteres y mínimo
export function Texto({ etiqueta, nombre, min = 0, rows = 3, error, valorInicial = "", ...resto }) {
  const [n, setN] = useState(valorInicial.trim().length);
  const ok = n >= min;
  return (
    <label className={error ? "error" : ""}>
      {etiqueta}
      <textarea name={nombre} rows={rows} data-min={min || undefined} required defaultValue={valorInicial}
        onInput={e => setN(e.target.value.trim().length)} {...resto} />
      {min > 0 && (
        <span className={`contador ${ok ? "ok" : ""}`}>
          <i className="contador-barra"><motion.i animate={{ scaleX: Math.min(n / min, 1) }} /></i>
          {n} / {min}
        </span>
      )}
      <MsgError error={error} />
    </label>
  );
}

// pregunta de elegir una sola opción (Sí / No, un puesto…)
export function Opciones({ etiqueta, nombre, opciones, valor, error }) {
  return (
    <div className={`opciones ${error ? "error" : ""}`} role="radiogroup" aria-label={etiqueta}>
      <span className="opciones-titulo">{etiqueta}</span>
      <div className="opciones-lista">
        {opciones.map(o => (
          <label key={o} className="opcion">
            <input type="radio" name={nombre} value={o} required defaultChecked={valor === o} />
            <span>{o}</span>
          </label>
        ))}
      </div>
      <MsgError error={error} />
    </div>
  );
}

export function Casilla({ nombre, children, error }) {
  return (
    <label className={`check ${error ? "error" : ""}`}>
      <input type="checkbox" name={nombre} required />
      {children}
      <MsgError error={error} />
    </label>
  );
}

// aviso bajo el botón de enviar
export function Aviso({ aviso }) {
  return (
    <AnimatePresence mode="wait">
      {aviso?.texto && (
        <motion.p key={aviso.texto} className={`aviso ${aviso.tipo || ""}`} role="status"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
          {aviso.texto}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
