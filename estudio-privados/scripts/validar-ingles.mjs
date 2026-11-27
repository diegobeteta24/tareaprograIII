// Valida el banco de inglés (contenido/ingles/*.json) con las reglas de contenido/ingles/FORMATO.md.
// Sale con código 1 si hay errores.
//   node scripts/validar-ingles.mjs             todo el banco
//   node scripts/validar-ingles.mjs modals      solo los temas indicados
import { leerIngles } from './comun.mjs';

const GRUPOS = new Set(['gramatica', 'vocabulario', 'britanico', 'lectura']);
const NIVELES = new Set(['A2', 'B1', 'B2', 'C1']);
const VACIAS = new Set(['br', 'hr', 'wbr']);
const plano = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

function etiquetasBalanceadas(html) {
  const pila = [];
  for (const m of String(html).matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
    const tag = m[1].toLowerCase();
    if (VACIAS.has(tag) || m[2] === '/') continue;
    if (m[0][1] === '/') {
      if (pila.pop() !== tag) return `cierre </${tag}> inesperado`;
    } else pila.push(tag);
  }
  return pila.length ? `sin cerrar: <${pila.join('>, <')}>` : null;
}

const filtro = process.argv.slice(2);
const ids = new Map();
let conErrores = 0, totalPreguntas = 0;
const porNivel = {};

for (const { archivo, tema } of leerIngles()) {
  if (filtro.length && !filtro.includes(tema.id)) continue;
  const errores = [];
  const html = (lugar, s) => { const b = etiquetasBalanceadas(s); if (b) errores.push(`${lugar}: HTML ${b}`); };

  if (`${tema.id}.json` !== archivo) errores.push(`el id "${tema.id}" no coincide con el nombre del archivo`);
  if (!GRUPOS.has(tema.grupo)) errores.push(`grupo desconocido "${tema.grupo}"`);
  if (!tema.titulo) errores.push('falta "titulo"');
  if (!Array.isArray(tema.resumen) || tema.resumen.length < 3) errores.push('el resumen debe tener al menos 3 puntos');
  (tema.resumen || []).forEach((p, i) => html(`resumen ${i + 1}`, p));

  const esLectura = tema.grupo === 'lectura';
  if (esLectura && !Array.isArray(tema.textos)) errores.push('un tema de lectura lleva "textos"');
  if (!esLectura && !Array.isArray(tema.preguntas)) errores.push('falta "preguntas"');

  const grupos = esLectura
    ? (tema.textos || []).map((t) => {
        if (!t.id || !t.titulo || !Array.isArray(t.texto) || !t.texto.length) errores.push(`texto ${t.id || '?'}: faltan id, titulo o texto`);
        if (!NIVELES.has(t.nv)) errores.push(`texto ${t.id}: nivel desconocido "${t.nv}"`);
        const palabras = (t.texto || []).join(' ').split(/\s+/).length;
        if (palabras < 90 || palabras > 320) errores.push(`texto ${t.id}: ${palabras} palabras (entre 90 y 320)`);
        if (!Array.isArray(t.preguntas) || t.preguntas.length < 3) errores.push(`texto ${t.id}: al menos 3 preguntas`);
        return { prefijo: `${t.id}-`, preguntas: t.preguntas || [] };
      })
    : [{ prefijo: `${tema.id}-`, preguntas: tema.preguntas || [] }];

  for (const { prefijo, preguntas } of grupos) {
    for (const p of preguntas) {
      const lugar = p.id || '(sin id)';
      totalPreguntas++;
      porNivel[p.nv] = (porNivel[p.nv] || 0) + 1;
      if (!p.id || !p.id.startsWith(prefijo)) errores.push(`${lugar}: el id debe empezar con "${prefijo}"`);
      if (ids.has(p.id)) errores.push(`${lugar}: id repetido (también en ${ids.get(p.id)})`);
      ids.set(p.id, archivo);
      if (!NIVELES.has(p.nv)) errores.push(`${lugar}: nivel desconocido "${p.nv}"`);
      for (const k of ['q', 'a', 'x']) if (typeof p[k] !== 'string' || !p[k].trim()) errores.push(`${lugar}: falta "${k}"`);
      if (!Array.isArray(p.d) || p.d.length !== 3 || p.d.some((o) => typeof o !== 'string' || !o.trim())) { errores.push(`${lugar}: "d" debe tener 3 distractores`); continue; }
      const opciones = [p.a, ...p.d].map(plano);
      if (new Set(opciones).size !== 4) errores.push(`${lugar}: hay opciones repetidas`);
      const huecos = (String(p.q).match(/_{3,}/g) || []).length;
      if (huecos > 2) errores.push(`${lugar}: más de dos huecos en el enunciado`);
      if (/_{1,2}(?!_)/.test(String(p.q).replace(/_{3,}/g, ''))) errores.push(`${lugar}: el hueco se escribe con tres guiones bajos`);
      for (const s of [p.q, p.a, p.x, ...p.d]) html(lugar, s);
      if (plano(p.x).length < 25) errores.push(`${lugar}: la explicación es demasiado corta`);
    }
  }

  const n = grupos.reduce((s, g) => s + g.preguntas.length, 0);
  if (errores.length) {
    conErrores++;
    console.log(`✗ ${archivo}: ${errores.length} errores`);
    for (const e of errores) console.log(`    ${e}`);
  } else console.log(`✓ ${archivo}: ${n} preguntas`);
}

console.log(`\n${totalPreguntas} preguntas revisadas (${Object.entries(porNivel).sort().map(([k, v]) => `${k}: ${v}`).join(', ') || 'ninguna'}). ${conErrores ? conErrores + ' tema(s) con errores.' : 'Todo correcto.'}`);
process.exit(conErrores ? 1 : 0);
