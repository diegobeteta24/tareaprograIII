// Ejercicios de aritmética y álgebra sin calculadora, generados al azar.
// Cada generador recibe un nivel (1 a 3) y devuelve:
//   { q, sol[], r, prueba, y además campos[] (respuesta escrita) u ops[] + ok (opción múltiple) }
// Las respuestas salen de la construcción del ejercicio (por ejemplo, se parte de las raíces y se
// arma la ecuación), y scripts/probar-generadores.mjs las comprueba evaluando el enunciado.
// Este módulo no toca el DOM: se puede importar desde Node.

// ---------- Azar ----------
let rnd = Math.random;
/** Cambia la fuente de azar (las pruebas usan una determinista). */
export const usarAzar = (f) => { rnd = f || Math.random; };
const ent = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const elegir = (arr) => arr[Math.floor(rnd() * arr.length)];
const noCero = (a, b) => { let n; do n = ent(a, b); while (n === 0); return n; };
const distintos = (gen, n) => { const s = new Set(); while (s.size < n) s.add(gen()); return [...s]; };

// ---------- Fracciones exactas ----------
const mcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export function F(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = mcd(n, d);
  return { n: n / g, d: d / g };
}
const fsum = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const fres = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
const fmul = (a, b) => F(a.n * b.n, a.d * b.d);
const fdiv = (a, b) => F(a.n * b.d, a.d * b.n);
export const fnum = (a) => a.n / a.d;
export const ftexto = (a) => (a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`);

// ---------- Escritura en TeX ----------
const m = (s) => `\\(${s}\\)`;
const tf = (f) => (f.d === 1 ? `${f.n}` : `${f.n < 0 ? '-' : ''}\\frac{${Math.abs(f.n)}}{${f.d}}`);
const par = (n) => (n < 0 ? `(${n})` : `${n}`);
/** Factor siempre entre paréntesis, para productos escritos como (a)(b). */
const pp = (n) => `(${n})`;
/** a·x + b·y en TeX, sin unos ni ceros de más. */
function lin2(a, b) {
  const uno = (c) => (Math.abs(c) === 1 ? '' : `${Math.abs(c)}`);
  const t = [];
  if (a !== 0) t.push(`${a < 0 ? '-' : ''}${uno(a)}x`);
  if (b !== 0) t.push(t.length ? `${b < 0 ? '-' : '+'} ${uno(b)}y` : `${b < 0 ? '-' : ''}${uno(b)}y`);
  return t.join(' ') || '0';
}
/** Decimal exacto de una fracción cuyo denominador solo tiene factores 2 y 5. */
function decF(f) {
  let k = 0;
  while ((10 ** k) % f.d !== 0) k++;
  return dec(f.n * (10 ** k / f.d), k);
}
const parF = (f) => (f.n < 0 ? `\\left(${tf(f)}\\right)` : tf(f));
/** Entero con separación de miles fina: 45000 -> 45\,000. */
const miles = (s) => { const [e, d] = String(s).split('.'); return e.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') + (d ? `.${d}` : ''); };

/** Polinomio en TeX a partir de sus coeficientes, del mayor grado al término independiente. */
export function poli(cs, v = 'x') {
  const n = cs.length - 1;
  let out = '';
  cs.forEach((c, i) => {
    if (c === 0) return;
    const g = n - i;
    const abs = Math.abs(c);
    const coef = g === 0 || abs !== 1 ? `${abs}` : '';
    const letra = g === 0 ? '' : g === 1 ? v : `${v}^{${g}}`;
    out += out ? (c < 0 ? ' - ' : ' + ') : c < 0 ? '-' : '';
    out += coef + letra;
  });
  return out || '0';
}
const bin = (a, b, v = 'x') => `(${poli([a, b], v)})`;

/** Decimal exacto a partir de un entero y sus lugares decimales: dec(12345, 2) = "123.45". */
export function dec(n, lugares) {
  const s = String(Math.abs(n)).padStart(lugares + 1, '0');
  const e = s.slice(0, s.length - lugares);
  const f = lugares ? s.slice(-lugares).replace(/0+$/, '') : '';
  return `${n < 0 ? '-' : ''}${e}${f ? `.${f}` : ''}`;
}
/** Fracción exacta de un decimal escrito como entero y lugares. */
const Fdec = (n, lugares) => F(n, 10 ** lugares);

const campo = (valor, antes = '', despues = '') => ({ valor: typeof valor === 'number' ? F(valor) : valor, antes, despues });

// ---------- Generadores ----------
function signos(nv) {
  if (nv === 1) {
    const a = noCero(-15, 15), b = noCero(-15, 15), suma = rnd() < 0.5;
    const tex = `${a} ${suma ? '+' : '-'} ${par(b)}`;
    const r = suma ? a + b : a - b;
    return {
      q: `Calcula ${m(tex)}.`, campos: [campo(r, m('='))], r: m(`${r}`), prueba: { tipo: 'valor', tex, valor: F(r) },
      sol: [suma ? `Sumar un número es avanzar hacia su signo: ${m(`${a} + ${par(b)} = ${r}`)}.` : `Restar es sumar el opuesto: ${m(`${a} - ${par(b)} = ${a} + ${par(-b)} = ${r}`)}.`],
    };
  }
  if (nv === 2 && rnd() < 0.5) {
    const a = noCero(-12, 12), b = noCero(-12, 12);
    if (rnd() < 0.5) {
      const tex = `${par(a)} \\times ${par(b)}`;
      return {
        q: `Calcula ${m(tex)}.`, campos: [campo(a * b, m('='))], r: m(`${a * b}`), prueba: { tipo: 'valor', tex, valor: F(a * b) },
        sol: [`Signos ${a * b > 0 ? 'iguales dan positivo' : 'distintos dan negativo'}; después se multiplican los valores: ${m(`${Math.abs(a)} \\times ${Math.abs(b)} = ${Math.abs(a * b)}`)}.`, `Resultado: ${m(`${a * b}`)}.`],
      };
    }
    const q = noCero(-12, 12);
    const tex = `${par(a * q)} \\div ${par(a)}`;
    return {
      q: `Calcula ${m(tex)}.`, campos: [campo(q, m('='))], r: m(`${q}`), prueba: { tipo: 'valor', tex, valor: F(q) },
      sol: [`Signos ${q > 0 ? 'iguales dan positivo' : 'distintos dan negativo'}; después se dividen los valores: ${m(`${Math.abs(a * q)} \\div ${Math.abs(a)} = ${Math.abs(q)}`)}.`, `Resultado: ${m(`${q}`)}.`],
    };
  }
  if (nv === 3 && rnd() < 0.4) {
    const fs = [noCero(-6, 6), noCero(-6, 6), noCero(-5, 5)];
    const tex = fs.map(pp).join('');
    const r = fs.reduce((p, x) => p * x, 1);
    const neg = fs.filter((x) => x < 0).length;
    return {
      q: `Calcula ${m(tex)}.`, campos: [campo(r, m('='))], r: m(`${r}`), prueba: { tipo: 'valor', tex, valor: F(r) },
      sol: [`Hay ${neg} ${neg === 1 ? 'factor negativo' : 'factores negativos'}: cantidad ${neg % 2 ? 'impar, el producto es negativo' : 'par, el producto es positivo'}.`, `Valores: ${m(fs.map((x) => Math.abs(x)).join(' \\times ') + ` = ${Math.abs(r)}`)}. Resultado: ${m(`${r}`)}.`],
    };
  }
  const n = nv === 2 ? 3 : 4;
  const ts = Array.from({ length: n }, () => noCero(-12, 12));
  const ops = ts.slice(1).map(() => (rnd() < 0.5 ? '+' : '-'));
  const tex = `${ts[0]}` + ts.slice(1).map((t, i) => ` ${ops[i]} ${par(t)}`).join('');
  const efectivos = [ts[0], ...ts.slice(1).map((t, i) => (ops[i] === '+' ? t : -t))];
  const r = efectivos.reduce((s, x) => s + x, 0);
  const pos = efectivos.filter((x) => x > 0).reduce((s, x) => s + x, 0);
  const negs = efectivos.filter((x) => x < 0).reduce((s, x) => s + x, 0);
  return {
    q: `Calcula ${m(tex)}.`, campos: [campo(r, m('='))], r: m(`${r}`), prueba: { tipo: 'valor', tex, valor: F(r) },
    sol: [`Quita paréntesis (restar un negativo es sumar): ${m(efectivos.map((x, i) => (i ? (x < 0 ? `- ${-x}` : `+ ${x}`) : `${x}`)).join(' '))}.`, `Junta positivos y negativos: ${m(`${pos} + (${negs}) = ${r}`)}.`],
  };
}

function jerarquia(nv) {
  const plantillas = {
    1: [
      () => { const a = ent(2, 12), b = ent(2, 9), c = ent(2, 9); return { tex: `${a} + ${b} \\times ${c}`, r: a + b * c, sol: [`Primero la multiplicación: ${m(`${b} \\times ${c} = ${b * c}`)}.`, `Después la suma: ${m(`${a} + ${b * c} = ${a + b * c}`)}.`] }; },
      () => { const a = ent(2, 9), b = ent(2, 9), c = ent(2, 9); return { tex: `(${a} + ${b}) \\times ${c}`, r: (a + b) * c, sol: [`Primero el paréntesis: ${m(`${a} + ${b} = ${a + b}`)}.`, `Después la multiplicación: ${m(`${a + b} \\times ${c} = ${(a + b) * c}`)}.`] }; },
      () => { const d = ent(2, 9), q = ent(2, 9), a = ent(10, 40); return { tex: `${a} - ${d * q} \\div ${d}`, r: a - q, sol: [`Primero la división: ${m(`${d * q} \\div ${d} = ${q}`)}.`, `Después la resta: ${m(`${a} - ${q} = ${a - q}`)}.`] }; },
    ],
    2: [
      () => { const a = ent(5, 30), b = ent(2, 6), c = ent(1, 9); let d; do d = ent(1, 9); while (d === c); const p = c - d; return { tex: `${a} - ${b} \\times (${c} - ${d})`, r: a - b * p, sol: [`Paréntesis: ${m(`${c} - ${d} = ${p}`)}.`, `Multiplicación: ${m(`${b} \\times ${par(p)} = ${b * p}`)}.`, `Resta: ${m(`${a} - ${par(b * p)} = ${a - b * p}`)}.`] }; },
      () => { const a = ent(2, 9), b = ent(2, 9), d = ent(2, 9), q = ent(2, 9); return { tex: `${a} \\times ${b} - ${d * q} \\div ${d}`, r: a * b - q, sol: [`Multiplicación y división, de izquierda a derecha: ${m(`${a} \\times ${b} = ${a * b}`)} y ${m(`${d * q} \\div ${d} = ${q}`)}.`, `Resta: ${m(`${a * b} - ${q} = ${a * b - q}`)}.`] }; },
      () => { const a = ent(1, 20), b = ent(2, 6), c = ent(2, 5); return { tex: `${a} + ${b}^{2} \\times ${c}`, r: a + b * b * c, sol: [`Potencia: ${m(`${b}^{2} = ${b * b}`)}.`, `Multiplicación: ${m(`${b * b} \\times ${c} = ${b * b * c}`)}.`, `Suma: ${m(`${a} + ${b * b * c} = ${a + b * b * c}`)}.`] }; },
    ],
    3: [
      () => { const c = elegir([2, 3, 4]), k = ent(1, 4), dif = c * k, b = ent(1, 9), a = b + dif, d = ent(2, 6), e = ent(2, 6); const p = (dif * dif) / c; return { tex: `(${a} - ${b})^{2} \\div ${c} + ${d} \\times ${e}`, r: p + d * e, sol: [`Paréntesis: ${m(`${a} - ${b} = ${dif}`)}.`, `Potencia: ${m(`${dif}^{2} = ${dif * dif}`)}.`, `División y multiplicación: ${m(`${dif * dif} \\div ${c} = ${p}`)} y ${m(`${d} \\times ${e} = ${d * e}`)}.`, `Suma: ${m(`${p} + ${d * e} = ${p + d * e}`)}.`] }; },
      () => { const a = ent(5, 30), b = ent(5, 30), c = ent(1, 6), d = ent(1, 6), e = ent(2, 5); const s = c + d, mm = s * e, t = b - mm; return { tex: `${a} - [${b} - (${c} + ${d}) \\times ${e}]`, r: a - t, sol: [`Paréntesis interno: ${m(`${c} + ${d} = ${s}`)}.`, `Multiplicación: ${m(`${s} \\times ${e} = ${mm}`)}.`, `Corchete: ${m(`${b} - ${mm} = ${t}`)}.`, `Resta final: ${m(`${a} - ${par(t)} = ${a - t}`)}.`] }; },
      () => { const a = ent(2, 7), b = ent(2, 7); return { tex: `-${a}^{2} + (-${b})^{2}`, r: -a * a + b * b, sol: [`Sin paréntesis, el signo no entra en la potencia: ${m(`-${a}^{2} = -(${a}^{2}) = ${-a * a}`)}.`, `Con paréntesis, sí: ${m(`(-${b})^{2} = ${b * b}`)}.`, `Suma: ${m(`${-a * a} + ${b * b} = ${-a * a + b * b}`)}.`] }; },
    ],
  };
  const p = elegir(plantillas[nv])();
  return { q: `Calcula ${m(p.tex)}.`, campos: [campo(p.r, m('='))], r: m(`${p.r}`), sol: p.sol, prueba: { tipo: 'valor', tex: p.tex, valor: F(p.r) } };
}

function fracciones(nv) {
  const propia = (dmin, dmax) => { const d = ent(dmin, dmax); return F(ent(1, d - 1), d); };
  const pasoSuma = (a, b, signo) => {
    const mc = (a.d * b.d) / mcd(a.d, b.d);
    const na = a.n * (mc / a.d), nb = b.n * (mc / b.d);
    const bruto = signo === '+' ? na + nb : na - nb;
    const r = F(bruto, mc);
    return [
      a.d === b.d ? 'Los denominadores ya son iguales.' : `Denominador común: ${m(`\\text{mcm}(${a.d}, ${b.d}) = ${mc}`)}.`,
      `${m(`${tf(a)} ${signo} ${tf(b)} = \\frac{${na} ${signo} ${nb}}{${mc}} = \\frac{${bruto}}{${mc}}`)}.`,
      ...(r.d !== mc || r.d === 1 ? [`Simplifica: ${m(tf(r))}.`] : []),
    ];
  };
  let tex, r, sol;
  if (nv === 1) {
    const d = ent(3, 12), k = elegir([1, 1, 2, 3]);
    const a = F(ent(1, d - 1), d), b = F(ent(1, d * k - 1), d * k);
    const s = rnd() < 0.6 ? '+' : '-';
    tex = `${tf(a)} ${s} ${tf(b)}`; r = s === '+' ? fsum(a, b) : fres(a, b); sol = pasoSuma(a, b, s);
  } else if (nv === 2) {
    const a = propia(2, 12), b = propia(2, 12);
    const op = elegir(['+', '-', '\\times', '\\div']);
    tex = `${tf(a)} ${op} ${tf(b)}`;
    if (op === '+' || op === '-') { r = op === '+' ? fsum(a, b) : fres(a, b); sol = pasoSuma(a, b, op); }
    else if (op === '\\times') { r = fmul(a, b); sol = [`Numerador por numerador y denominador por denominador: ${m(`\\frac{${a.n} \\times ${b.n}}{${a.d} \\times ${b.d}} = \\frac{${a.n * b.n}}{${a.d * b.d}}`)}.`, `Simplifica: ${m(tf(r))}.`]; }
    else { r = fdiv(a, b); sol = [`Dividir es multiplicar por el recíproco: ${m(`${tf(a)} \\times \\frac{${b.d}}{${b.n}} = \\frac{${a.n * b.d}}{${a.d * b.n}}`)}.`, `Simplifica: ${m(tf(r))}.`]; }
  } else {
    const a = propia(2, 9), b = propia(2, 9), c = propia(2, 6);
    if (rnd() < 0.5) {
      const p = fmul(b, c);
      tex = `${tf(a)} + ${tf(b)} \\times ${tf(c)}`; r = fsum(a, p);
      sol = [`Primero la multiplicación: ${m(`${tf(b)} \\times ${tf(c)} = ${tf(p)}`)}.`, ...pasoSuma(a, p, '+')];
    } else {
      const dif = fres(a, b);
      if (dif.n === 0) return fracciones(nv);
      tex = `\\left(${tf(a)} - ${tf(b)}\\right) \\div ${tf(c)}`; r = fdiv(dif, c);
      sol = [...pasoSuma(a, b, '-'), `Divide multiplicando por el recíproco: ${m(`${parF(dif)} \\times \\frac{${c.d}}{${c.n}} = ${tf(r)}`)}.`];
    }
  }
  return { q: `Calcula y simplifica ${m(tex)}.`, campos: [campo(r, m('='))], r: m(tf(r)), sol, prueba: { tipo: 'valor', tex, valor: r } };
}

function division(nv) {
  if (nv < 3) {
    const d = nv === 1 ? ent(3, 9) : ent(12, 48);
    const q = nv === 1 ? ent(23, 180) : ent(21, 240);
    const res = ent(1, d - 1);
    const N = d * q + res;
    return {
      q: `Divide a mano ${m(`${miles(N)} \\div ${d}`)}. Da el cociente entero y el residuo.`,
      campos: [campo(q, 'Cociente'), campo(res, 'Residuo')], r: `cociente ${m(`${q}`)}, residuo ${m(`${res}`)}`,
      sol: [`${m(`${d} \\times ${q} = ${miles(d * q)}`)}, que es el mayor múltiplo de ${d} que cabe en ${m(miles(N))}.`, `Residuo: ${m(`${miles(N)} - ${miles(d * q)} = ${res}`)}. Comprobación: ${m(`${d} \\times ${q} + ${res} = ${miles(N)}`)}.`],
      prueba: { tipo: 'division', N, d, q, res },
    };
  }
  // Decimales con cociente exacto: dividendo = divisor × cociente, todo en enteros escalados
  const [D, a] = elegir([[2, 1], [4, 1], [5, 1], [8, 1], [12, 1], [15, 1], [25, 1], [12, 0], [15, 0], [24, 0], [25, 2], [125, 2]]);
  const [Q, b] = elegir([[ent(11, 99), 1], [ent(101, 999), 2], [ent(12, 480), 0]]);
  const dividendo = dec(D * Q, a + b), divisor = dec(D, a), cociente = dec(Q, b);
  const sol = a
    ? [`Corre el punto ${a} ${a === 1 ? 'lugar' : 'lugares'} en ambos para dividir entre un entero: ${m(`${dec(D * Q, b)} \\div ${D}`)}.`, `Divide como entero y coloca el punto: ${m(cociente)}.`]
    : [`El divisor ya es entero: divide ${m(dividendo)} entre ${m(`${D}`)} y sube el punto al cociente al llegar a él.`, `Resultado: ${m(cociente)}.`];
  return {
    q: `Divide a mano ${m(`${dividendo} \\div ${divisor}`)}. El cociente es exacto.`, campos: [campo(Fdec(Q, b), m('='))], r: m(cociente), sol,
    prueba: { tipo: 'valor', tex: `${dividendo} \\div ${divisor}`, valor: Fdec(Q, b) },
  };
}

function potencias(nv) {
  if (nv === 1) {
    if (rnd() < 0.5) {
      const [b, e] = elegir([[2, 3], [2, 4], [2, 5], [2, 6], [3, 3], [3, 4], [4, 3], [5, 3], [10, 4], [-2, 3], [-3, 2], [-2, 4], [-5, 2], [7, 0], [-4, 0], [6, 1]]);
      const tex = `${par(b)}^{${e}}`;
      return {
        q: `Calcula ${m(tex)}.`, campos: [campo(b ** e, m('='))], r: m(`${b ** e}`), prueba: { tipo: 'valor', tex, valor: F(b ** e) },
        sol: [e === 0 ? 'Todo número distinto de cero elevado a la cero es 1.' : e === 1 ? 'Elevar a la uno deja el número igual.' : `Multiplica la base ${e} veces: ${m(Array(e).fill(par(b)).join(' \\times ') + ` = ${b ** e}`)}.`, ...(b < 0 && e > 1 ? [`Base negativa con exponente ${e % 2 ? 'impar: resultado negativo' : 'par: resultado positivo'}.`] : [])],
      };
    }
    const a = ent(2, 9), b = ent(2, 9), tipo = elegir(['prod', 'pot', 'coc']);
    const tex = tipo === 'prod' ? `x^{${a}} \\cdot x^{${b}}` : tipo === 'pot' ? `\\left(x^{${a}}\\right)^{${b}}` : `\\frac{x^{${a + b}}}{x^{${b}}}`;
    const e = tipo === 'prod' ? a + b : tipo === 'pot' ? a * b : a;
    return {
      q: `Simplifica ${m(tex)}. Escribe el exponente de ${m('x')}.`, campos: [campo(e, 'Exponente de x')], r: m(`x^{${e}}`), prueba: { tipo: 'identidad', izq: tex, der: `x^{${e}}` },
      sol: [tipo === 'prod' ? `Misma base multiplicando: se suman los exponentes, ${m(`${a} + ${b} = ${e}`)}.` : tipo === 'pot' ? `Potencia de una potencia: se multiplican los exponentes, ${m(`${a} \\times ${b} = ${e}`)}.` : `Misma base dividiendo: se restan los exponentes, ${m(`${a + b} - ${b} = ${e}`)}.`],
    };
  }
  if (nv === 2) {
    if (rnd() < 0.5) {
      const [b, e] = elegir([[2, 1], [2, 2], [2, 3], [3, 2], [4, 2], [5, 2], [10, 3], [3, 3], [2, 5], [6, 2]]);
      const tex = `${b}^{-${e}}`;
      return {
        q: `Escribe ${m(tex)} como fracción.`, campos: [campo(F(1, b ** e), m('='))], r: m(tf(F(1, b ** e))), prueba: { tipo: 'valor', tex, valor: F(1, b ** e) },
        sol: [`Exponente negativo: pasa al denominador con exponente positivo, ${m(`${b}^{-${e}} = \\frac{1}{${b}^{${e}}}`)}.`, `${m(`${b}^{${e}} = ${b ** e}`)}, así que el resultado es ${m(tf(F(1, b ** e)))}.`],
      };
    }
    const a = ent(2, 7), b = ent(2, 7), c = ent(2, 9);
    const tex = `\\frac{x^{${a}} \\cdot x^{${b}}}{x^{${c}}}`;
    const e = a + b - c;
    return {
      q: `Simplifica ${m(tex)}. Escribe el exponente de ${m('x')} (puede ser negativo o cero).`, campos: [campo(e, 'Exponente de x')], r: m(`x^{${e}}`), prueba: { tipo: 'identidad', izq: tex, der: `x^{${e}}` },
      sol: [`Arriba se suman: ${m(`${a} + ${b} = ${a + b}`)}.`, `Al dividir se restan: ${m(`${a + b} - ${c} = ${e}`)}.`],
    };
  }
  if (rnd() < 0.5) {
    const p = ent(1, 3), q = ent(p + 1, 5), e = elegir([2, 3]);
    const tex = `\\left(\\frac{${p}}{${q}}\\right)^{-${e}}`;
    const r = F(q ** e, p ** e);
    return {
      q: `Calcula ${m(tex)}.`, campos: [campo(r, m('='))], r: m(tf(r)), prueba: { tipo: 'valor', tex, valor: r },
      sol: [`Exponente negativo en una fracción: se invierte, ${m(`\\left(\\frac{${q}}{${p}}\\right)^{${e}}`)}.`, `Eleva numerador y denominador: ${m(`\\frac{${q ** e}}{${p ** e}} = ${tf(r)}`)}.`],
    };
  }
  const k = ent(2, 5), a = ent(2, 5), n = elegir([2, 3]), b = ent(1, 9);
  const tex = `\\left(${k}x^{${a}}\\right)^{${n}} \\cdot x^{-${b}}`;
  return {
    q: `Simplifica ${m(tex)} hasta la forma ${m('c\\,x^{e}')}.`, campos: [campo(k ** n, 'Coeficiente'), campo(a * n - b, 'Exponente')], r: m(`${k ** n}x^{${a * n - b}}`),
    prueba: { tipo: 'identidad', izq: tex, der: `${k ** n}x^{${a * n - b}}` },
    sol: [`La potencia afecta al coeficiente y a la variable: ${m(`${k}^{${n}} = ${k ** n}`)} y ${m(`x^{${a} \\times ${n}} = x^{${a * n}}`)}.`, `Producto de misma base: ${m(`${a * n} + (-${b}) = ${a * n - b}`)}.`],
  };
}

function raices(nv) {
  if (nv === 1) {
    if (rnd() < 0.7) {
      const [ind, b] = elegir([[2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 11], [2, 12], [2, 13], [2, 15], [3, 2], [3, 3], [3, 4], [3, 5], [3, -2], [3, -3]]);
      const rad = b ** ind;
      const tex = ind === 2 ? `\\sqrt{${rad}}` : `\\sqrt[3]{${rad}}`;
      return {
        q: `Calcula ${m(tex)}.`, campos: [campo(b, m('='))], r: m(`${b}`), prueba: { tipo: 'potencia', base: b, exp: ind, valor: rad },
        sol: [`Busca el número que elevado a la ${ind} da ${rad}: ${m(`${par(b)}^{${ind}} = ${rad}`)}.`, ...(b < 0 ? ['Una raíz cúbica sí puede ser negativa.'] : [])],
      };
    }
    const p = ent(2, 9), q = ent(p + 1, 12);
    const r = F(p, q);
    if (r.d !== q) return raices(nv);
    return {
      q: `Calcula ${m(`\\sqrt{\\frac{${p * p}}{${q * q}}}`)}.`, campos: [campo(r, m('='))], r: m(tf(r)), prueba: { tipo: 'valor', tex: `\\sqrt{\\frac{${p * p}}{${q * q}}}`, valor: r },
      sol: [`La raíz de un cociente es el cociente de las raíces: ${m(`\\frac{\\sqrt{${p * p}}}{\\sqrt{${q * q}}} = \\frac{${p}}{${q}}`)}.`],
    };
  }
  if (nv === 2) {
    const a = ent(2, 9), b = elegir([2, 3, 5, 6, 7, 10]);
    const rad = a * a * b;
    return {
      q: `Simplifica ${m(`\\sqrt{${rad}}`)} sacando del radical todo lo posible.`, campos: [campo(a, 'Fuera'), campo(b, 'Dentro del radical')], r: m(`${a}\\sqrt{${b}}`),
      prueba: { tipo: 'valor', tex: `\\sqrt{${rad}}`, aprox: a * Math.sqrt(b) },
      sol: [`Busca el mayor cuadrado perfecto que divide a ${rad}: ${m(`${rad} = ${a * a} \\times ${b}`)}.`, `${m(`\\sqrt{${a * a} \\times ${b}} = \\sqrt{${a * a}}\\,\\sqrt{${b}} = ${a}\\sqrt{${b}}`)}.`],
    };
  }
  if (rnd() < 0.55) {
    const [b, n, d, neg] = elegir([[8, 2, 3], [27, 2, 3], [16, 3, 4], [32, 2, 5], [4, 3, 2], [9, 3, 2], [125, 2, 3], [81, 3, 4], [8, 1, 3, 1], [27, 2, 3, 1], [4, 1, 2, 1], [16, 3, 4, 1], [25, 3, 2], [64, 2, 3]]);
    const raiz = Math.round(b ** (1 / d));
    const v = neg ? F(1, raiz ** n) : F(raiz ** n);
    const tex = `${b}^{${neg ? '-' : ''}${n}/${d}}`;
    return {
      q: `Calcula ${m(tex)}.`, campos: [campo(v, m('='))], r: m(tf(v)), prueba: { tipo: 'valor', tex, aprox: fnum(v) },
      sol: [`El denominador del exponente es el índice de la raíz: ${m(`\\sqrt[${d}]{${b}} = ${raiz}`)}.`, `El numerador es la potencia: ${m(`${raiz}^{${n}} = ${raiz ** n}`)}.`, ...(neg ? [`El signo negativo invierte: ${m(tf(v))}.`] : [])],
    };
  }
  const b = elegir([2, 3, 5]), [p, q] = distintos(() => ent(2, 6), 2);
  const resta = rnd() < 0.4 && p > q;
  const tex = `\\sqrt{${p * p * b}} ${resta ? '-' : '+'} \\sqrt{${q * q * b}}`;
  const c = resta ? p - q : p + q;
  return {
    q: `Simplifica ${m(tex)} hasta la forma ${m('c\\sqrt{n}')}.`, campos: [campo(c, 'Fuera'), campo(b, 'Dentro del radical')], r: m(`${c}\\sqrt{${b}}`),
    prueba: { tipo: 'valor', tex, aprox: c * Math.sqrt(b) },
    sol: [`Simplifica cada raíz: ${m(`\\sqrt{${p * p * b}} = ${p}\\sqrt{${b}}`)} y ${m(`\\sqrt{${q * q * b}} = ${q}\\sqrt{${b}}`)}.`, `Son radicales semejantes: ${m(`${p}\\sqrt{${b}} ${resta ? '-' : '+'} ${q}\\sqrt{${b}} = ${c}\\sqrt{${b}}`)}.`],
  };
}

function cientifica(nv) {
  // Mantisa M / 10^k entre 1 y 10, sin ceros de relleno al final
  const k = ent(0, 2);
  let M;
  do M = k === 0 ? ent(1, 9) : k === 1 ? ent(11, 99) : ent(101, 999); while (k > 0 && M % 10 === 0);
  if (nv < 3) {
    const e = elegir([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]);
    // número = M × 10^(e - k)
    const plano = e - k >= 0 ? `${M}${'0'.repeat(e - k)}` : dec(M, k - e);
    const numero = miles(plano);
    const valor = e - k >= 0 ? F(M * 10 ** (e - k)) : F(M, 10 ** (k - e));
    const cient = `${dec(M, k)} \\times 10^{${e}}`;
    const prueba = { tipo: 'cientifica', mantisa: Fdec(M, k), exp: e, numero: plano, valor };
    if (nv === 1) {
      return {
        q: `Escribe ${m(numero)} en notación científica.`, campos: [campo(Fdec(M, k), 'Mantisa', m('\\times\\,10^{n}')), campo(e, m('n ='))], r: m(cient), prueba,
        sol: [`Deja un solo dígito distinto de cero antes del punto: ${m(dec(M, k))}.`, `El punto se movió ${Math.abs(e)} ${Math.abs(e) === 1 ? 'lugar' : 'lugares'} hacia la ${e > 0 ? 'izquierda: exponente positivo' : 'derecha: exponente negativo'}.`],
      };
    }
    return {
      q: `Escribe ${m(cient)} como número decimal.`, campos: [campo(valor, m('='))], r: m(numero), prueba,
      sol: [`Exponente ${e > 0 ? 'positivo: el punto se corre a la derecha' : 'negativo: el punto se corre a la izquierda'} ${Math.abs(e)} ${Math.abs(e) === 1 ? 'lugar' : 'lugares'}, rellenando con ceros.`, `Resultado: ${m(numero)}.`],
    };
  }
  const ea = noCero(-6, 6), eb = noCero(-6, 6);
  if (rnd() < 0.6) {
    const a = ent(2, 9), b = ent(2, 9);
    const p = a * b, ajuste = p >= 10 ? 1 : 0;
    const tex = `(${a} \\times 10^{${ea}})(${b} \\times 10^{${eb}})`;
    return {
      q: `Multiplica ${m(tex)} y deja el resultado en notación científica.`, campos: [campo(Fdec(p, ajuste), 'Mantisa', m('\\times\\,10^{n}')), campo(ea + eb + ajuste, m('n ='))], r: m(`${dec(p, ajuste)} \\times 10^{${ea + eb + ajuste}}`),
      prueba: { tipo: 'cientifica', mantisa: Fdec(p, ajuste), exp: ea + eb + ajuste, tex },
      sol: [`Multiplica las mantisas y suma los exponentes: ${m(`${p} \\times 10^{${ea + eb}}`)}.`, ajuste ? `La mantisa debe quedar entre 1 y 10: ${m(`${p} = ${dec(p, 1)} \\times 10^{1}`)}, así que el exponente sube a ${ea + eb + 1}.` : 'La mantisa ya está entre 1 y 10.'],
    };
  }
  const [a, b] = elegir([[8, 2], [9, 3], [6, 4], [9, 2], [3, 4], [2, 8], [1, 4], [3, 5], [2, 5], [1, 2], [7, 2], [5, 4], [9, 4], [6, 5]]);
  const coc = F(a, b), menor = a < b;
  const mantisa = menor ? F(a * 10, b) : coc;
  const exp = ea - eb - (menor ? 1 : 0);
  const tex = `\\frac{${a} \\times 10^{${ea}}}{${b} \\times 10^{${eb}}}`;
  return {
    q: `Divide ${m(tex)} y deja el resultado en notación científica.`, campos: [campo(mantisa, 'Mantisa', m('\\times\\,10^{n}')), campo(exp, m('n ='))], r: m(`${decF(mantisa)} \\times 10^{${exp}}`),
    prueba: { tipo: 'cientifica', mantisa, exp, tex },
    sol: [`Divide las mantisas y resta los exponentes: ${m(`${decF(coc)} \\times 10^{${ea - eb}}`)}.`, menor ? `La mantisa quedó menor que 1: ${m(`${decF(coc)} = ${decF(mantisa)} \\times 10^{-1}`)}, así que el exponente baja a ${exp}.` : 'La mantisa ya está entre 1 y 10.'],
  };
}

function porcentajes(nv) {
  const Q = (n) => `Q${miles(n)}`;
  if (nv === 1) {
    const p = elegir([5, 10, 12, 15, 20, 25, 30, 40, 50, 75]);
    const N = elegir([40, 60, 80, 120, 150, 200, 240, 300, 400, 500, 800, 1200, 2500]);
    const r = F(p * N, 100);
    return {
      q: `¿Cuánto es el ${p} % de ${Q(N)}?`, campos: [campo(r, 'Q')], r: `Q${fnum(r)}`, prueba: { tipo: 'numero', valor: (p / 100) * N, dado: fnum(r) },
      sol: [`Un porcentaje es una fracción de 100: ${m(`\\frac{${p}}{100} \\times ${N}`)}.`, p === 10 || p === 5 || p === 20 ? `Atajo: el 10 % es ${N / 10}; de ahí sale el ${p} %: ${fnum(r)}.` : `${m(`${p} \\times ${N} = ${miles(p * N)}`)}; entre 100 da ${fnum(r)}.`],
    };
  }
  if (nv === 2) {
    const tipo = elegir(['que', 'iva', 'descuento']);
    if (tipo === 'que') {
      const p = elegir([4, 5, 8, 10, 12, 15, 20, 25, 30, 40, 60, 75]), b = elegir([50, 80, 120, 200, 250, 400, 500]);
      const a = (p * b) / 100;
      if (!Number.isInteger(a)) return porcentajes(nv);
      return {
        q: `¿Qué porcentaje es ${a} de ${b}?`, campos: [campo(p, '', '%')], r: `${p} %`, prueba: { tipo: 'numero', valor: (a / b) * 100, dado: p },
        sol: [`Parte entre total: ${m(`\\frac{${a}}{${b}} = ${tf(F(a, b))}`)}.`, `Por 100: ${m(`${tf(F(a, b))} \\times 100 = ${p}`)} %.`],
      };
    }
    if (tipo === 'iva') {
      const precio = elegir([50, 75, 100, 125, 150, 200, 250, 300, 450, 500, 800, 1250, 2000]);
      const total = F(precio * 112, 100);
      return {
        q: `Un producto cuesta ${Q(precio)} sin IVA. ¿Cuánto cuesta con el IVA de 12 %?`, campos: [campo(total, 'Q')], r: `Q${fnum(total)}`, prueba: { tipo: 'numero', valor: precio * 1.12, dado: fnum(total) },
        sol: [`IVA: 12 % de ${precio} es ${m(`0.12 \\times ${precio} = ${fnum(F(precio * 12, 100))}`)}.`, `Total: ${m(`${precio} + ${fnum(F(precio * 12, 100))} = ${fnum(total)}`)}. De una vez: ${m(`${precio} \\times 1.12`)}.`],
      };
    }
    const precio = elegir([80, 120, 150, 200, 240, 300, 400, 500, 650, 900]), p = elegir([10, 15, 20, 25, 30, 40]);
    const fin = F(precio * (100 - p), 100);
    return {
      q: `Una camisa de ${Q(precio)} tiene ${p} % de descuento. ¿Cuánto se paga?`, campos: [campo(fin, 'Q')], r: `Q${fnum(fin)}`, prueba: { tipo: 'numero', valor: precio * (1 - p / 100), dado: fnum(fin) },
      sol: [`Descuento: ${m(`${p}\\,\\% \\text{ de } ${precio} = ${fnum(F(precio * p, 100))}`)}.`, `Se paga ${m(`${precio} - ${fnum(F(precio * p, 100))} = ${fnum(fin)}`)}, que es el ${100 - p} % del precio.`],
    };
  }
  const tipo = elegir(['sinIva', 'cambio', 'sucesivos']);
  if (tipo === 'sinIva') {
    const base = elegir([50, 75, 100, 125, 150, 200, 250, 500, 750, 1000, 1500]);
    const total = F(base * 112, 100);
    return {
      q: `Una factura es de Q${fnum(total)} con el IVA de 12 % incluido. ¿Cuánto es el precio sin IVA?`, campos: [campo(base, 'Q')], r: Q(base), prueba: { tipo: 'numero', valor: fnum(total) / 1.12, dado: base },
      sol: ['El total es el 112 % del precio sin IVA, no se le resta el 12 %.', `Divide entre 1.12: ${m(`${fnum(total)} \\div 1.12 = ${base}`)}.`],
    };
  }
  if (tipo === 'cambio') {
    const a = elegir([40, 50, 80, 120, 200, 250, 400]), p = elegir([-40, -25, -20, -10, 10, 15, 20, 25, 50, 75]);
    const b = (a * (100 + p)) / 100;
    if (!Number.isInteger(b)) return porcentajes(nv);
    return {
      q: `Un precio pasa de ${Q(a)} a ${Q(b)}. ¿De qué porcentaje fue el cambio? Escribe el número con signo: positivo si subió, negativo si bajó.`, campos: [campo(p, '', '%')], r: `${p} %`,
      prueba: { tipo: 'numero', valor: ((b - a) / a) * 100, dado: p },
      sol: [`Cambio entre valor inicial: ${m(`\\frac{${b} - ${a}}{${a}} = \\frac{${b - a}}{${a}}`)}.`, `Por 100: ${p} %. El divisor es siempre el valor inicial.`],
    };
  }
  const p = elegir([10, 20, 25, 50]);
  const neto = F(-p * p, 100);
  return {
    q: `Un precio sube ${p} % y después baja ${p} %. ¿Cuál es el cambio neto respecto al precio original? Escribe el porcentaje con signo.`, campos: [campo(neto, '', '%')], r: `${fnum(neto)} %`,
    prueba: { tipo: 'numero', valor: ((1 + p / 100) * (1 - p / 100) - 1) * 100, dado: fnum(neto) },
    sol: [`Los factores se multiplican, no se suman: ${m(`${1 + p / 100} \\times ${1 - p / 100} = ${fnum(F((100 + p) * (100 - p), 10000))}`)}.`, `Queda el ${fnum(F((100 + p) * (100 - p), 100))} % del original: cambio de ${fnum(neto)} %. La baja se calcula sobre un precio mayor.`],
  };
}

function notables(nv) {
  if (nv === 1) {
    const a = noCero(-9, 9);
    const izq = `${bin(1, a)}^{2}`;
    return {
      q: `Desarrolla ${m(izq)}.`, campos: [campo(2 * a, m('x^{2} +'), m('x')), campo(a * a, m('+'))], r: m(poli([1, 2 * a, a * a])),
      prueba: { tipo: 'identidad', izq, der: poli([1, 2 * a, a * a]) },
      sol: [`Cuadrado de un binomio: ${m('(p + q)^{2} = p^{2} + 2pq + q^{2}')}, con ${m(`p = x`)} y ${m(`q = ${a}`)}.`, `${m(`2pq = 2(x)${pp(a)} = ${2 * a}x`)} y ${m(`q^{2} = ${a * a}`)}. El último término siempre es positivo.`],
    };
  }
  if (nv === 2) {
    const a = ent(2, 6), b = noCero(-7, 7);
    if (rnd() < 0.5) {
      const izq = `${bin(a, b)}^{2}`;
      return {
        q: `Desarrolla ${m(izq)}.`, campos: [campo(a * a, '', m('x^{2}')), campo(2 * a * b, m('+'), m('x')), campo(b * b, m('+'))], r: m(poli([a * a, 2 * a * b, b * b])),
        prueba: { tipo: 'identidad', izq, der: poli([a * a, 2 * a * b, b * b]) },
        sol: [`${m('(p + q)^{2} = p^{2} + 2pq + q^{2}')} con ${m(`p = ${a}x`)} y ${m(`q = ${b}`)}.`, `${m(`p^{2} = ${a * a}x^{2}`)}, ${m(`2pq = ${2 * a * b}x`)}, ${m(`q^{2} = ${b * b}`)}.`],
      };
    }
    const c = Math.abs(b);
    const izq = `${bin(a, c)}${bin(a, -c)}`;
    return {
      q: `Desarrolla ${m(izq)}.`, campos: [campo(a * a, '', m('x^{2}')), campo(-c * c, m('+'))], r: m(poli([a * a, 0, -c * c])),
      prueba: { tipo: 'identidad', izq, der: poli([a * a, 0, -c * c]) },
      sol: [`Binomios conjugados: ${m('(p + q)(p - q) = p^{2} - q^{2}')}.`, `${m(`(${a}x)^{2} - ${c}^{2} = ${a * a}x^{2} - ${c * c}`)}. Los términos del medio se cancelan.`],
    };
  }
  const tipo = elegir(['dos', 'general', 'cubo']);
  if (tipo === 'dos') {
    const a = noCero(-9, 9), b = noCero(-9, 9);
    const izq = `${bin(1, a)}${bin(1, b)}`;
    return {
      q: `Desarrolla ${m(izq)}.`, campos: [campo(a + b, m('x^{2} +'), m('x')), campo(a * b, m('+'))], r: m(poli([1, a + b, a * b])),
      prueba: { tipo: 'identidad', izq, der: poli([1, a + b, a * b]) },
      sol: [`Binomios con término común: ${m('(x + p)(x + q) = x^{2} + (p + q)x + pq')}.`, `Suma: ${m(`${a} + ${par(b)} = ${a + b}`)}. Producto: ${m(`${pp(a)}${pp(b)} = ${a * b}`)}.`],
    };
  }
  if (tipo === 'general') {
    const a = ent(2, 5), b = noCero(-6, 6), c = ent(1, 4), d = noCero(-6, 6);
    const izq = `${bin(a, b)}${bin(c, d)}`;
    return {
      q: `Desarrolla ${m(izq)}.`, campos: [campo(a * c, '', m('x^{2}')), campo(a * d + b * c, m('+'), m('x')), campo(b * d, m('+'))], r: m(poli([a * c, a * d + b * c, b * d])),
      prueba: { tipo: 'identidad', izq, der: poli([a * c, a * d + b * c, b * d]) },
      sol: [`Cada término del primero por cada término del segundo: ${m(poli([a * c, 0, 0]))}, ${m(poli([a * d, 0]))}, ${m(poli([b * c, 0]))} y ${m(`${b * d}`)}.`, `Junta los términos en ${m('x')}: ${m(`${a * d} + ${par(b * c)} = ${a * d + b * c}`)}.`],
    };
  }
  const a = noCero(-4, 4);
  const izq = `${bin(1, a)}^{3}`;
  return {
    q: `Desarrolla ${m(izq)}.`, campos: [campo(3 * a, m('x^{3} +'), m('x^{2}')), campo(3 * a * a, m('+'), m('x')), campo(a ** 3, m('+'))], r: m(poli([1, 3 * a, 3 * a * a, a ** 3])),
    prueba: { tipo: 'identidad', izq, der: poli([1, 3 * a, 3 * a * a, a ** 3]) },
    sol: [`Cubo de un binomio: ${m('(p + q)^{3} = p^{3} + 3p^{2}q + 3pq^{2} + q^{3}')} con ${m(`q = ${a}`)}.`, `${m(`3q = ${3 * a}`)}, ${m(`3q^{2} = ${3 * a * a}`)} y ${m(`q^{3} = ${a ** 3}`)}.`],
  };
}

function factorizacion(nv) {
  if (nv === 1) {
    if (rnd() < 0.5) {
      const k = ent(2, 9);
      let a, b;
      do { a = ent(1, 7); b = noCero(-9, 9); } while (mcd(a, b) !== 1);
      const izq = poli([k * a, k * b, 0]);
      return {
        q: `Saca el factor común de ${m(izq)}.`, campos: [campo(k, '', m('x\\,\\big(')), campo(a, '', m('x')), campo(b, m('+'), m('\\big)'))], r: m(`${k}x${bin(a, b)}`),
        prueba: { tipo: 'identidad', izq, der: `${k}x${bin(a, b)}` },
        sol: [`Máximo común divisor de los coeficientes: ${m(`\\text{mcd}(${k * a}, ${Math.abs(k * b)}) = ${k}`)}; la menor potencia de ${m('x')} es ${m('x')}.`, `Divide cada término entre ${m(`${k}x`)}: ${m(`${k}x${bin(a, b)}`)}.`],
      };
    }
    const a = ent(2, 12);
    const izq = `x^{2} - ${a * a}`;
    return {
      q: `Factoriza ${m(izq)} como ${m('(x - a)(x + a)')} con ${m('a > 0')}. Escribe ${m('a')}.`, campos: [campo(a, m('a ='))], r: m(`${bin(1, -a)}${bin(1, a)}`),
      prueba: { tipo: 'identidad', izq, der: `${bin(1, -a)}${bin(1, a)}` },
      sol: [`Diferencia de cuadrados: ${m('p^{2} - q^{2} = (p - q)(p + q)')}.`, `${m(`${a * a} = ${a}^{2}`)}, así que queda ${m(`${bin(1, -a)}${bin(1, a)}`)}.`],
    };
  }
  if (nv === 2) {
    let p, q;
    do { p = noCero(-9, 9); q = noCero(-9, 9); } while (p + q === 0);
    const izq = poli([1, p + q, p * q]);
    return {
      q: `Factoriza ${m(izq)} como ${m('(x + p)(x + q)')}. Escribe ${m('p')} y ${m('q')} con su signo, en cualquier orden.`,
      campos: [campo(p, m('p =')), campo(q, m('q ='))], orden: false, r: m(`${bin(1, p)}${bin(1, q)}`),
      prueba: { tipo: 'identidad', izq, der: `${bin(1, p)}${bin(1, q)}` },
      sol: [`Busca dos números que multiplicados den ${p * q} y sumados den ${p + q}.`, `Son ${p} y ${q}: ${m(`${pp(p)}${pp(q)} = ${p * q}`)} y ${m(`${p} + ${par(q)} = ${p + q}`)}.`],
    };
  }
  if (rnd() < 0.45) {
    const a = ent(2, 5), b = noCero(-6, 6);
    const izq = poli([a * a, 2 * a * b, b * b]);
    return {
      q: `Factoriza el trinomio cuadrado perfecto ${m(izq)} como ${m('(ax + b)^{2}')} con ${m('a > 0')}.`, campos: [campo(a, m('a =')), campo(b, m('b ='))], r: m(`${bin(a, b)}^{2}`),
      prueba: { tipo: 'identidad', izq, der: `${bin(a, b)}^{2}` },
      sol: [`Raíces de los extremos: ${m(`\\sqrt{${a * a}x^{2}} = ${a}x`)} y ${m(`\\sqrt{${b * b}} = ${Math.abs(b)}`)}.`, `Comprueba el término medio: ${m(`2(${a}x)(${Math.abs(b)}) = ${2 * a * Math.abs(b)}x`)}; su signo es el de ${m('b')}.`],
    };
  }
  const [mm, n] = elegir([[1, 2], [1, 3], [2, 3], [1, 5], [2, 5], [3, 4]]);
  let p, q;
  do { p = noCero(-5, 5); q = noCero(-5, 5); } while (mcd(mm, p) !== 1 || mcd(n, q) !== 1);
  const izq = poli([mm * n, mm * q + n * p, p * q]);
  return {
    q: `Completa la factorización: ${m(`${izq} = (${mm === 1 ? '' : mm}x + p)(${n}x + q)`)}.`, campos: [campo(p, m('p =')), campo(q, m('q ='))], r: m(`${bin(mm, p)}${bin(n, q)}`),
    prueba: { tipo: 'identidad', izq, der: `${bin(mm, p)}${bin(n, q)}` },
    sol: [`${m(`pq = ${p * q}`)} y el término medio sale de los productos cruzados: ${m(`${mm}q + ${n}p = ${mm * q + n * p}`)}.`, `Probando los divisores de ${p * q}: ${m(`p = ${p}`)}, ${m(`q = ${q}`)}.`],
  };
}

function racionales(nv) {
  if (nv === 1) {
    let p, q;
    do { p = noCero(-8, 8); q = noCero(-8, 8); } while (p === q);
    const num = poli([1, p + q, p * q]);
    const izq = `\\frac{${num}}{${poli([1, p])}}`;
    return {
      q: `Simplifica ${m(izq)}.`, campos: [campo(q, m('x +'))], r: m(poli([1, q])), prueba: { tipo: 'identidad', izq, der: poli([1, q]), evitar: [-p] },
      sol: [`Factoriza el numerador: ${m(`${num} = ${bin(1, p)}${bin(1, q)}`)}.`, `Cancela el factor común ${m(bin(1, p))} (para ${m(`x \\neq ${-p}`)}): queda ${m(poli([1, q]))}.`],
    };
  }
  if (nv === 2) {
    const a = ent(1, 8);
    let b;
    do b = noCero(-8, 8); while (b === a || b === -a);
    const izq = `\\frac{x^{2} - ${a * a}}{${poli([1, a + b, a * b])}}`;
    return {
      q: `Simplifica ${m(izq)} hasta la forma ${m('\\dfrac{x + p}{x + q}')}. Escribe ${m('p')} y ${m('q')} con su signo.`, campos: [campo(-a, m('p =')), campo(b, m('q ='))], r: m(`\\frac{${poli([1, -a])}}{${poli([1, b])}}`),
      prueba: { tipo: 'identidad', izq, der: `\\frac{${poli([1, -a])}}{${poli([1, b])}}`, evitar: [-a, -b] },
      sol: [`Numerador, diferencia de cuadrados: ${m(`${bin(1, -a)}${bin(1, a)}`)}. Denominador: ${m(`${bin(1, a)}${bin(1, b)}`)}.`, `Cancela ${m(bin(1, a))}: queda ${m(`\\frac{${poli([1, -a])}}{${poli([1, b])}}`)}.`],
    };
  }
  const p = ent(1, 5), q = noCero(-5, 5);
  let a, b;
  do { a = noCero(-6, 6); b = noCero(-6, 6); } while (a === b);
  const izq = `\\frac{${p}}{${poli([1, a])}} ${q < 0 ? '-' : '+'} \\frac{${Math.abs(q)}}{${poli([1, b])}}`;
  const n1 = p + q, n0 = p * b + q * a;
  if (n1 === 0 && n0 === 0) return racionales(nv);
  return {
    q: `Suma y deja una sola fracción: ${m(izq)}. Escribe el numerador ${m('Ax + B')}; el denominador es ${m(`${bin(1, a)}${bin(1, b)}`)}.`,
    campos: [campo(n1, m('A =')), campo(n0, m('B ='))], r: m(`\\frac{${poli([n1, n0])}}{${bin(1, a)}${bin(1, b)}}`),
    prueba: { tipo: 'identidad', izq, der: `\\frac{${poli([n1, n0])}}{${bin(1, a)}${bin(1, b)}}`, evitar: [-a, -b] },
    sol: [`Denominador común: ${m(`${bin(1, a)}${bin(1, b)}`)}. Cada numerador se multiplica por el factor que le falta.`, `${m(`${p}${bin(1, b)} ${q < 0 ? '-' : '+'} ${Math.abs(q)}${bin(1, a)} = ${poli([n1, n0])}`)}.`],
  };
}

const DESPEJES = [
  { nv: 1, f: 'V = I R', v: 'R', ok: 'R = \\frac{V}{I}', mal: ['R = V I', 'R = \\frac{I}{V}', 'R = V - I'], sol: 'I multiplica a R: pasa dividiendo.' },
  { nv: 1, f: 'F = m a', v: 'a', ok: 'a = \\frac{F}{m}', mal: ['a = F m', 'a = \\frac{m}{F}', 'a = F - m'], sol: 'm multiplica a la aceleración: pasa dividiendo.' },
  { nv: 1, f: 'y = m x + b', v: 'x', ok: 'x = \\frac{y - b}{m}', mal: ['x = \\frac{y + b}{m}', 'x = \\frac{y}{m} - b', 'x = m(y - b)'], sol: 'Primero se resta b en ambos lados y después se divide todo entre m.' },
  { nv: 1, f: 'A = \\frac{b h}{2}', v: 'h', ok: 'h = \\frac{2A}{b}', mal: ['h = \\frac{A}{2b}', 'h = \\frac{A b}{2}', 'h = \\frac{2b}{A}'], sol: 'El 2 que divide pasa multiplicando y la b que multiplica pasa dividiendo.' },
  { nv: 1, f: 'I = P r t', v: 'r', ok: 'r = \\frac{I}{P t}', mal: ['r = I P t', 'r = \\frac{P t}{I}', 'r = I - P t'], sol: 'P y t multiplican a r: pasan dividiendo juntos.' },
  { nv: 2, f: 'v = v_0 + a t', v: 't', ok: 't = \\frac{v - v_0}{a}', mal: ['t = \\frac{v + v_0}{a}', 't = \\frac{v}{a} - v_0', 't = a(v - v_0)'], sol: 'Se resta la velocidad inicial y después se divide entre a.' },
  { nv: 2, f: 'P V = n R T', v: 'T', ok: 'T = \\frac{P V}{n R}', mal: ['T = \\frac{n R}{P V}', 'T = P V n R', 'T = P V - n R'], sol: 'n y R multiplican a T: pasan dividiendo.' },
  { nv: 2, f: 'C = \\frac{5}{9}(F - 32)', v: 'F', ok: 'F = \\frac{9}{5}C + 32', mal: ['F = \\frac{5}{9}C + 32', 'F = \\frac{9}{5}(C + 32)', 'F = \\frac{9}{5}C - 32'], sol: 'Se multiplica por el recíproco 9/5 y al final se suma 32.' },
  { nv: 2, f: 'P = \\frac{V^2}{R}', v: 'V', ok: 'V = \\sqrt{P R}', mal: ['V = P R', 'V = \\sqrt{\\frac{P}{R}}', 'V = \\frac{P}{R}'], sol: 'R pasa multiplicando y el cuadrado se deshace con raíz.' },
  { nv: 2, f: 'z = \\frac{x - \\mu}{\\sigma}', v: 'x', ok: 'x = \\mu + z\\sigma', mal: ['x = \\mu - z\\sigma', 'x = z\\sigma - \\mu', 'x = (z + \\mu)\\sigma'], sol: 'Sigma pasa multiplicando a z y la media pasa sumando.' },
  { nv: 3, f: 'A = \\pi r^2', v: 'r', ok: 'r = \\sqrt{\\frac{A}{\\pi}}', mal: ['r = \\frac{A}{2\\pi}', 'r = \\frac{\\sqrt{A}}{\\pi}', 'r = \\left(\\frac{A}{\\pi}\\right)^2'], sol: 'Pi pasa dividiendo y el cuadrado se deshace con raíz de todo el cociente.' },
  { nv: 3, f: 'E = \\frac{1}{2} m v^2', v: 'v', ok: 'v = \\sqrt{\\frac{2E}{m}}', mal: ['v = \\sqrt{\\frac{E}{2m}}', 'v = \\frac{2E}{m}', 'v = \\sqrt{2 E m}'], sol: 'El 2 pasa multiplicando, m dividiendo y al final se saca raíz.' },
  { nv: 3, f: '\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}', v: 'R', ok: 'R = \\frac{R_1 R_2}{R_1 + R_2}', mal: ['R = R_1 + R_2', 'R = \\frac{R_1 + R_2}{R_1 R_2}', 'R = \\frac{R_1 R_2}{R_1 - R_2}'], sol: 'Se suman las fracciones del lado derecho y después se invierten ambos lados.' },
  { nv: 3, f: 'd = v_0 t + \\frac{1}{2} a t^2', v: 'a', ok: 'a = \\frac{2(d - v_0 t)}{t^2}', mal: ['a = \\frac{d - v_0 t}{2 t^2}', 'a = \\frac{2d}{t^2} - v_0', 'a = \\frac{2(d + v_0 t)}{t^2}'], sol: 'Se resta el primer término, se multiplica por 2 y se divide entre t al cuadrado.' },
  { nv: 3, f: 'S = \\frac{a}{1 - r}', v: 'r', ok: 'r = \\frac{S - a}{S}', mal: ['r = \\frac{a - S}{S}', 'r = 1 - \\frac{S}{a}', 'r = \\frac{S}{1 - a}'], sol: 'Se pasa (1 − r) multiplicando: S − Sr = a; de ahí Sr = S − a.' },
  { nv: 3, f: 'T = 2\\pi\\sqrt{\\frac{L}{g}}', v: 'L', ok: 'L = \\frac{g T^2}{4\\pi^2}', mal: ['L = \\frac{g T}{2\\pi}', 'L = \\frac{4\\pi^2 g}{T^2}', 'L = \\frac{g T^2}{2\\pi}'], sol: 'Se divide entre 2π, se eleva al cuadrado todo y g pasa multiplicando.' },
];

function despejes(nv) {
  const d = elegir(DESPEJES.filter((x) => x.nv === nv));
  const ok = ent(0, 3);
  const ops = [...d.mal];
  ops.splice(ok, 0, d.ok);
  return {
    q: `Despeja ${m(d.v)} de ${m(d.f)}.`, ops: ops.map(m), ok, r: m(d.ok), sol: [d.sol, `Resultado: ${m(d.ok)}.`],
    prueba: { tipo: 'despeje', f: d.f, v: d.v, ok: d.ok, mal: d.mal },
  };
}

function lineales(nv) {
  if (nv === 1) {
    const a = noCero(-9, 9), x = ent(-9, 9), b = noCero(-12, 12);
    const ec = `${poli([a, b])} = ${a * x + b}`;
    return {
      q: `Resuelve ${m(ec)}.`, campos: [campo(x, m('x ='))], r: m(`x = ${x}`), prueba: { tipo: 'ecuacion', ecs: [ec], vars: [{ x: F(x) }] },
      sol: [`Pasa ${b} al otro lado con signo contrario: ${m(`${a === 1 ? '' : a === -1 ? '-' : a}x = ${a * x + b} - ${par(b)} = ${a * x}`)}.`, `Divide entre ${a}: ${m(`x = ${x}`)}.`],
    };
  }
  if (nv === 2) {
    let a, c;
    do { a = noCero(-9, 9); c = noCero(-9, 9); } while (a === c);
    const b = ent(-12, 12), d = ent(-12, 12);
    if (b === d) return lineales(nv);
    const x = F(d - b, a - c);
    const ec = `${poli([a, b])} = ${poli([c, d])}`;
    return {
      q: `Resuelve ${m(ec)}. Si no es entero, déjalo como fracción.`, campos: [campo(x, m('x ='))], r: m(`x = ${tf(x)}`), prueba: { tipo: 'ecuacion', ecs: [ec], vars: [{ x }] },
      sol: [`Las ${m('x')} a un lado y los números al otro: ${m(`${a}x - ${par(c)}x = ${d} - ${par(b)}`)}.`, `${m(`${a - c}x = ${d - b}`)}, así que ${m(`x = ${tf(x)}`)}.`],
    };
  }
  if (rnd() < 0.5) {
    const a = ent(2, 6), b = noCero(-6, 6), c = ent(2, 6), d = noCero(-6, 6), e = ent(-15, 15);
    if (a === c) return lineales(nv);
    // a(x + b) - c(x + d) = e
    const x = F(e - a * b + c * d, a - c);
    const ec = `${a}${bin(1, b)} - ${c}${bin(1, d)} = ${e}`;
    return {
      q: `Resuelve ${m(ec)}. Si no es entero, déjalo como fracción.`, campos: [campo(x, m('x ='))], r: m(`x = ${tf(x)}`), prueba: { tipo: 'ecuacion', ecs: [ec], vars: [{ x }] },
      sol: [`Distribuye, cuidando que el signo menos afecta a los dos términos del segundo paréntesis: ${m(`${poli([a, a * b])} - ${c}x ${-c * d < 0 ? '-' : '+'} ${Math.abs(c * d)} = ${e}`)}.`, `Reduce: ${m(`${poli([a - c, a * b - c * d])} = ${e}`)}.`, `${m(`x = ${tf(x)}`)}.`],
    };
  }
  const [a, b] = elegir([[2, 3], [3, 4], [2, 5], [4, 6], [3, 6], [2, 4], [5, 10]]);
  const mc = (a * b) / mcd(a, b), k = ent(1, 5) * (rnd() < 0.3 ? -1 : 1);
  const c = k * (mc / a + mc / b);
  const x = F(k * mc);
  const ec = `\\frac{x}{${a}} + \\frac{x}{${b}} = ${c}`;
  return {
    q: `Resuelve ${m(ec)}.`, campos: [campo(x, m('x ='))], r: m(`x = ${x.n}`), prueba: { tipo: 'ecuacion', ecs: [ec], vars: [{ x }] },
    sol: [`Multiplica toda la ecuación por el mcm de los denominadores, ${mc}: ${m(`${mc / a}x + ${mc / b}x = ${c * mc}`)}.`, `${m(`${mc / a + mc / b}x = ${c * mc}`)}, así que ${m(`x = ${x.n}`)}.`],
  };
}

function cuadraticas(nv) {
  if (nv === 1) {
    if (rnd() < 0.25) {
      const k = ent(2, 12);
      const ec = `x^{2} = ${k * k}`;
      return {
        q: `Resuelve ${m(ec)}. Escribe las dos soluciones.`, campos: [campo(k, m('x_1 =')), campo(-k, m('x_2 ='))], orden: false, r: m(`x = \\pm ${k}`),
        prueba: { tipo: 'ecuacion', ecs: [ec], vars: [{ x: F(k) }, { x: F(-k) }] },
        sol: [`Raíz cuadrada en ambos lados, con los dos signos: ${m(`x = \\pm\\sqrt{${k * k}} = \\pm ${k}`)}.`],
      };
    }
    const [r1, r2] = distintos(() => noCero(-9, 9), 2);
    const ec = `${poli([1, -(r1 + r2), r1 * r2])} = 0`;
    return {
      q: `Resuelve por factorización ${m(ec)}. Escribe las dos soluciones.`, campos: [campo(r1, m('x_1 =')), campo(r2, m('x_2 ='))], orden: false, r: m(`x = ${r1},\\; x = ${r2}`),
      prueba: { tipo: 'ecuacion', ecs: [ec], vars: [{ x: F(r1) }, { x: F(r2) }] },
      sol: [`Factoriza: ${m(`${bin(1, -r1)}${bin(1, -r2)} = 0`)}.`, `Cada factor igual a cero: ${m(`x = ${r1}`)} y ${m(`x = ${r2}`)}. La solución lleva el signo contrario al del factor.`],
    };
  }
  if (nv === 2) {
    const [mm, n] = elegir([[1, 2], [2, 3], [1, 3], [2, 5], [1, 4], [3, 4]]);
    let p, q;
    do { p = noCero(-5, 5); q = noCero(-5, 5); } while (mcd(mm, p) !== 1 || mcd(n, q) !== 1 || p * n === q * mm);
    // (mm x - p)(n x - q) = 0
    const a = mm * n, b = -(mm * q + n * p), c = p * q;
    const disc = b * b - 4 * a * c, raiz = Math.round(Math.sqrt(disc));
    const ec = `${poli([a, b, c])} = 0`;
    const x1 = F(p, mm), x2 = F(q, n);
    return {
      q: `Resuelve con la fórmula general ${m(ec)}. Escribe las dos soluciones (fracción si no es entera).`, campos: [campo(x1, m('x_1 =')), campo(x2, m('x_2 ='))], orden: false, r: m(`x = ${tf(x1)},\\; x = ${tf(x2)}`),
      prueba: { tipo: 'ecuacion', ecs: [ec], vars: [{ x: x1 }, { x: x2 }] },
      sol: [`${m(`a = ${a},\\; b = ${b},\\; c = ${c}`)}. Discriminante: ${m(`b^{2} - 4ac = ${b * b} - ${par(4 * a * c)} = ${disc}`)}, y ${m(`\\sqrt{${disc}} = ${raiz}`)}.`, `${m(`x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a} = \\frac{${-b} \\pm ${raiz}}{${2 * a}}`)}.`, `Soluciones: ${m(tf(F(-b + raiz, 2 * a)))} y ${m(tf(F(-b - raiz, 2 * a)))}.`],
    };
  }
  if (rnd() < 0.5) {
    const a = ent(1, 4), b = ent(-8, 8), c = ent(-8, 8);
    const disc = b * b - 4 * a * c;
    const n = disc > 0 ? 2 : disc === 0 ? 1 : 0;
    const ec = `${poli([a, b, c])} = 0`;
    return {
      q: `Sin resolverla, calcula el discriminante de ${m(ec)} y di cuántas soluciones reales distintas tiene.`, campos: [campo(disc, 'Discriminante'), campo(n, 'Soluciones reales')], r: `discriminante ${m(`${disc}`)}: ${n === 2 ? 'dos soluciones reales' : n === 1 ? 'una solución real (doble)' : 'ninguna solución real'}`,
      prueba: { tipo: 'discriminante', a, b, c, disc, n },
      sol: [`${m(`b^{2} - 4ac = ${pp(b)}^{2} - 4${pp(a)}${pp(c)} = ${b * b} - ${par(4 * a * c)} = ${disc}`)}.`, disc > 0 ? 'Positivo: dos soluciones reales distintas.' : disc === 0 ? 'Cero: una sola solución real, repetida.' : 'Negativo: ninguna solución real (las raíces son complejas).'],
    };
  }
  const [r1, r2] = distintos(() => noCero(-8, 8), 2);
  const s = r1 + r2, pr = r1 * r2;
  if (s === 0) return cuadraticas(nv);
  // x(x - s) = -pr
  const ec = `x${bin(1, -s)} = ${-pr}`;
  return {
    q: `Resuelve ${m(ec)}. Escribe las dos soluciones.`, campos: [campo(r1, m('x_1 =')), campo(r2, m('x_2 ='))], orden: false, r: m(`x = ${r1},\\; x = ${r2}`),
    prueba: { tipo: 'ecuacion', ecs: [ec], vars: [{ x: F(r1) }, { x: F(r2) }] },
    sol: [`No se puede igualar cada factor a ${-pr}: primero se pasa todo a un lado. ${m(`${poli([1, -s, pr])} = 0`)}.`, `Factoriza: ${m(`${bin(1, -r1)}${bin(1, -r2)} = 0`)}, de donde ${m(`x = ${r1}`)} y ${m(`x = ${r2}`)}.`],
  };
}

function sistemas(nv) {
  let a1, b1, a2, b2, x, y;
  if (nv === 1) {
    x = F(ent(-9, 9)); y = F(ent(-9, 9));
    [a1, b1, a2, b2] = [1, 1, 1, -1];
  } else {
    do { a1 = noCero(-5, 5); b1 = noCero(-5, 5); a2 = noCero(-5, 5); b2 = noCero(-5, 5); } while (a1 * b2 - a2 * b1 === 0);
    const det = a1 * b2 - a2 * b1;
    if (nv === 2) { x = F(ent(-6, 6)); y = F(ent(-6, 6)); }
    else {
      x = F(noCero(-20, 20), det); y = F(noCero(-20, 20), det);
      if (x.d === 1 && y.d === 1) return sistemas(nv);
    }
  }
  const det = a1 * b2 - a2 * b1;
  const c1 = fsum(fmul(F(a1), x), fmul(F(b1), y)), c2 = fsum(fmul(F(a2), x), fmul(F(b2), y));
  if (c1.d !== 1 || c2.d !== 1) return sistemas(nv);
  const e1 = `${lin2(a1, b1)} = ${c1.n}`, e2 = `${lin2(a2, b2)} = ${c2.n}`;
  const Dx = c1.n * b2 - c2.n * b1;
  return {
    q: `Resuelve el sistema ${m(`\\begin{cases} ${e1} \\\\ ${e2} \\end{cases}`)}${nv === 3 ? ' Las soluciones pueden ser fracciones.' : ''}`,
    campos: [campo(x, m('x =')), campo(y, m('y ='))], r: m(`x = ${tf(x)},\\; y = ${tf(y)}`),
    prueba: { tipo: 'ecuacion', ecs: [e1, e2], vars: [{ x, y }] },
    sol: nv === 1
      ? [`Suma las dos ecuaciones para eliminar ${m('y')}: ${m(`2x = ${c1.n + c2.n}`)}, así que ${m(`x = ${tf(x)}`)}.`, `Sustituye en la primera: ${m(`y = ${c1.n} - ${par(x.n)} = ${tf(y)}`)}.`]
      : [`Para eliminar ${m('y')}, multiplica la primera ecuación por ${m(`${b2}`)} y la segunda por ${m(`${b1}`)}, y resta la segunda de la primera: ${m(`${det}x = ${Dx}`)}.`, `${m(`x = ${tf(x)}`)}. Sustituye ese valor en la primera ecuación y despeja: ${m(`y = ${tf(y)}`)}.`],
  };
}

function desigualdades(nv) {
  let a, b, c, d = 0, izq, der;
  if (nv === 1) { a = ent(2, 9); } else { a = -ent(2, 9); }
  if (nv === 3) {
    do { a = noCero(-7, 7); d = noCero(-7, 7); } while (a === d);
  }
  b = noCero(-12, 12);
  const simb = elegir(['<', '>', '\\le', '\\ge']);
  let k;
  do {
    k = nv === 3 ? F(noCero(-12, 12), elegir([1, 1, 2, 3])) : F(noCero(-9, 9));
    c = fsum(fmul(F(a - d), k), F(b)); // (a - d)k + b
  } while (c.d !== 1);
  izq = poli([a, b]); der = nv === 3 ? poli([d, c.n]) : `${c.n}`;
  const voltear = { '<': '>', '>': '<', '\\le': '\\ge', '\\ge': '\\le' };
  const coef = a - d;
  const final = coef < 0 ? voltear[simb] : simb;
  const op = (s, v) => `x ${s} ${tf(v)}`;
  const menosK = F(-k.n, k.d);
  const opciones = [op(final, k), op(voltear[final], k), op(final, menosK), op(voltear[final], menosK)];
  const ok = ent(0, 3);
  const ops = opciones.slice(1);
  ops.splice(ok, 0, opciones[0]);
  const tex = `${izq} ${simb} ${der}`;
  return {
    q: `Resuelve la desigualdad ${m(tex)}.`, ops: ops.map(m), ok, r: m(opciones[0]),
    prueba: { tipo: 'desigualdad', tex, simb, final, k },
    sol: [
      nv === 3 ? `Las ${m('x')} a la izquierda y los números a la derecha: ${m(`${coef === 1 ? '' : coef === -1 ? '-' : coef}x ${simb} ${c.n - b}`)}.` : `Pasa ${b} al otro lado: ${m(`${a}x ${simb} ${c.n - b}`)}.`,
      coef < 0 ? `Al dividir entre un número negativo (${coef}) el sentido de la desigualdad se invierte: ${m(opciones[0])}.` : `Divide entre ${coef} (positivo, el sentido se conserva): ${m(opciones[0])}.`,
    ],
  };
}

function ruffini(nv) {
  const r = noCero(-3, 3);
  const cs = nv === 1 ? [1, noCero(-7, 7), ent(-9, 9)] : nv === 2 ? [1, ent(-6, 6), ent(-8, 8), ent(-9, 9)] : [ent(2, 4), rnd() < 0.5 ? 0 : ent(-6, 6), ent(-8, 8), ent(-9, 9)];
  const fila = [cs[0]];
  for (let i = 1; i < cs.length; i++) fila.push(cs[i] + fila[i - 1] * r);
  const residuo = fila.at(-1), coc = fila.slice(0, -1);
  const divisor = poli([1, -r]);
  const izq = poli(cs);
  const g = coc.length - 1;
  const campos = coc.map((c, i) => {
    const grado = g - i;
    const letra = grado === 0 ? '' : grado === 1 ? m('x') : m(`x^{${grado}}`);
    return campo(c, i === 0 ? 'Cociente:' : m('+'), letra);
  });
  campos.push(campo(residuo, 'Residuo:'));
  const pasos = fila.slice(1).map((v, i) => `${m(`${fila[i]} \\times ${par(r)} + ${par(cs[i + 1])} = ${v}`)}`);
  return {
    q: `Divide con la regla de Ruffini ${m(`(${izq}) \\div (${divisor})`)}. Escribe los coeficientes del cociente (cero si falta un término) y el residuo.`,
    campos, r: `cociente ${m(poli(coc))}, residuo ${m(`${residuo}`)}`,
    prueba: { tipo: 'division-poli', dividendo: izq, divisor, cociente: poli(coc), residuo },
    sol: [`Coeficientes del dividendo${cs.includes(0) ? ' (con un cero donde falta un término)' : ''}: ${m(cs.join(',\\; '))}. Se usa ${m(`${r}`)}, la raíz del divisor.`, `Baja el primero (${m(`${cs[0]}`)}); después multiplica por ${m(`${r}`)} y suma con el siguiente: ${pasos.join('; ')}.`, `Los primeros números son el cociente y el último es el residuo: ${m(poli(coc))}, residuo ${m(`${residuo}`)}.`],
  };
}

function logaritmos(nv) {
  if (nv === 1) {
    const [b, k] = elegir([[2, 3], [2, 4], [2, 5], [2, 6], [3, 2], [3, 3], [3, 4], [5, 2], [5, 3], [10, 2], [10, 3], [10, 5], [4, 3], [7, 2], [6, 0], [9, 1], [2, 10]]);
    const tex = `\\log_{${b}} ${miles(b ** k)}`;
    return {
      q: `Calcula ${m(tex)}.`, campos: [campo(k, m('='))], r: m(`${k}`), prueba: { tipo: 'log', base: b, arg: b ** k, valor: F(k) },
      sol: [`El logaritmo es el exponente al que hay que elevar la base: ${m(`${b}^{?} = ${miles(b ** k)}`)}.`, `${m(`${b}^{${k}} = ${miles(b ** k)}`)}, así que vale ${k}.`],
    };
  }
  if (nv === 2) {
    const tipo = elegir(['inv', 'frac', 'exp']);
    if (tipo === 'inv') {
      const [b, k] = elegir([[2, 1], [2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [5, 2], [10, 2], [10, 3], [4, 2]]);
      const tex = `\\log_{${b}} \\frac{1}{${b ** k}}`;
      return {
        q: `Calcula ${m(tex)}.`, campos: [campo(-k, m('='))], r: m(`${-k}`), prueba: { tipo: 'log', base: b, arg: 1 / b ** k, valor: F(-k) },
        sol: [`${m(`\\frac{1}{${b ** k}} = ${b}^{-${k}}`)}: un recíproco es un exponente negativo.`, `El logaritmo es ese exponente: ${-k}.`],
      };
    }
    if (tipo === 'frac') {
      const [b, arg, n, d] = elegir([[4, 2, 1, 2], [8, 2, 1, 3], [8, 4, 2, 3], [9, 3, 1, 2], [9, 27, 3, 2], [4, 8, 3, 2], [16, 8, 3, 4], [27, 9, 2, 3], [25, 5, 1, 2], [16, 2, 1, 4], [4, 32, 5, 2]]);
      const tex = `\\log_{${b}} ${arg}`;
      return {
        q: `Calcula ${m(tex)}. La respuesta es una fracción.`, campos: [campo(F(n, d), m('='))], r: m(tf(F(n, d))), prueba: { tipo: 'log', base: b, arg, valor: F(n, d) },
        sol: [`Escribe los dos como potencias de la misma base y plantea ${m(`${b}^{x} = ${arg}`)}.`, `Igualando exponentes sale ${m(`x = ${tf(F(n, d))}`)}.`],
      };
    }
    const [b, k] = elegir([[2, 5], [2, 7], [3, 4], [5, 3], [10, 4], [2, 8], [3, 5]]);
    return {
      q: `Resuelve ${m(`${b}^{x} = ${miles(b ** k)}`)}.`, campos: [campo(k, m('x ='))], r: m(`x = ${k}`), prueba: { tipo: 'log', base: b, arg: b ** k, valor: F(k) },
      sol: [`Escribe el lado derecho como potencia de ${b}: ${m(`${miles(b ** k)} = ${b}^{${k}}`)}.`, `Bases iguales, exponentes iguales: ${m(`x = ${k}`)}. Es lo mismo que ${m(`x = \\log_{${b}} ${miles(b ** k)}`)}.`],
    };
  }
  const tipo = elegir(['resta', 'suma', 'ecuacion', 'potencia']);
  if (tipo === 'resta') {
    const [b, k] = elegir([[2, 2], [2, 3], [3, 2], [5, 1], [2, 4], [3, 1]]), c = elegir([3, 5, 7]);
    if (c === b) return logaritmos(nv);
    return {
      q: `Calcula ${m(`\\log_{${b}} ${c * b ** k} - \\log_{${b}} ${c}`)}.`, campos: [campo(k, m('='))], r: m(`${k}`), prueba: { tipo: 'numero', valor: Math.log(c * b ** k) / Math.log(b) - Math.log(c) / Math.log(b), dado: k },
      sol: [`Resta de logaritmos de igual base: logaritmo del cociente, ${m(`\\log_{${b}} \\frac{${c * b ** k}}{${c}} = \\log_{${b}} ${b ** k}`)}.`, `${m(`${b}^{${k}} = ${b ** k}`)}: vale ${k}.`],
    };
  }
  if (tipo === 'suma') {
    const [x, y, k] = elegir([[25, 4, 2], [50, 2, 2], [125, 8, 3], [20, 5, 2], [250, 4, 3], [5, 2, 1]]);
    return {
      q: `Calcula ${m(`\\log ${x} + \\log ${y}`)} (logaritmos en base 10).`, campos: [campo(k, m('='))], r: m(`${k}`), prueba: { tipo: 'numero', valor: Math.log10(x) + Math.log10(y), dado: k },
      sol: [`Suma de logaritmos: logaritmo del producto, ${m(`\\log(${x} \\times ${y}) = \\log ${miles(x * y)}`)}.`, `${m(`10^{${k}} = ${miles(x * y)}`)}: vale ${k}.`],
    };
  }
  if (tipo === 'ecuacion') {
    const [b, k] = elegir([[2, 3], [2, 5], [3, 2], [3, 3], [5, 2], [10, 2], [4, 2]]), a = ent(1, 9);
    const x = b ** k + a;
    return {
      q: `Resuelve ${m(`\\log_{${b}}(x - ${a}) = ${k}`)}.`, campos: [campo(x, m('x ='))], r: m(`x = ${x}`), prueba: { tipo: 'log', base: b, arg: x - a, valor: F(k) },
      sol: [`Pasa a forma exponencial: ${m(`x - ${a} = ${b}^{${k}} = ${b ** k}`)}.`, `${m(`x = ${b ** k} + ${a} = ${x}`)}. Comprueba que el argumento quede positivo.`],
    };
  }
  const [b, c, n, k] = elegir([[3, 6, 2, 4], [2, 6, 2, 9], [5, 10, 2, 4], [2, 12, 2, 9], [3, 12, 2, 16]]);
  // n·log_b(c) − log_b(k) = log_b(c^n / k)
  const cociente = c ** n / k;
  const valor = Math.round(Math.log(cociente) / Math.log(b));
  return {
    q: `Calcula ${m(`${n}\\log_{${b}} ${c} - \\log_{${b}} ${k}`)}.`, campos: [campo(valor, m('='))], r: m(`${valor}`), prueba: { tipo: 'numero', valor: n * (Math.log(c) / Math.log(b)) - Math.log(k) / Math.log(b), dado: valor },
    sol: [`El coeficiente sube como exponente: ${m(`\\log_{${b}} ${c}^{${n}} = \\log_{${b}} ${c ** n}`)}.`, `Resta de logaritmos: ${m(`\\log_{${b}} \\frac{${c ** n}}{${k}} = \\log_{${b}} ${cociente} = ${valor}`)}.`],
  };
}

// ---------- Catálogo de temas ----------
export const TEMAS = [
  { id: 'signos', titulo: 'Ley de los signos', sesion: 'f1', gen: signos },
  { id: 'jerarquia', titulo: 'Operaciones combinadas', sesion: 'f1', gen: jerarquia },
  { id: 'fracciones', titulo: 'Fracciones', sesion: 'f1', gen: fracciones },
  { id: 'division', titulo: 'División a mano', sesion: 'f1', gen: division },
  { id: 'potencias', titulo: 'Potencias y leyes de exponentes', sesion: 'f2', gen: potencias },
  { id: 'raices', titulo: 'Raíces y exponentes fraccionarios', sesion: 'f2', gen: raices },
  { id: 'cientifica', titulo: 'Notación científica', sesion: 'f2', gen: cientifica },
  { id: 'porcentajes', titulo: 'Porcentajes', sesion: 'f2', gen: porcentajes },
  { id: 'notables', titulo: 'Productos notables', sesion: 'f3', gen: notables },
  { id: 'factorizacion', titulo: 'Factorización', sesion: 'f3', gen: factorizacion },
  { id: 'racionales', titulo: 'Fracciones algebraicas', sesion: 'f4', gen: racionales },
  { id: 'despejes', titulo: 'Despejes', sesion: 'f4', gen: despejes },
  { id: 'lineales', titulo: 'Ecuaciones lineales', sesion: 'f4', gen: lineales },
  { id: 'cuadraticas', titulo: 'Ecuaciones cuadráticas', sesion: 'f4', gen: cuadraticas },
  { id: 'sistemas', titulo: 'Sistemas 2×2', sesion: 'f5', gen: sistemas },
  { id: 'desigualdades', titulo: 'Desigualdades', sesion: 'f5', gen: desigualdades },
  { id: 'ruffini', titulo: 'División de polinomios (Ruffini)', sesion: 'f5', gen: ruffini },
  { id: 'logaritmos', titulo: 'Logaritmos', sesion: 'f5', gen: logaritmos },
];

const POR_ID = new Map(TEMAS.map((t) => [t.id, t]));
export const temaDe = (id) => POR_ID.get(id) || null;

/** Genera un ejercicio del tema y nivel indicados. */
export function generar(id, nv = 2) {
  const t = POR_ID.get(id);
  if (!t) throw new Error(`Tema desconocido: ${id}`);
  const nivel = Math.min(3, Math.max(1, nv));
  const ej = t.gen(nivel);
  return { ...ej, tema: id, nv: nivel };
}

// ---------- Revisión de respuestas ----------
/** Convierte lo escrito ("-3/4", "0.75", "1,250", "−2") en fracción exacta; null si no es un número. */
export function leerNumero(texto) {
  let s = String(texto ?? '').trim().replace(/[−–]/g, '-').replace(/\s+/g, '').replace(/^Q/i, '').replace(/%$/, '');
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  let x = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (x) return +x[2] === 0 ? null : { ...F(+x[1], +x[2]), reducible: mcd(+x[1], +x[2]) !== 1 };
  x = s.match(/^(-?)(\d*)\.(\d+)$/);
  if (x) return F((x[1] ? -1 : 1) * Number((x[2] || '0') + x[3]), 10 ** x[3].length);
  if (/^-?\d+$/.test(s)) return F(+s);
  return null;
}

/**
 * Revisa una respuesta. entradas: textos de los campos, o [índice] si es de opción múltiple.
 * Devuelve {ok, invalida?, simplificar?}.
 */
export function revisar(ej, entradas) {
  if (ej.ops) return { ok: +entradas[0] === ej.ok };
  const dadas = entradas.map(leerNumero);
  if (dadas.length !== ej.campos.length || dadas.some((d) => !d)) return { ok: false, invalida: true };
  const igual = (a, b) => a.n === b.n && a.d === b.d;
  let ok;
  if (ej.orden === false) {
    const clave = (f) => `${f.n}/${f.d}`;
    ok = dadas.map(clave).sort().join('|') === ej.campos.map((c) => clave(c.valor)).sort().join('|');
  } else ok = ej.campos.every((c, i) => igual(c.valor, dadas[i]));
  return { ok, simplificar: ok && dadas.some((d) => d.reducible) };
}
