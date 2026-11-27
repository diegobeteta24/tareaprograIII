// Cuaderno de errores con repaso espaciado (cajas de Leitner).
// Cada tarjeta apunta a un ejercicio de una guía ("g|slug|t2-e7"), a un concepto para explicar en voz
// alta ("c|slug|t2-c1") o a una pregunta de inglés ("i|modals-05").
// Al fallar una pregunta entra en la caja 1 y vence mañana; cada acierto la sube de caja y la aleja.
import { leerJSON, guardarJSON } from './progreso.js';
import { hoy, sumar } from './fechas.js';

const CLAVE = 'repaso-tarjetas';
const CLAVE_GRAD = 'repaso-graduadas';
export const INTERVALOS = [1, 2, 4, 8, 16]; // días de espera en las cajas 1 a 5

export const idGuia = (slug, ej) => `g|${slug}|${ej}`;
export const idConcepto = (slug, c) => `c|${slug}|${c}`;
export const idIngles = (id) => `i|${id}`;

export function partes(id) {
  const [tipo, a, b] = id.split('|');
  if (tipo === 'g') return { tipo: 'guia', slug: a, ej: b };
  if (tipo === 'c') return { tipo: 'concepto', slug: a, concepto: b };
  return { tipo: 'ingles', pregunta: a };
}

export const tarjetas = () => {
  const v = leerJSON(CLAVE, {});
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
};
const guardar = (t) => guardarJSON(CLAVE, t);

export const graduadas = () => leerJSON(CLAVE_GRAD, 0) || 0;
export const tiene = (id) => !!tarjetas()[id];

/** Anota un fallo: crea la tarjeta o la devuelve a la caja 1. */
export function fallar(id, etiqueta = '') {
  const t = tarjetas();
  const previa = t[id];
  t[id] = { caja: 1, vence: sumar(hoy(), 1), fallos: (previa?.fallos || 0) + 1, vistas: previa?.vistas || 0, creada: previa?.creada || hoy(), etiqueta: etiqueta || previa?.etiqueta || '' };
  guardar(t);
}

/** Agrega a mano una tarjeta que vence hoy (sin contarla como fallo). */
export function agregar(id, etiqueta = '') {
  const t = tarjetas();
  if (!t[id]) t[id] = { caja: 1, vence: hoy(), fallos: 0, vistas: 0, creada: hoy(), etiqueta };
  guardar(t);
}

export function quitar(id) {
  const t = tarjetas();
  delete t[id];
  guardar(t);
}

/** Resultado de un repaso: sube de caja o vuelve a la primera. Tras la caja 5 la tarjeta se gradúa. */
export function repasar(id, bien) {
  const t = tarjetas();
  const c = t[id];
  if (!c) return null;
  c.vistas = (c.vistas || 0) + 1;
  if (!bien) {
    c.caja = 1;
    c.fallos = (c.fallos || 0) + 1;
    c.vence = sumar(hoy(), INTERVALOS[0]);
  } else if (c.caja >= INTERVALOS.length) {
    delete t[id];
    guardarJSON(CLAVE_GRAD, graduadas() + 1);
    guardar(t);
    return { graduada: true };
  } else {
    c.caja += 1;
    c.vence = sumar(hoy(), INTERVALOS[c.caja - 1]);
  }
  guardar(t);
  return c;
}

/** Tarjetas que vencen hoy o antes, las más atrasadas primero. */
export function pendientes(fecha = hoy()) {
  return Object.entries(tarjetas())
    .filter(([, c]) => c.vence <= fecha)
    .sort((a, b) => a[1].vence.localeCompare(b[1].vence) || a[1].caja - b[1].caja)
    .map(([id, c]) => ({ id, ...c }));
}

export function resumen(fecha = hoy()) {
  const t = Object.values(tarjetas());
  const cajas = INTERVALOS.map((_, i) => t.filter((c) => c.caja === i + 1).length);
  return { total: t.length, hoy: t.filter((c) => c.vence <= fecha).length, cajas, graduadas: graduadas() };
}
