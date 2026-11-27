// Valida los cursos de la skill con las reglas de references/modelo-datos.md
// (port de motor.validar() y chk.js). Sale con código 1 si hay errores.
//   node scripts/validar.mjs              todos los cursos
//   node scripts/validar.mjs redes-1      solo los slugs indicados
//   node scripts/validar.mjs ruta/a.json  un borrador fuera de data/ (cualquier ruta que termine en .json)
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { leerCursos, tipoEjercicio } from './comun.mjs';

const VACIAS = new Set(['br', 'hr', 'img', 'input', 'wbr', 'col', 'meta', 'link', 'source']);
const ENTIDADES = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

function etiquetasBalanceadas(html) {
  const pila = [];
  for (const m of html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
    const tag = m[1].toLowerCase();
    if (VACIAS.has(tag) || m[2] === '/') continue;
    if (m[0][1] === '/') {
      if (pila.pop() !== tag) return `cierre </${tag}> inesperado`;
    } else pila.push(tag);
  }
  return pila.length ? `sin cerrar: <${pila.join('>, <')}>` : null;
}

function formulasDeTexto(html) {
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/&(lt|gt|amp|quot|#39|nbsp);/g, (e) => ENTIDADES[e]);
  return [
    ...[...texto.matchAll(/\\\[([\s\S]+?)\\\]/g)].map((m) => [m[1], true]),
    ...[...texto.matchAll(/\\\(([\s\S]+?)\\\)/g)].map((m) => [m[1], false]),
  ];
}

function compilar(tex, display) {
  try { katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'error' }); return null; }
  catch (e) { return e.message.slice(0, 120); }
}

function validarCurso(c) {
  const errores = [];
  const textos = []; // [lugar, html]
  const formulas = []; // [lugar, tex, display]
  for (const k of ['slug', 'titulo', 'meta', 'lead', 'fuente', 'temas']) if (!c[k]) errores.push(`falta "${k}"`);
  if (c.firma) formulas.push(['firma', c.firma, true]);
  textos.push(['lead', c.lead || ''], ['firma_nota', c.firma_nota || ''], ['como', c.como || '']);

  (c.temas || []).forEach((t, i) => {
    const ti = `Tema ${i + 1}`;
    const ej = t.ejercicios || [];
    const res = ej.filter((e) => tipoEjercicio(e) === 'resuelto');
    const pra = ej.filter((e) => tipoEjercicio(e) === 'practica');
    const qz = ej.filter((e) => tipoEjercicio(e) === 'quiz');
    if (ej.length < 10) errores.push(`${ti}: ${ej.length} ejercicios (mínimo 10)`);
    if (!qz.length) {
      if (res.length < 5) errores.push(`${ti}: ${res.length} resueltos (mínimo 5)`);
      if (pra.length < 5) errores.push(`${ti}: ${pra.length} para resolver (mínimo 5)`);
    }
    const niveles = new Set(ej.map((e) => e.nv));
    for (const n of ['B', 'I', 'A']) if (!niveles.has(n)) errores.push(`${ti}: falta nivel ${n}`);
    for (const n of niveles) if (!['B', 'I', 'A'].includes(n)) errores.push(`${ti}: nivel desconocido "${n}"`);
    if (qz.length >= 4 && new Set(qz.map((e) => e.ok)).size === 1) errores.push(`${ti}: la respuesta correcta siempre está en la misma posición`);
    textos.push([`${ti} título`, t.titulo || ''], [`${ti} intro`, t.intro || '']);

    (t.conceptos || []).forEach((co, j) => {
      const lugar = `${ti}, concepto ${j + 1} (${co.n})`;
      if (!co.n) errores.push(`${lugar}: sin nombre`);
      if (!Array.isArray(co.u) || co.u.length !== 4) errores.push(`${lugar}: debe tener 4 usos (dónde, por qué, cuándo, cómo)`);
      [].concat(co.e || []).forEach((p) => textos.push([lugar, p]));
      (co.u || []).forEach((p) => textos.push([lugar, p]));
      if (co.tabla) textos.push([lugar, co.tabla]);
      if (co.fn) textos.push([lugar, co.fn]);
      if (co.f) formulas.push([lugar, co.f, true]);
    });

    ej.forEach((e, j) => {
      const lugar = `${ti}, ejercicio ${j + 1}`;
      if (!e.q) errores.push(`${lugar}: sin enunciado`);
      if (!e.r) errores.push(`${lugar}: sin respuesta`);
      if ('pasos' in e && (!Array.isArray(e.pasos) || e.pasos.length < 2 || !e.fin)) errores.push(`${lugar}: resuelto con menos de 2 pasos o sin finalidad`);
      if ('ops' in e && (!Array.isArray(e.ops) || e.ops.length !== 4 || !Number.isInteger(e.ok) || e.ok < 0 || e.ok >= e.ops.length)) errores.push(`${lugar}: cuestionario mal formado (4 opciones y "ok" en rango)`);
      for (const s of [e.q, e.r, e.fin, ...(e.pasos || []), ...(e.ops || [])]) if (s) textos.push([lugar, s]);
    });
  });

  for (const [lugar, html] of textos) {
    const b = etiquetasBalanceadas(html);
    if (b) errores.push(`${lugar}: HTML ${b}`);
    for (const [tex, d] of formulasDeTexto(html)) formulas.push([lugar, tex, d]);
  }
  for (const [lugar, tex, d] of formulas) {
    const e = compilar(tex, d);
    if (e) errores.push(`${lugar}: KaTeX "${tex.slice(0, 50)}" -> ${e}`);
  }
  return { errores, formulas: formulas.length };
}

const args = process.argv.slice(2);
const archivos = args.filter((a) => a.endsWith('.json'));
const filtro = args.filter((a) => !a.endsWith('.json'));
const cursos = archivos.length
  ? archivos.map((a) => ({ archivo: path.basename(a), curso: JSON.parse(fs.readFileSync(a, 'utf8')) }))
  : leerCursos();
let conErrores = 0, totalEj = 0, totalF = 0;
for (const { archivo, curso } of cursos) {
  if (filtro.length && !filtro.includes(curso.slug)) continue;
  const { errores, formulas } = validarCurso(curso);
  const n = (curso.temas || []).reduce((s, t) => s + (t.ejercicios || []).length, 0);
  totalEj += n; totalF += formulas;
  if (errores.length) {
    conErrores++;
    console.log(`✗ ${archivo}: ${errores.length} errores`);
    for (const e of errores) console.log(`    ${e}`);
  } else console.log(`✓ ${archivo}: ${curso.temas.length} temas, ${n} ejercicios, ${formulas} fórmulas`);
}
console.log(`\n${totalEj} ejercicios y ${totalF} fórmulas revisados. ${conErrores ? conErrores + ' curso(s) con errores.' : 'Todo correcto.'}`);
process.exit(conErrores ? 1 : 0);
