// Modo examen: preguntas aleatorias de un área, un bloque o una lista de cursos, con tiempo límite.
// Toma cuestionarios (opción múltiple) y ejercicios para resolver que el estudiante autoevalúa.
// Lo que se falla pasa al cuaderno de errores. Ajustes rápidos del plan (?preset=):
//   entrada    cuestionario de entrada de 20 minutos (opción múltiple)
//   problemas  12 ejercicios para resolver a mano, 3 minutos cada uno
//   simulacro  2 horas: 40 preguntas mezcladas, 3 minutos cada una
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
import { cargarCatalogo, cargarCurso, ambitos as listaAmbitos } from '../datos.js';
import { leerJSON, guardarJSON } from '../progreso.js';
import { fallar, idGuia } from '../repaso.js';
import { formulas } from '../katex.js';
import { esc, barra, barraHTML, LETRAS, NIVEL, tipoDe, barajar, mmss, sinHTML } from '../ui.js';

const CLAVE_HISTORIAL = 'privados-examenes';
const CLAVE_CONFIG = 'privados-examen-config';

const PRESETS = {
  entrada: { nombre: 'Cuestionario de entrada', cantidad: 15, minutos: 80 / 60, tipos: 'quiz', nota: '20 minutos para saber qué tema oír y practicar primero.' },
  problemas: { nombre: 'Problemas con reloj', cantidad: 12, minutos: 3, tipos: 'abiertas', nota: 'Resuelve cada uno en papel antes de ver la respuesta.' },
  simulacro: { nombre: 'Simulacro de 2 horas', cantidad: 40, minutos: 3, tipos: 'mixto', nota: 'Con reloj, como el parcial. Al terminar revisa los errores y explica dos temas en voz alta.' },
};
const TIPOS = [['mixto', 'Opción múltiple y para resolver'], ['quiz', 'Solo opción múltiple'], ['abiertas', 'Solo para resolver (autoevaluadas)']];

function ambitoDeCursos(cat, slugs) {
  const cursos = [];
  for (const a of cat.areas) for (const b of a.bloques) for (const c of b.cursos) if (slugs.includes(c.slug) && !c.pendiente) cursos.push(c);
  if (!cursos.length) return null;
  return { valor: `cursos:${slugs.join(',')}`, etiqueta: cursos.length === 1 ? cursos[0].titulo : cursos.map((c) => c.titulo).join(', '), grupo: 'Del plan', cursos };
}

export default async function vistaExamen(app, _partes, q) {
  const cat = await cargarCatalogo();
  const opciones = listaAmbitos(cat);
  const delPlan = q.get('cursos') ? ambitoDeCursos(cat, q.get('cursos').split(',')) : null;
  if (delPlan) opciones.unshift(delPlan);
  document.title = 'Modo examen | Inge 2028';
  barra({ titulo: 'Modo examen' });

  let reloj = null;
  const detener = () => { clearInterval(reloj); reloj = null; };

  const guardada = leerJSON(CLAVE_CONFIG, {}) || {};
  const pedido = delPlan ? delPlan.valor : q.get('area') ? (q.get('bloque') ? `bloque:${q.get('area')}:${q.get('bloque')}` : `area:${q.get('area')}`) : null;
  const preset = PRESETS[q.get('preset')] || null;
  const config = {
    ambito: opciones.some((o) => o.valor === pedido) ? pedido : opciones.some((o) => o.valor === guardada.ambito) ? guardada.ambito : opciones[0]?.valor,
    cantidad: preset?.cantidad || guardada.cantidad || 20,
    minutos: preset ? preset.minutos : guardada.minutos ?? 1.5,
    tipos: preset?.tipos || guardada.tipos || (guardada.abiertas === false ? 'quiz' : 'mixto'),
  };

  // ---------- Configuración ----------
  function pantallaConfig() {
    detener();
    const grupos = [...new Set(opciones.map((o) => o.grupo))];
    const select = grupos.map((g) => `<optgroup label="${esc(g)}">${opciones.filter((o) => o.grupo === g).map((o) => `<option value="${esc(o.valor)}"${o.valor === config.ambito ? ' selected' : ''}>${esc(o.etiqueta)}</option>`).join('')}</optgroup>`).join('');
    const hist = (leerJSON(CLAVE_HISTORIAL, []) || []).slice(0, 8);
    const minutos = [[80 / 60, '1 minuto y 20 segundos'], [1.5, '1 minuto y medio'], [2, '2 minutos'], [3, '3 minutos'], [4, '4 minutos'], [0, 'Sin límite']];
    if (!minutos.some(([v]) => v === config.minutos)) minutos.unshift([config.minutos, `${Math.round(config.minutos * 60)} segundos`]);
    app.innerHTML = `<main class="idx">
      <p class="migas ui"><a href="#/">Hoy</a></p>
      <section class="hero"><h1>${preset ? esc(preset.nombre) : 'Modo examen'}</h1>
        <p class="lead">${preset ? esc(preset.nota) : 'Preguntas al azar de un área, un bloque o los cursos de la semana, con tiempo límite. Las de opción múltiple se califican solas; en las abiertas escribe tu respuesta en papel, compárala y di si la sabías.'} Lo que falles pasa al cuaderno de errores.</p>
        <div class="acciones">${Object.entries(PRESETS).map(([k, p]) => `<button class="chip" type="button" data-preset="${k}" aria-pressed="${preset === p}">${esc(p.nombre)}</button>`).join('')}</div></section>
      <form class="form-examen ui" id="form-examen">
        <label>¿Qué quieres practicar?<select name="ambito">${select}</select></label>
        <label>Número de preguntas<select name="cantidad">${[10, 12, 15, 20, 30, 40, 50].map((n) => `<option${n === config.cantidad ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>Tiempo por pregunta<select name="minutos">${minutos.map(([v, t]) => `<option value="${v}"${v === config.minutos ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>Tipo de preguntas<select name="tipos">${TIPOS.map(([v, t]) => `<option value="${v}"${v === config.tipos ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <p class="ayuda" id="disponibles" aria-live="polite"></p>
        <p><button class="btn btn-primario" type="submit">Comenzar examen</button></p>
      </form>
      ${hist.length ? `<section class="bloque"><h2>Últimos intentos</h2><ul class="historial">${hist.map((h) => `<li>${new Date(h.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })} · ${esc(h.ambito)} · <b>${h.correctas}/${h.total}</b> (${Math.round((100 * h.correctas) / h.total)} %)</li>`).join('')}</ul></section>` : ''}
    </main>`;
    const form = app.querySelector('#form-examen');
    const disp = app.querySelector('#disponibles');
    const mostrarDisponibles = () => {
      const o = opciones.find((x) => x.valor === form.ambito.value);
      const quiz = o.cursos.reduce((s, c) => s + c.tipos.quiz, 0);
      const abiertas = o.cursos.reduce((s, c) => s + c.tipos.practica, 0);
      const t = form.tipos.value;
      const hay = t === 'quiz' ? quiz : t === 'abiertas' ? abiertas : quiz + abiertas;
      const total = +form.cantidad.value * +form.minutos.value;
      disp.textContent = `${o.cursos.length} curso(s): ${quiz} de opción múltiple y ${abiertas} para resolver. Con este ajuste entran ${Math.min(hay, +form.cantidad.value)} preguntas${+form.minutos.value ? ` y tienes ${Math.round(Math.min(hay, +form.cantidad.value) * +form.minutos.value)} minutos` : ''}.${hay < +form.cantidad.value ? ' No hay suficientes preguntas de ese tipo: se usan todas.' : ''}`;
      void total;
    };
    form.addEventListener('change', mostrarDisponibles);
    mostrarDisponibles();
    app.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      const p = PRESETS[b.dataset.preset];
      Object.assign(config, { cantidad: p.cantidad, minutos: p.minutos, tipos: p.tipos, ambito: form.ambito.value });
      const qs = new URLSearchParams(location.hash.split('?')[1] || '');
      qs.set('preset', b.dataset.preset);
      history.replaceState(null, '', `#/examen?${qs}`);
      vistaExamen(app, [], qs);
    }));
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      config.ambito = form.ambito.value;
      config.cantidad = +form.cantidad.value;
      config.minutos = +form.minutos.value;
      config.tipos = form.tipos.value;
      if (!delPlan || config.ambito !== delPlan.valor) guardarJSON(CLAVE_CONFIG, config);
      comenzar();
    });
  }

  // ---------- Examen ----------
  async function comenzar() {
    const ambito = opciones.find((o) => o.valor === config.ambito);
    app.innerHTML = '<p class="cargando ui">Preparando preguntas…</p>';
    const cursos = await Promise.all(ambito.cursos.map((c) => cargarCurso(c.slug)));
    const quiere = (tipo) => (config.tipos === 'quiz' ? tipo === 'quiz' : config.tipos === 'abiertas' ? tipo === 'practica' : tipo === 'quiz' || tipo === 'practica');
    const banco = [];
    cursos.forEach((c) => c.temas.forEach((t, ti) => t.ejercicios.forEach((e, ei) => {
      const tipo = tipoDe(e);
      if (quiere(tipo)) banco.push({ e, tipo, slug: c.slug, curso: c.titulo, tema: `t${ti + 1}`, ej: `t${ti + 1}-e${ei + 1}`, temaTitulo: t.titulo });
    })));
    if (!banco.length) {
      app.innerHTML = `<main class="idx"><section class="hero"><h1>Sin preguntas</h1><p class="lead">Este ámbito no tiene preguntas de ese tipo. Cambia el tipo de preguntas o elige otro bloque.</p><p><button class="btn btn-primario" type="button" id="volver">Cambiar configuración</button></p></section></main>`;
      app.querySelector('#volver').addEventListener('click', pantallaConfig);
      return;
    }
    const preguntas = barajar(banco).slice(0, config.cantidad).map((p) => ({ ...p, respuesta: null })); // respuesta: índice | true/false
    const limite = config.minutos ? Math.round(config.minutos * 60 * preguntas.length) : 0;
    const inicio = Date.now();
    let actual = 0;

    app.innerHTML = `<main class="idx">
      <div class="examen-cab ui"><span id="ex-num"></span><span class="barra" aria-hidden="true"><i></i></span>
        ${limite ? '<span class="reloj" id="ex-reloj" role="timer" aria-live="off"></span>' : ''}<button class="btn" type="button" id="ex-terminar">Terminar</button></div>
      <div id="ex-q"></div>
      <p class="ui" style="color:var(--muted);font-size:13px;margin-top:20px">${esc(ambito.etiqueta)}</p>
    </main>`;
    const elQ = app.querySelector('#ex-q');
    const elNum = app.querySelector('#ex-num');
    const elBarra = app.querySelector('.examen-cab .barra i');
    const elReloj = app.querySelector('#ex-reloj');
    app.querySelector('#ex-terminar').addEventListener('click', () => {
      const faltan = preguntas.filter((p) => p.respuesta === null).length;
      if (!faltan || confirm(`Quedan ${faltan} pregunta(s) sin responder. ¿Terminar el examen?`)) terminar();
    });

    if (limite) {
      const tic = () => {
        const resta = Math.max(0, limite - Math.floor((Date.now() - inicio) / 1000));
        elReloj.textContent = mmss(resta);
        elReloj.classList.toggle('poco', resta <= 60);
        if (!resta) terminar();
      };
      tic();
      reloj = setInterval(tic, 1000);
    }

    function mostrar() {
      const p = preguntas[actual];
      const { e } = p;
      elNum.textContent = `Pregunta ${actual + 1} de ${preguntas.length}`;
      elBarra.style.width = `${(100 * actual) / preguntas.length}%`;
      const cab = `<p class="origen">${esc(p.curso)} · ${p.temaTitulo} · <span class="nv ${e.nv}">${NIVEL[e.nv] || e.nv}</span></p>`;
      const ultima = actual === preguntas.length - 1;
      if (p.tipo === 'quiz') {
        const ops = e.ops.map((o, i) => `<button type="button" class="op${p.respuesta === i ? ' elegida' : ''}" data-i="${i}" aria-pressed="${p.respuesta === i}"><b>${LETRAS[i]})</b> ${o}</button>`).join('');
        elQ.innerHTML = `<article class="ej examen-q">${cab}<div class="enun">${e.q}</div><div class="ops">${ops}</div>
          <div class="acciones"><button class="btn btn-primario" type="button" id="ex-sig"${p.respuesta === null ? ' disabled' : ''}>${ultima ? 'Ver resultado' : 'Siguiente'}</button><button class="btn" type="button" id="ex-saltar">${ultima ? 'Terminar sin responder' : 'Saltar'}</button></div></article>`;
        elQ.querySelector('.ops').addEventListener('click', (ev) => {
          const b = ev.target.closest('.op');
          if (!b) return;
          p.respuesta = +b.dataset.i;
          elQ.querySelectorAll('.op').forEach((x) => { const sel = x === b; x.classList.toggle('elegida', sel); x.setAttribute('aria-pressed', sel); });
          elQ.querySelector('#ex-sig').disabled = false;
        });
        elQ.querySelector('#ex-sig').addEventListener('click', avanzar);
      } else {
        elQ.innerHTML = `<article class="ej examen-q">${cab}<div class="enun">${e.q}</div>
          <div class="acciones" id="ex-acc"><button class="btn btn-primario" type="button" id="ex-ver">Mostrar respuesta</button><button class="btn" type="button" id="ex-saltar">${ultima ? 'Terminar sin responder' : 'Saltar'}</button></div></article>`;
        elQ.querySelector('#ex-ver').addEventListener('click', () => {
          const acc = elQ.querySelector('#ex-acc');
          acc.insertAdjacentHTML('beforebegin', `<div class="resultado"><b>Respuesta:</b> ${e.r}</div>`);
          acc.innerHTML = '<button class="btn btn-primario" type="button" data-sabia="1">La sabía</button><button class="btn" type="button" data-sabia="0">No la sabía</button>';
          acc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { p.respuesta = b.dataset.sabia === '1'; avanzar(); }));
          formulas(elQ);
          acc.querySelector('button').focus({ preventScroll: true });
        });
      }
      elQ.querySelector('#ex-saltar')?.addEventListener('click', () => { p.respuesta = null; avanzar(); });
      formulas(elQ);
      elQ.querySelector('button')?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }

    function avanzar() {
      if (actual < preguntas.length - 1) { actual++; mostrar(); }
      else terminar();
    }

    let terminado = false;
    function terminar() {
      if (terminado) return;
      terminado = true;
      detener();
      const usados = Math.round((Date.now() - inicio) / 1000);
      const correcta = (p) => (p.tipo === 'quiz' ? p.respuesta === p.e.ok : p.respuesta === true);
      const correctas = preguntas.filter(correcta).length;
      const sinResponder = preguntas.filter((p) => p.respuesta === null).length;
      const pct = Math.round((100 * correctas) / preguntas.length);
      const hist = leerJSON(CLAVE_HISTORIAL, []) || [];
      hist.unshift({ fecha: Date.now(), ambito: ambito.etiqueta, total: preguntas.length, correctas });
      guardarJSON(CLAVE_HISTORIAL, hist.slice(0, 30));

      // Lo respondido mal pasa al cuaderno; lo que se dejó sin responder, no
      const falladas = preguntas.filter((p) => p.respuesta !== null && !correcta(p));
      for (const p of falladas) fallar(idGuia(p.slug, p.ej), `${p.curso} · ${sinHTML(p.temaTitulo)}`);
      window.dispatchEvent(new CustomEvent('repaso-cambio'));

      // Resultado por tema, del peor al mejor
      const porTema = new Map();
      for (const p of preguntas) {
        const k = `${p.slug}|${p.tema}`;
        const v = porTema.get(k) || { curso: p.curso, tema: p.temaTitulo, slug: p.slug, t: p.tema, ok: 0, n: 0 };
        v.n++; if (correcta(p)) v.ok++;
        porTema.set(k, v);
      }
      const temas = [...porTema.values()].sort((a, b) => a.ok / a.n - b.ok / b.n || b.n - a.n);
      const tablaTemas = temas.length > 1 ? `<section class="bloque"><h2>Por tema</h2><div class="tabla"><table><thead><tr><th>Tema</th><th>Aciertos</th></tr></thead><tbody>
        ${temas.map((t) => `<tr><td><a href="#/curso/${esc(t.slug)}/${t.t}">${esc(t.curso)} · ${t.tema}</a></td><td>${t.ok}/${t.n}</td></tr>`).join('')}</tbody></table></div></section>` : '';

      const repaso = preguntas.filter((p) => !correcta(p)).map((p) => {
        const { e } = p;
        let detalle;
        if (p.tipo === 'quiz') {
          const tuya = p.respuesta === null ? 'Sin responder.' : `Elegiste la ${LETRAS[p.respuesta]}).`;
          detalle = `<div class="ops">${e.ops.map((o, i) => `<button type="button" class="op${i === e.ok ? ' bien' : i === p.respuesta ? ' mal' : ''}" disabled><b>${LETRAS[i]})</b> ${o}</button>`).join('')}</div>
            <p class="fb"><span class="veredicto no">${tuya} La correcta es la ${LETRAS[e.ok]}).</span></p><p class="finalidad"><b>Explicación:</b> ${e.r}</p>`;
        } else {
          detalle = `<p class="fb"><span class="veredicto no">${p.respuesta === null ? 'Sin responder.' : 'Marcaste que no la sabías.'}</span></p><div class="resultado"><b>Respuesta:</b> ${e.r}</div>`;
        }
        return `<article class="ej"><p class="origen ui" style="font-size:13px;color:var(--muted);margin:0 0 6px">${esc(p.curso)} · ${p.temaTitulo}</p>
          <div class="enun">${e.q}</div>${detalle}<p class="ui" style="margin:10px 0 0;font-size:14px"><a href="#/curso/${esc(p.slug)}/${p.tema}">Repasar este tema →</a></p></article>`;
      }).join('');

      app.innerHTML = `<main class="idx">
        <section class="hero"><p class="migas ui"><a href="#/examen">Modo examen</a></p>
          <p class="puntaje">${pct} %</p>
          <p class="lead">${correctas} de ${preguntas.length} correctas${sinResponder ? `, ${sinResponder} sin responder` : ''}. Tiempo: ${mmss(usados)}${limite && usados >= limite ? ' (se acabó el tiempo)' : ''}.${falladas.length ? ` ${falladas.length} ${falladas.length === 1 ? 'pregunta pasó' : 'preguntas pasaron'} al <a href="#/repaso">cuaderno de errores</a>.` : ''}</p>
          ${barraHTML(pct)}
          <div class="acciones"><button class="btn btn-primario" type="button" id="ex-otra">Otro examen igual</button><button class="btn" type="button" id="ex-config">Cambiar configuración</button><a class="btn" href="#/oral?${ambito.valor.startsWith('cursos:') ? `cursos=${ambito.valor.slice(7)}` : ambito.valor.startsWith('bloque:') ? `area=${ambito.valor.split(':')[1]}&bloque=${ambito.valor.split(':')[2]}` : `area=${ambito.valor.split(':')[1]}`}">Explicar temas en voz alta</a></div>
          <p class="ui" style="color:var(--muted);font-size:13px">${esc(ambito.etiqueta)}</p>
        </section>
        ${tablaTemas}
        ${repaso ? `<section class="repaso"><h2 class="ui">Para repasar</h2>${repaso}</section>` : '<p class="lead">¡Todas correctas! Prueba con más preguntas o con otro bloque.</p>'}
      </main>`;
      app.querySelector('#ex-otra').addEventListener('click', () => { terminado = false; comenzar(); });
      app.querySelector('#ex-config').addEventListener('click', pantallaConfig);
      formulas(app);
      window.scrollTo(0, 0);
    }

    mostrar();
  }

  if (!opciones.length) {
    app.innerHTML = '<main class="idx"><section class="hero"><h1>Modo examen</h1><p class="lead">Todavía no hay guías publicadas.</p></section></main>';
    return {};
  }
  pantallaConfig();
  return { limpiar: detener };
}
