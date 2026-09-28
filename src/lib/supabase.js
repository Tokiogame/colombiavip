import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../config.js";

// Si falta la config, la web sigue funcionando con los datos de respaldo
export const sb = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const colorValido = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : "#e0b02c");

// ruta a un archivo de public/img que funciona en cualquier subcarpeta
export const img = archivo => `${import.meta.env.BASE_URL}img/${archivo}`;
