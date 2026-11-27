// Carga de los datos generados por scripts/generar-datos.mjs (public/data/).
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
const BASE = import.meta.env.BASE_URL;
const cache = new Map();
const cursos = new Map();

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} al pedir ${url}`);
  return r.json();
}

/** Pide un archivo de data/ una sola vez; si falla, el siguiente intento vuelve a pedirlo. */
function unaVez(nombre) {
  if (!cache.has(nombre)) cache.set(nombre, json(`${BASE}data/${nombre}.json`).catch((e) => { cache.delete(nombre); throw e; }));
  return cache.get(nombre);
}

export const cargarCatalogo = () => unaVez('catalogo');
export const cargarPlan = () => unaVez('plan');
export const cargarExtras = () => unaVez('extras');
/** Datos personales opcionales (personal/mis-datos.json). Si no existen, un objeto vacío. */
export const cargarPersonal = () => unaVez('personal').catch(() => ({}));

export function cargarCurso(slug) {
  if (!cursos.has(slug)) {
    cursos.set(slug, json(`${BASE}data/cursos/${encodeURIComponent(slug)}.json`).catch((e) => { cursos.delete(slug); throw e; }));
  }
  return cursos.get(slug);
}

/** Devuelve {area, bloque, curso} del catálogo para un slug, o null. */
export function ubicarCurso(cat, slug) {
  for (const area of cat.areas)
    for (const bloque of area.bloques)
      for (const curso of bloque.cursos)
        if (curso.slug === slug) return { area, bloque, curso };
  return null;
}

export const unidad = (c) => (c.soloPreguntas ? 'preguntas' : 'ejercicios');

/** Ámbitos para practicar: cada área con guías y cada uno de sus bloques. */
export function ambitos(cat) {
  const lista = [];
  for (const a of cat.areas) {
    if (!a.listos) continue;
    lista.push({ valor: `area:${a.id}`, etiqueta: `Toda el área: ${a.nombre}`, grupo: a.nombre, area: a.id, cursos: a.bloques.flatMap((b) => b.cursos).filter((c) => !c.pendiente) });
    for (const b of a.bloques) {
      const cs = b.cursos.filter((c) => !c.pendiente);
      if (cs.length) lista.push({ valor: `bloque:${a.id}:${b.id}`, etiqueta: b.semana ? `Bloque ${b.nombre}` : `${b.nombre} (${a.nombre})`, grupo: a.nombre, area: a.id, bloque: b.id, cursos: cs });
    }
  }
  return lista;
}

// ---------- Banco de inglés ----------
let ingles = null;

/** Banco de inglés con un índice por id de pregunta: {temas, porId, preguntasDe(tema)}. */
export function cargarIngles() {
  if (!ingles) {
    ingles = unaVez('ingles').then((b) => {
      const porId = new Map();
      for (const t of b.temas) {
        t.todas = t.preguntas ? t.preguntas.map((p) => ({ ...p, tema: t.id })) : t.textos.flatMap((x) => x.preguntas.map((p) => ({ ...p, tema: t.id, texto: x.id })));
        for (const p of t.todas) porId.set(p.id, p);
        for (const x of t.textos || []) x.tema = t.id;
      }
      return { temas: b.temas, porId, total: porId.size, tema: (id) => b.temas.find((t) => t.id === id) || null, textoDe: (p) => (p.texto ? b.temas.find((t) => t.id === p.tema).textos.find((x) => x.id === p.texto) : null) };
    }).catch((e) => { ingles = null; throw e; });
  }
  return ingles;
}
