// Genera public/data/ a partir de la skill de PrivStudyPage y de contenido/:
//   catalogo.json        áreas -> bloques -> cursos (listos y pendientes), con conteos
//   cursos/<slug>.json   contenido completo de cada curso, se carga bajo demanda
//   plan.json            plan del escenario (contenido/plan) y sesiones de fundamentos
//   ingles.json          banco de preguntas de inglés (contenido/ingles)
//   extras.json          preguntas de entrevista y oraciones de dictado (contenido/extras)
//   personal.json        datos personales opcionales (personal/mis-datos.json, fuera de git)
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, CSV, AREAS, CONTENIDO, PLAN, PERSONAL, normalizar, leerCSV, leerCursos, leerIngles, tipoEjercicio } from './comun.mjs';

const SALIDA = path.join(RAIZ, 'public', 'data');
const SALIDA_CURSOS = path.join(SALIDA, 'cursos');
fs.rmSync(SALIDA, { recursive: true, force: true });
fs.mkdirSync(SALIDA_CURSOS, { recursive: true });

const avisos = [];
const filas = leerCSV(CSV);
const porTitulo = new Map(filas.map((f) => [normalizar(f.curso), f]));
const usados = new Set();

// Cursos con guía escrita
const conGuia = new Map(); // titulo normalizado -> resumen
for (const { archivo, curso, local } of leerCursos()) {
  const clave = normalizar(curso.titulo);
  const fila = porTitulo.get(clave);
  if (!fila) { avisos.push(`${archivo}: "${curso.titulo}" no aparece en cursos.csv; no se publica.`); continue; }
  if (curso.area && curso.area !== fila.area) avisos.push(`${archivo}: área "${curso.area}" distinta de la del CSV ("${fila.area}"); se usa la del CSV.`);
  if (`${curso.slug}.json` !== archivo) avisos.push(`${archivo}: el slug interno es "${curso.slug}".`);
  usados.add(clave);
  const ejercicios = curso.temas.flatMap((t) => t.ejercicios);
  conGuia.set(clave, {
    slug: curso.slug,
    ...(local ? { local: true } : {}),
    temas: curso.temas.map((t) => ({ titulo: t.titulo, ejercicios: t.ejercicios.length, conceptos: (t.conceptos || []).length })),
    ejercicios: ejercicios.length,
    soloPreguntas: ejercicios.every((e) => tipoEjercicio(e) === 'quiz'),
    tipos: {
      resuelto: ejercicios.filter((e) => tipoEjercicio(e) === 'resuelto').length,
      practica: ejercicios.filter((e) => tipoEjercicio(e) === 'practica').length,
      quiz: ejercicios.filter((e) => tipoEjercicio(e) === 'quiz').length,
    },
  });
  fs.writeFileSync(path.join(SALIDA_CURSOS, `${curso.slug}.json`), JSON.stringify({ ...curso, area: fila.area, ...(local ? { local: true } : {}) }));
}

// Catálogo completo (50 cursos) ordenado por área, bloque y ciclo
const catalogo = {
  generado: new Date().toISOString(),
  areas: AREAS.map((a) => {
    const deArea = filas.filter((f) => f.area === a.nombre);
    const nombresBloque = [...a.bloques, ...new Set(deArea.map((f) => f.bloque).filter((b) => !a.bloques.includes(b)))];
    const bloques = nombresBloque
      .map((b) => ({
        id: normalizar(b),
        nombre: b,
        semana: b !== 'Sin semana propia',
        cursos: deArea
          .filter((f) => f.bloque === b)
          .sort((x, y) => +x.ciclo - +y.ciclo || x.curso.localeCompare(y.curso, 'es'))
          .map((f) => {
            const g = conGuia.get(normalizar(f.curso));
            const base = { titulo: f.curso, ciclo: +f.ciclo, pdf: f.programa_pdf };
            return g ? { ...base, ...g } : { ...base, slug: normalizar(f.curso), pendiente: true };
          }),
      }))
      .filter((b) => b.cursos.length);
    const cursos = bloques.flatMap((b) => b.cursos);
    return {
      id: a.id,
      nombre: a.nombre,
      bloques,
      listos: cursos.filter((c) => !c.pendiente).length,
      locales: cursos.filter((c) => c.local).length,
      total: cursos.length,
      ejercicios: cursos.reduce((s, c) => s + (c.ejercicios || 0), 0),
    };
  }),
};

for (const f of filas) if (!AREAS.some((a) => a.nombre === f.area)) avisos.push(`cursos.csv: "${f.curso}" tiene un área desconocida ("${f.area}").`);

fs.writeFileSync(path.join(SALIDA, 'catalogo.json'), JSON.stringify(catalogo));

// Plan, banco de inglés, extras y datos personales
const leerJSON = (ruta, porDefecto) => (fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : porDefecto);
const plan = leerJSON(PLAN, null);
if (!plan) avisos.push('Falta contenido/plan/plan.json: la vista Hoy no tendrá plan.');
const slugsListos = new Set([...conGuia.values()].map((g) => g.slug));
for (const sem of plan?.semanas || [])
  for (const item of sem.area || [])
    for (const slug of item.cursos || [])
      if (!slugsListos.has(slug)) avisos.push(`plan.json, ${sem.id}: el curso "${slug}" todavía no tiene guía.`);
fs.writeFileSync(path.join(SALIDA, 'plan.json'), JSON.stringify({ ...plan, fundamentos: leerJSON(path.join(CONTENIDO, 'plan', 'fundamentos.json'), null) }));

const temasIngles = leerIngles().map((x) => x.tema);
const preguntasIngles = temasIngles.reduce((s, t) => s + (t.preguntas?.length || 0) + (t.textos || []).reduce((n, x) => n + x.preguntas.length, 0), 0);
fs.writeFileSync(path.join(SALIDA, 'ingles.json'), JSON.stringify({ temas: temasIngles }));
fs.writeFileSync(path.join(SALIDA, 'extras.json'), JSON.stringify({
  entrevista: leerJSON(path.join(CONTENIDO, 'extras', 'entrevista.json'), null),
  dictado: leerJSON(path.join(CONTENIDO, 'extras', 'dictado.json'), null),
}));
const personal = leerJSON(PERSONAL, null);
fs.writeFileSync(path.join(SALIDA, 'personal.json'), JSON.stringify(personal || {}));

const listos = catalogo.areas.reduce((s, a) => s + a.listos, 0);
const total = catalogo.areas.reduce((s, a) => s + a.total, 0);
const ejercicios = catalogo.areas.reduce((s, a) => s + a.ejercicios, 0);
console.log(`Catálogo: ${listos} de ${total} cursos con guía, ${ejercicios} ejercicios y preguntas.`);
for (const a of catalogo.areas) console.log(`  ${a.nombre}: ${a.listos}/${a.total}`);
console.log(`Inglés: ${temasIngles.length} temas, ${preguntasIngles} preguntas.`);
console.log(`Plan: ${plan ? `${plan.semanas.length} semanas (${plan.nombre})` : 'sin plan'}. Datos personales: ${personal ? 'sí (personal/mis-datos.json)' : 'no'}.`);
if (avisos.length) console.warn('Avisos:\n  ' + avisos.join('\n  '));
