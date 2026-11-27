// Piezas del módulo de inglés que se reúsan en la práctica por tema, la rutina y el simulacro:
// estadísticas por pregunta, preguntas con retroalimentación inmediata, voz británica (dictado y
// lectura de preguntas) y entrevista con reloj y grabación.
import { leerJSON, guardarJSON } from '../progreso.js';
import { fallar, idIngles } from '../repaso.js';
import { hoy } from '../fechas.js';
import { esc, LETRAS, opcionesBarajadas, barajar, cuentaAtras, barraHTML, pct } from '../ui.js';
import { puedeGrabar, grabar } from '../grabadora.js';

// ---------- Estadísticas por pregunta ----------
const CLAVE = 'ingles-stats';
export const stats = () => leerJSON(CLAVE, {}) || {};

export function anotar(p, ok, etiqueta = '') {
  const s = stats();
  const x = s[p.id] || { n: 0, ok: 0 };
  x.n++; if (ok) x.ok++;
  x.ultimo = hoy();
  x.racha = ok ? (x.racha || 0) + 1 : 0;
  s[p.id] = x;
  guardarJSON(CLAVE, s);
  if (!ok) {
    fallar(idIngles(p.id), etiqueta || 'Inglés');
    window.dispatchEvent(new CustomEvent('repaso-cambio'));
  }
}

/** Aciertos de un tema: {vistas, total, ok, intentos}. */
export function resumenTema(tema, s = stats()) {
  let vistas = 0, ok = 0, intentos = 0;
  for (const p of tema.todas) {
    const x = s[p.id];
    if (!x) continue;
    vistas++; ok += x.ok; intentos += x.n;
  }
  return { vistas, total: tema.todas.length, ok, intentos };
}

/** Prioridad para practicar: primero lo nunca visto, luego lo fallado, al final lo dominado. */
export function ordenarPorNecesidad(preguntas, s = stats()) {
  const peso = (p) => {
    const x = s[p.id];
    if (!x) return 1;
    if (!x.racha) return 0;
    return 2 + x.racha;
  };
  return barajar([...preguntas]).sort((a, b) => peso(a) - peso(b));
}

// ---------- Pregunta con retroalimentación inmediata ----------
/**
 * Muestra preguntas una por una en `el`. Cada respuesta se anota y, si falla, va al cuaderno.
 * opciones: {etiqueta(p), textoDe(p), alTerminar(resultados), boton}
 */
export function montarPreguntas(el, preguntas, { etiqueta = () => 'Inglés', textoDe = () => null, alTerminar, encabezado = () => '' } = {}) {
  let k = 0;
  const resultados = [];
  function mostrar() {
    if (k >= preguntas.length) { alTerminar?.(resultados); return; }
    const p = preguntas[k];
    const ops = opcionesBarajadas(p.a, p.d);
    const correcta = ops.findIndex((o) => o.correcta);
    const texto = textoDe(p);
    el.innerHTML = `${encabezado(k, preguntas.length)}
      <article class="ej examen-q">
        <p class="origen">${esc(p.nv)}${p.temaTitulo ? ` · ${esc(p.temaTitulo)}` : ''}</p>
        ${texto ? `<details class="lectura" open><summary class="ui">${esc(texto.titulo)}</summary><div lang="en">${texto.texto.map((x) => `<p>${esc(x)}</p>`).join('')}</div></details>` : ''}
        <div class="enun en" lang="en">${p.q}</div>
        <div class="ops">${ops.map((o, i) => `<button type="button" class="op" data-i="${i}" lang="en"><b>${LETRAS[i]})</b> ${o.texto}</button>`).join('')}</div>
        <div class="fb" hidden></div>
        <div class="acciones" id="pq-acc"></div>
      </article>`;
    const caja = el.querySelector('.ops');
    caja.addEventListener('click', (ev) => {
      const b = ev.target.closest('.op');
      if (!b || b.disabled) return;
      const ok = +b.dataset.i === correcta;
      caja.querySelectorAll('.op').forEach((o) => { o.disabled = true; if (+o.dataset.i === correcta) o.classList.add('bien'); });
      if (!ok) b.classList.add('mal');
      anotar(p, ok, etiqueta(p));
      resultados.push({ p, ok });
      const fb = el.querySelector('.fb');
      fb.hidden = false;
      fb.innerHTML = `<p class="veredicto ${ok ? 'si' : 'no'}" aria-live="polite">${ok ? 'Correct.' : `Incorrect: la correcta es la ${LETRAS[correcta]}). Pasó al cuaderno de errores.`}</p><p class="finalidad"><b>Explicación:</b> ${p.x}</p>`;
      const acc = el.querySelector('#pq-acc');
      acc.innerHTML = `<button class="btn btn-primario" type="button">${k + 1 < preguntas.length ? 'Siguiente' : 'Terminar'}</button>`;
      const s = acc.querySelector('button');
      s.addEventListener('click', () => { k++; mostrar(); });
      s.focus({ preventScroll: true });
    });
    caja.querySelector('.op')?.focus({ preventScroll: true });
  }
  mostrar();
  return { resultados };
}

// ---------- Voz británica (síntesis del navegador) ----------
export const hayVoz = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

function vozBritanica() {
  const voces = speechSynthesis.getVoices();
  return voces.find((v) => v.lang === 'en-GB' && /female|libby|sonia|serena|kate|google uk english female/i.test(v.name))
    || voces.find((v) => v.lang === 'en-GB')
    || voces.find((v) => /^en[-_]GB/i.test(v.lang))
    || voces.find((v) => /^en/i.test(v.lang))
    || null;
}

/** Lee un texto en inglés británico si el sistema tiene esa voz. Devuelve el nombre de la voz usada. */
export function leer(texto, velocidad = 0.95) {
  if (!hayVoz()) return null;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  const v = vozBritanica();
  if (v) u.voice = v;
  u.lang = v?.lang || 'en-GB';
  u.rate = velocidad;
  speechSynthesis.speak(u);
  return v ? `${v.name} (${v.lang})` : 'voz predeterminada';
}
export const callar = () => { if (hayVoz()) speechSynthesis.cancel(); };
// Algunas plataformas cargan las voces tarde
if (hayVoz()) speechSynthesis.getVoices();

const normal = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').trim().split(/\s+/).filter(Boolean);

/** Compara palabra por palabra (alineación por LCS). Devuelve {html, bien, total}. */
export function compararPalabras(esperado, escrito) {
  const a = normal(esperado), b = normal(escrito);
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { out.push(`<span class="pal ok">${esc(a[i])}</span>`); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { out.push(`<span class="pal falta" title="faltó">${esc(a[i])}</span>`); i++; }
    else { out.push(`<span class="pal sobra" title="sobra">${esc(b[j])}</span>`); j++; }
  }
  while (i < a.length) out.push(`<span class="pal falta" title="faltó">${esc(a[i++])}</span>`);
  while (j < b.length) out.push(`<span class="pal sobra" title="sobra">${esc(b[j++])}</span>`);
  return { html: out.join(' '), bien: L[0][0], total: a.length };
}

/** Dictado: lee oraciones con voz británica y compara lo escrito. */
export function montarDictado(el, oraciones, { n = 8, alTerminar } = {}) {
  if (!hayVoz()) {
    el.innerHTML = '<p class="ui det">Este navegador no tiene síntesis de voz, así que el dictado no está disponible. Usa un podcast o un video con acento británico y escribe lo que oyes.</p>';
    alTerminar?.({ bien: 0, total: 0 });
    return { limpiar() {} };
  }
  const ronda = barajar([...oraciones]).slice(0, n);
  let k = 0, bien = 0, total = 0;
  function mostrar() {
    if (k >= ronda.length) {
      callar();
      el.innerHTML = `<p class="lead">Dictado: ${bien} de ${total} palabras bien (${pct(bien, total)} %).</p>`;
      alTerminar?.({ bien, total });
      return;
    }
    el.innerHTML = `<div class="dictado"><p class="origen ui">Oración ${k + 1} de ${ronda.length}</p>
      <div class="acciones"><button class="btn btn-primario" type="button" data-v="0.95">Escuchar</button><button class="btn" type="button" data-v="0.7">Más lento</button></div>
      <p class="ui det" id="dc-voz"></p>
      <label class="campo-largo ui">Escribe lo que oíste<textarea rows="2" lang="en" spellcheck="false" autocomplete="off"></textarea></label>
      <div class="acciones"><button class="btn" type="button" id="dc-ok">Comprobar</button></div><div id="dc-fb" aria-live="polite"></div></div>`;
    const ta = el.querySelector('textarea');
    el.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      const v = leer(ronda[k], +b.dataset.v);
      el.querySelector('#dc-voz').textContent = v ? `Voz: ${v}${/GB/.test(v) ? '' : ' (no hay voz británica instalada: el acento puede variar)'}` : '';
      ta.focus();
    }));
    el.querySelector('#dc-ok').addEventListener('click', () => {
      const r = compararPalabras(ronda[k], ta.value);
      bien += r.bien; total += r.total;
      el.querySelector('#dc-fb').innerHTML = `<p class="veredicto ${r.bien === r.total ? 'si' : 'no'} ui">${r.bien} de ${r.total} palabras.</p><p class="comparacion" lang="en">${r.html}</p><p class="ui det">Texto: <span lang="en">${esc(ronda[k])}</span></p>
        <div class="acciones"><button class="btn btn-primario" type="button" id="dc-sig">${k + 1 < ronda.length ? 'Siguiente' : 'Terminar'}</button></div>`;
      el.querySelector('#dc-ok').disabled = true;
      ta.readOnly = true;
      const s = el.querySelector('#dc-sig');
      s.addEventListener('click', () => { k++; mostrar(); });
      s.focus({ preventScroll: true });
    });
    el.querySelector('[data-v]').focus({ preventScroll: true });
  }
  mostrar();
  return { limpiar: callar };
}

// ---------- Entrevista ----------
const CHEQUEO = ['Contesté lo que me preguntaron, sin rodeos.', 'Di una razón y un ejemplo concreto.', 'Usé bien los tiempos verbales (sobre todo present perfect y past simple).', 'Hablé sin pausas largas; usé frases para ganar tiempo.', 'Usé vocabulario más allá del básico.'];

/** Práctica de entrevista: pregunta al azar, preparación, reloj para hablar, grabación y chequeo. */
export function montarEntrevista(el, entrevista, { categoria = '', grabarAudio = false, preparacion = 15, alTerminar } = {}) {
  let reloj = null, rec = null, audio = null;
  const limpiar = () => { reloj?.detener(); reloj = null; rec?.detener(); rec = null; callar(); if (audio) URL.revokeObjectURL(audio); };
  const cats = entrevista.categorias.filter((c) => !categoria || c.id === categoria);
  let contadas = 0;

  function nueva() {
    limpiar();
    const c = cats[Math.floor(Math.random() * cats.length)];
    const pregunta = c.preguntas[Math.floor(Math.random() * c.preguntas.length)];
    el.innerHTML = `<div class="entrevista"><p class="origen ui">${esc(c.titulo)} · ${c.segundos} segundos para hablar</p>
      <h3 class="en" lang="en">${esc(pregunta)}</h3>
      <div class="acciones">${hayVoz() ? '<button class="btn" type="button" id="en-oir">Escuchar la pregunta</button>' : ''}<button class="btn btn-primario" type="button" id="en-hablar">Empezar a hablar</button><span class="reloj ui" id="en-reloj" role="timer"></span></div>
      <p class="ui det" id="en-estado">Prepara tu respuesta: ${preparacion} segundos. Una idea, una razón y un ejemplo.</p><div id="en-fb"></div></div>`;
    el.querySelector('#en-oir')?.addEventListener('click', () => leer(pregunta, 0.95));
    const hablar = async () => {
      reloj?.detener();
      el.querySelector('#en-hablar').disabled = true;
      const estado = el.querySelector('#en-estado');
      if (grabarAudio && puedeGrabar()) {
        try { rec = await grabar(); estado.textContent = 'Grabando. Habla en inglés hasta que se acabe el tiempo.'; }
        catch { estado.textContent = 'No se pudo usar el micrófono; habla de todos modos.'; }
      } else estado.textContent = 'Habla en voz alta hasta que se acabe el tiempo.';
      el.querySelector('#en-hablar').insertAdjacentHTML('afterend', '<button class="btn" type="button" id="en-fin">Terminé</button>');
      el.querySelector('#en-fin').addEventListener('click', terminar);
      reloj = cuentaAtras(el.querySelector('#en-reloj'), c.segundos, terminar);
    };
    const terminar = async () => {
      reloj?.detener(); reloj = null;
      audio = rec ? await rec.detener() : null;
      rec = null;
      contadas++;
      el.querySelector('#en-fin')?.remove();
      el.querySelector('#en-estado').textContent = '';
      el.querySelector('#en-fb').innerHTML = `${audio ? `<p class="ui det">Escúchate:</p><audio controls src="${audio}"></audio>` : ''}
        <fieldset class="chequeo ui"><legend>¿Qué lograste?</legend>${CHEQUEO.map((t) => `<label><input type="checkbox"> ${esc(t)}</label>`).join('')}</fieldset>
        <div class="acciones"><button class="btn btn-primario" type="button" id="en-otra">Otra pregunta</button>${alTerminar ? '<button class="btn" type="button" id="en-listo">Terminar</button>' : ''}</div>`;
      el.querySelector('#en-otra').addEventListener('click', nueva);
      el.querySelector('#en-listo')?.addEventListener('click', () => { limpiar(); alTerminar({ contadas }); });
      el.querySelector('#en-otra').focus({ preventScroll: true });
    };
    el.querySelector('#en-hablar').addEventListener('click', hablar);
    reloj = cuentaAtras(el.querySelector('#en-reloj'), preparacion, hablar);
  }
  nueva();
  return { limpiar };
}

