// Pruebas de los ejercicios generados de fundamentos (src/fundamentos/generadores.js).
// No confía en el generador: evalúa el TeX del enunciado con un evaluador propio y comprueba
// que la respuesta lo satisface. También compila cada fórmula con KaTeX en modo estricto.
//   node scripts/probar-generadores.mjs [repeticiones]
import katex from 'katex';
import * as G from '../src/fundamentos/generadores.js';

// ---------- Azar con semilla, para que una falla se pueda repetir ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Evaluador numérico de TeX ----------
function tokens(tex) {
  const s = tex
    .replace(/\\left|\\right|\\big|\\,|\\;|\\!|\\quad/g, ' ')
    .replace(/\\dfrac/g, '\\frac').replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/')
    .replace(/\\le(?![a-z])/g, '≤').replace(/\\ge(?![a-z])/g, '≥');
  const out = [];
  const re = /\s+|(\d+(?:\.\d+)?)|(\\(?:frac|sqrt|pi|mu|sigma))|([a-zA-Z](?:_(?:\{[^}]*\}|[0-9a-zA-Z]))?)|([-+*/^=(){}[\]<>≤≥])/gy;
  let m, pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    m = re.exec(s);
    if (!m) throw new Error(`No se pudo leer el TeX en "${s.slice(pos, pos + 20)}" (de: ${tex})`);
    pos = re.lastIndex;
    if (m[1]) out.push({ t: 'num', v: Number(m[1]) });
    else if (m[2]) out.push(m[2] === '\\pi' ? { t: 'num', v: Math.PI } : ['\\mu', '\\sigma'].includes(m[2]) ? { t: 'id', v: m[2] } : { t: m[2] });
    else if (m[3]) out.push({ t: 'id', v: m[3].replace(/[{}]/g, '') });
    else if (m[4]) out.push({ t: m[4] });
  }
  return out;
}

function evaluar(tex, vars = {}) {
  const ts = Array.isArray(tex) ? tex : tokens(tex);
  let i = 0;
  const ver = () => ts[i]?.t;
  const comer = (t) => { if (ver() !== t) throw new Error(`Se esperaba "${t}" y hay "${ver()}"`); return ts[i++]; };
  const empiezaFactor = () => ['num', 'id', '(', '[', '{', '\\frac', '\\sqrt'].includes(ver());

  function expr() {
    let v = term();
    while (ver() === '+' || ver() === '-') { const op = ts[i++].t; const d = term(); v = op === '+' ? v + d : v - d; }
    return v;
  }
  function term() {
    let v = unario();
    for (;;) {
      if (ver() === '*') { i++; v *= unario(); }
      else if (ver() === '/') { i++; v /= unario(); }
      else if (empiezaFactor()) v *= potencia();
      else return v;
    }
  }
  function unario() {
    if (ver() === '-') { i++; return -unario(); }
    return potencia();
  }
  function potencia() {
    const base = atomo();
    if (ver() !== '^') return base;
    i++;
    let e;
    if (ver() === '{') { i++; e = expr(); comer('}'); }
    else if (ver() === '-') { i++; e = -atomo(); }
    else e = atomo();
    // Raíz de índice impar de un negativo, escrita como potencia fraccionaria
    return base < 0 && !Number.isInteger(e) ? NaN : base ** e;
  }
  function grupo(abre, cierra) { comer(abre); const v = expr(); comer(cierra); return v; }
  function atomo() {
    const t = ts[i];
    if (!t) throw new Error('Expresión incompleta');
    if (t.t === 'num') { i++; return t.v; }
    if (t.t === 'id') {
      i++;
      if (!(t.v in vars)) throw new Error(`Variable sin valor: ${t.v}`);
      return vars[t.v];
    }
    if (t.t === '(') return grupo('(', ')');
    if (t.t === '[') return grupo('[', ']');
    if (t.t === '{') return grupo('{', '}');
    if (t.t === '\\frac') { i++; const n = grupo('{', '}'); const d = grupo('{', '}'); return n / d; }
    if (t.t === '\\sqrt') {
      i++;
      let indice = 2;
      if (ver() === '[') indice = grupo('[', ']');
      const r = grupo('{', '}');
      return r < 0 && indice % 2 === 1 ? -((-r) ** (1 / indice)) : r ** (1 / indice);
    }
    throw new Error(`Símbolo inesperado "${t.t}"`);
  }
  const v = expr();
  if (i !== ts.length) throw new Error(`Sobra "${ver()}" al evaluar`);
  return v;
}

/** Parte "izq = der" (o con <, >, ≤, ≥) y evalúa cada lado. */
function lados(tex, vars) {
  const ts = tokens(tex);
  const k = ts.findIndex((t) => ['=', '<', '>', '≤', '≥'].includes(t.t));
  if (k < 0) throw new Error(`Sin signo de relación: ${tex}`);
  return { izq: evaluar(ts.slice(0, k), vars), der: evaluar(ts.slice(k + 1), vars), rel: ts[k].t };
}

const cerca = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const cumple = (rel, a, b) => ({ '=': cerca(a, b), '<': a < b - 1e-12, '>': a > b + 1e-12, '≤': a <= b + 1e-12, '≥': a >= b - 1e-12 })[rel];

// ---------- Comprobaciones por tipo de ejercicio ----------
function comprobar(ej, azar) {
  const p = ej.prueba;
  const f = G.fnum;
  const fallar = (msg) => { throw new Error(msg); };
  const x0 = () => (azar() * 6 - 3) + 0.1234;

  switch (p.tipo) {
    case 'valor': {
      const v = evaluar(p.tex);
      const esperado = p.valor ? f(p.valor) : p.aprox;
      if (!cerca(v, esperado)) fallar(`el enunciado vale ${v} y la respuesta dice ${esperado}`);
      break;
    }
    case 'identidad': {
      for (let n = 0; n < 6; n++) {
        let x;
        do x = x0(); while ((p.evitar || []).some((e) => Math.abs(x - e) < 0.05) || Math.abs(x) < 0.05);
        const a = evaluar(p.izq, { x }), b = evaluar(p.der, { x });
        if (!cerca(a, b)) fallar(`no es identidad en x=${x}: ${a} contra ${b}`);
      }
      break;
    }
    case 'division':
      if (p.N !== p.d * p.q + p.res || p.res < 0 || p.res >= p.d) fallar('cociente o residuo incorrectos');
      if (f(ej.campos[0].valor) !== p.q || f(ej.campos[1].valor) !== p.res) fallar('los campos no coinciden con el cociente y el residuo');
      break;
    case 'potencia':
      if (p.base ** p.exp !== p.valor || f(ej.campos[0].valor) !== p.base) fallar('raíz incorrecta');
      break;
    case 'cientifica': {
      const mant = f(p.mantisa);
      if (!(mant >= 1 && mant < 10)) fallar(`mantisa ${mant} fuera de [1, 10)`);
      const v = mant * 10 ** p.exp;
      if (p.numero && !cerca(v, Number(p.numero))) fallar(`${mant}e${p.exp} no es ${p.numero}`);
      if (p.valor && !cerca(v, f(p.valor))) fallar('el valor decimal no coincide');
      if (p.tex && !cerca(v, evaluar(p.tex))) fallar(`el enunciado vale ${evaluar(p.tex)} y la respuesta ${v}`);
      break;
    }
    case 'numero':
      if (!cerca(p.valor, p.dado)) fallar(`se esperaba ${p.valor} y la respuesta dice ${p.dado}`);
      if (ej.campos.length === 1 && !cerca(f(ej.campos[0].valor), p.dado)) fallar('el campo no coincide con la respuesta');
      break;
    case 'ecuacion':
      for (const sol of p.vars) {
        const vars = Object.fromEntries(Object.entries(sol).map(([k, v]) => [k, f(v)]));
        for (const ec of p.ecs) {
          const l = lados(ec, vars);
          if (!cerca(l.izq, l.der)) fallar(`${JSON.stringify(vars)} no cumple ${ec}: ${l.izq} contra ${l.der}`);
        }
      }
      break;
    case 'despeje': {
      const nombres = [...new Set(tokens(`${p.f} ${p.ok} ${p.mal.join(' ')}`).filter((t) => t.t === 'id').map((t) => t.v))];
      const despejar = (formula, vars) => {
        const ts = tokens(formula);
        const k = ts.findIndex((t) => t.t === '=');
        if (ts[0].v !== p.v || k !== 1) fallar(`el despeje no empieza con "${p.v} =": ${formula}`);
        return evaluar(ts.slice(2), vars);
      };
      let distinguidas = new Array(p.mal.length).fill(false);
      for (let n = 0; n < 8; n++) {
        const vars = Object.fromEntries(nombres.filter((x) => x !== p.v).map((x) => [x, 1.3 + azar() * 2.5]));
        if (p.v === 'r' && 'S' in vars && 'a' in vars) vars.a = vars.S * (0.2 + azar() * 0.5);
        const v = despejar(p.ok, vars);
        const l = lados(p.f, { ...vars, [p.v]: v });
        if (!cerca(l.izq, l.der)) fallar(`el despeje correcto no cumple la fórmula (${l.izq} contra ${l.der})`);
        p.mal.forEach((malo, j) => {
          const vm = despejar(malo, vars);
          const lm = lados(p.f, { ...vars, [p.v]: vm });
          if (!cerca(lm.izq, lm.der)) distinguidas[j] = true;
        });
      }
      if (distinguidas.some((d) => !d)) fallar(`un distractor también cumple la fórmula: ${p.mal[distinguidas.indexOf(false)]}`);
      break;
    }
    case 'discriminante':
      if (p.b * p.b - 4 * p.a * p.c !== p.disc || p.n !== (p.disc > 0 ? 2 : p.disc === 0 ? 1 : 0)) fallar('discriminante incorrecto');
      break;
    case 'desigualdad': {
      const k = f(p.k);
      const rel = { '<': '<', '>': '>', '\\le': '≤', '\\ge': '≥' }[p.final];
      for (const x of [k - 1.7, k - 0.01, k, k + 0.01, k + 2.3]) {
        const l = lados(p.tex, { x });
        if (cumple(l.rel, l.izq, l.der) !== cumple(rel, x, k)) fallar(`en x=${x} la desigualdad y la respuesta no coinciden`);
      }
      break;
    }
    case 'division-poli':
      for (let n = 0; n < 5; n++) {
        const x = x0();
        const a = evaluar(p.dividendo, { x }), b = evaluar(p.divisor, { x }) * evaluar(p.cociente, { x }) + p.residuo;
        if (!cerca(a, b)) fallar(`dividendo ≠ divisor × cociente + residuo en x=${x}`);
      }
      break;
    case 'log':
      if (!cerca(Math.log(p.arg) / Math.log(p.base), f(p.valor))) fallar(`log base ${p.base} de ${p.arg} no es ${f(p.valor)}`);
      break;
    default:
      fallar(`tipo de prueba desconocido: ${p.tipo}`);
  }
}

function formulasDe(ej) {
  const textos = [ej.q, ej.r, ...ej.sol, ...(ej.ops || []), ...(ej.campos || []).flatMap((c) => [c.antes, c.despues])];
  return textos.flatMap((t) => [...String(t || '').matchAll(/\\\(([\s\S]+?)\\\)/g)].map((m) => m[1]));
}

// ---------- Pruebas ----------
let fallas = 0, total = 0;
const informar = (donde, e, ej) => {
  fallas++;
  if (fallas <= 25) console.log(`✗ ${donde}: ${e.message}${ej ? `\n    ${ej.q}\n    → ${ej.r}` : ''}`);
};

// Utilidades
const casos = [
  [() => G.poli([1, -5, 6]), 'x^{2} - 5x + 6'], [() => G.poli([-1, 0, 4]), '-x^{2} + 4'], [() => G.poli([2, 1]), '2x + 1'], [() => G.poli([1, -1]), 'x - 1'],
  [() => G.poli([0, 0]), '0'], [() => G.poli([3, 0, 0]), '3x^{2}'], [() => G.poli([-1, -1, -1]), '-x^{2} - x - 1'],
  [() => G.dec(12345, 2), '123.45'], [() => G.dec(-5, 1), '-0.5'], [() => G.dec(1200, 2), '12'], [() => G.dec(7, 0), '7'], [() => G.dec(32, 5), '0.00032'],
  [() => JSON.stringify(G.leerNumero('3/4')), JSON.stringify({ n: 3, d: 4, reducible: false })],
  [() => JSON.stringify(G.leerNumero('6/8')), JSON.stringify({ n: 3, d: 4, reducible: true })],
  [() => JSON.stringify(G.leerNumero(' −0.75 ')), JSON.stringify({ n: -3, d: 4 })],
  [() => JSON.stringify(G.leerNumero('1,250')), JSON.stringify({ n: 1250, d: 1 })],
  [() => JSON.stringify(G.leerNumero('1,5')), JSON.stringify({ n: 3, d: 2 })],
  [() => JSON.stringify(G.leerNumero('Q112.50')), JSON.stringify({ n: 225, d: 2 })],
  [() => JSON.stringify(G.leerNumero('.5')), JSON.stringify({ n: 1, d: 2 })],
  [() => String(G.leerNumero('abc')), 'null'], [() => String(G.leerNumero('1/0')), 'null'], [() => String(G.leerNumero('')), 'null'],
  [() => String(evaluar('-3^{2} + (-4)^{2}')), '7'], [() => String(evaluar('12 - 3 * (4 - 5)')), '15'], [() => String(evaluar('\\frac{1}{2} + \\frac{1}{4}')), '0.75'],
  [() => String(evaluar('2x^{3}', { x: 2 })), '16'], [() => String(evaluar('(x + 2)(x - 3)', { x: 5 })), '14'], [() => String(evaluar('\\sqrt[3]{-27}')), '-3'],
  [() => String(evaluar('8 - [5 - (1 + 2) * 3]')), '12'], [() => String(evaluar('10 - 12 / 4')), '7'],
];
for (const [fn, esperado] of casos) {
  total++;
  try { const v = fn(); if (v !== esperado) throw new Error(`se obtuvo ${v} y se esperaba ${esperado}`); }
  catch (e) { informar('utilidades', e); }
}

const repeticiones = Number(process.argv[2]) || 400;
for (const tema of G.TEMAS) {
  let vistos = 0;
  for (const nv of [1, 2, 3]) {
    const azar = mulberry32(1000 * nv + tema.id.length * 7919 + tema.id.charCodeAt(0));
    G.usarAzar(azar);
    for (let n = 0; n < repeticiones; n++) {
      total++; vistos++;
      let ej;
      try {
        ej = G.generar(tema.id, nv);
        if (!ej.q || !ej.r || !Array.isArray(ej.sol) || !ej.sol.length) throw new Error('faltan enunciado, respuesta o solución');
        if (!!ej.ops === !!ej.campos) throw new Error('debe tener campos o opciones, no ambos');
        if (/undefined|NaN|\[object|Infinity/.test(JSON.stringify(ej))) throw new Error('hay un valor sin definir en los textos');
        for (const tex of formulasDe(ej)) katex.renderToString(tex, { throwOnError: true, strict: 'error' });
        if (ej.ops) {
          if (ej.ops.length !== 4 || new Set(ej.ops).size !== 4) throw new Error('las cuatro opciones deben ser distintas');
          if (!G.revisar(ej, [ej.ok]).ok || G.revisar(ej, [(ej.ok + 1) % 4]).ok) throw new Error('la revisión de opciones falla');
        } else {
          const correctas = ej.campos.map((c) => G.ftexto(c.valor));
          if (!G.revisar(ej, correctas).ok) throw new Error('la respuesta correcta no pasa la revisión');
          if (ej.orden === false && !G.revisar(ej, [...correctas].reverse()).ok) throw new Error('debería aceptar otro orden');
          const mala = [...correctas]; mala[0] = G.ftexto(G.F(ej.campos[0].valor.n + ej.campos[0].valor.d, ej.campos[0].valor.d));
          if (ej.orden !== false && G.revisar(ej, mala).ok) throw new Error('acepta una respuesta incorrecta');
          if (!G.revisar(ej, correctas.map(() => 'x')).invalida) throw new Error('no detecta una entrada que no es número');
        }
        comprobar(ej, azar);
      } catch (e) { informar(`${tema.id} nivel ${nv}`, e, ej); }
    }
  }
  console.log(`  ${tema.id}: ${vistos} ejercicios`);
}
G.usarAzar(null);

console.log(`\n${total} comprobaciones, ${fallas} fallas.`);
process.exit(fallas ? 1 : 0);
