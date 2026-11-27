// Utilidades compartidas por generar-datos.mjs y validar.mjs.
// La carpeta de la skill (privados-umg/privados-umg) viene de PrivStudyPage y aquí solo se lee.
// Lo propio de esta adaptación vive en contenido/: guías locales, banco de inglés y plan.
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SKILL = path.join(RAIZ, 'privados-umg', 'privados-umg');
export const DIR_DATOS = path.join(SKILL, 'data');
export const CSV = path.join(SKILL, 'references', 'cursos.csv');
export const CONTENIDO = path.join(RAIZ, 'contenido');
export const DIR_LOCALES = path.join(CONTENIDO, 'guias');
export const DIR_INGLES = path.join(CONTENIDO, 'ingles');
export const PLAN = path.join(CONTENIDO, 'plan', 'plan.json');
export const PERSONAL = path.join(RAIZ, 'personal', 'mis-datos.json');

export const AREAS = [
  {
    id: 'ciencias',
    nombre: 'Ciencias de la Ingeniería',
    bloques: ['Matemática', 'Cálculo', 'Probabilidad y estadística', 'Metodología de la investigación', 'Física', 'Electrónica', 'Sin semana propia'],
  },
  {
    id: 'administracion',
    nombre: 'Administración de Sistemas',
    bloques: ['Sistemas operativos', 'Arquitectura de computadoras', 'Redes', 'Comunicaciones', 'Sistemas de Información Gerencial', 'Auditoría y Seguridad de Sistemas', 'Sin semana propia'],
  },
  {
    id: 'desarrollo',
    nombre: 'Análisis, Diseño y Desarrollo',
    bloques: ['Programación', 'Programación avanzada', 'Bases de datos', 'Desarrollo web', 'Análisis de sistemas', 'Ingeniería de software', 'Sin semana propia'],
  },
];

/** Minúsculas, sin acentos ni signos: sirve para cruzar títulos y para crear slugs. */
export function normalizar(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Parser CSV mínimo con soporte para campos entre comillas. */
export function leerCSV(ruta) {
  const texto = fs.readFileSync(ruta, 'utf8').replace(/^﻿/, '');
  const filas = [];
  let fila = [], campo = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      if (fila.some((x) => x !== '')) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
  const [enc, ...resto] = filas;
  return resto.map((f) => Object.fromEntries(enc.map((k, i) => [k.trim(), (f[i] ?? '').trim()])));
}

const jsonDe = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : []);

/**
 * Devuelve [{archivo, curso, local}] con cada guía: las de PrivStudyPage (data/) y las locales
 * (contenido/guias/). Si un slug existe en los dos lados gana la de PrivStudyPage, así una guía
 * local deja de usarse sola el día que la original publique ese curso.
 */
export function leerCursos() {
  const leer = (dir, local) => jsonDe(dir).map((archivo) => ({ archivo, local, curso: JSON.parse(fs.readFileSync(path.join(dir, archivo), 'utf8')) }));
  const originales = leer(DIR_DATOS, false);
  const slugs = new Set(originales.map((x) => x.curso.slug));
  return [...originales, ...leer(DIR_LOCALES, true).filter((x) => !slugs.has(x.curso.slug))];
}

/** Devuelve [{archivo, tema}] con cada archivo del banco de inglés. */
export function leerIngles() {
  return jsonDe(DIR_INGLES).map((archivo) => ({ archivo, tema: JSON.parse(fs.readFileSync(path.join(DIR_INGLES, archivo), 'utf8')) }));
}

/** CRC32 (IEEE) de un texto UTF-8; se usa para ubicar la opción correcta de forma determinista. */
export function crc32(texto) {
  let c, crc = 0xffffffff;
  for (const b of Buffer.from(texto, 'utf8')) {
    c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export const tipoEjercicio = (e) => ('pasos' in e ? 'resuelto' : 'ops' in e ? 'quiz' : 'practica');
