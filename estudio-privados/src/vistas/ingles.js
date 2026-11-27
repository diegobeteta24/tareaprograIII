// Inglés para el examen de ubicación (100 preguntas de opción múltiple + entrevista; inglés británico).
//   #/ingles                portada: temas, EF SET, simulacros
//   #/ingles/tema/:id       mini lección y práctica del tema
//   #/ingles/rutina         rutina diaria de 45 minutos
//   #/ingles/simulacro      100 preguntas con reloj
//   #/ingles/entrevista     entrevista oral con reloj y grabación
//   #/ingles/dictado        dictado con voz británica
import { cargarIngles, cargarExtras, cargarPersonal, cargarPlan } from '../datos.js';
import { leerJSON, guardarJSON } from '../progreso.js';
import { registrar, semanaDe, faseDe } from '../plan.js';
import { hoy, conAnio } from '../fechas.js';
import { esc, barra, barraHTML, pct, hm, aviso, barajar, opcionesBarajadas, LETRAS, cuentaAtras } from '../ui.js';
import { stats, resumenTema, ordenarPorNecesidad, montarPreguntas, montarDictado, montarEntrevista, anotar, hayVoz } from '../ingles/piezas.js';
import { puedeGrabar } from '../grabadora.js';

const GRUPOS = [['gramatica', 'Gramática'], ['vocabulario', 'Vocabulario'], ['britanico', 'Inglés británico'], ['lectura', 'Lectura']];
const NIVELES = ['A2', 'B1', 'B2', 'C1'];
const K_EFSET = 'ingles-efset';
const K_SIM = 'ingles-simulacros';

/** Suma minutos de inglés a la semana o etapa del plan en que cae hoy. */
async function sumarAlPlan(min) {
  const plan = await cargarPlan();
  const s = semanaDe(plan) || faseDe(plan);
  registrar({ sem: s?.id || 'extra', clave: 'ingles', min, nombre: 'Inglés' });
  window.dispatchEvent(new CustomEvent('plan-cambio'));
  aviso(`Se sumaron ${hm(min)} de inglés${s ? ` (${s.id})` : ''}.`);
}

function botonPlan(min) {
  return `<button class="btn" type="button" data-sumar="${min}">Sumar ${hm(min)} de inglés al plan</button>`;
}
function conectarPlan(raiz) {
  raiz.querySelectorAll('[data-sumar]').forEach((b) => b.addEventListener('click', () => { sumarAlPlan(+b.dataset.sumar); b.disabled = true; }));
}

// ---------- Portada ----------
async function portada(app) {
  const [b, personal] = await Promise.all([cargarIngles(), cargarPersonal()]);
  const s = stats();
  const base = personal.ingles?.efsetBase ?? null;
  const meta = personal.ingles?.efsetMeta ?? 61;
  const efset = leerJSON(K_EFSET, []) || [];
  const sims = (leerJSON(K_SIM, []) || []).slice(0, 6);
  const grupos = GRUPOS.map(([g, nombre]) => {
    const temas = b.temas.filter((t) => t.grupo === g);
    if (!temas.length) return '';
    return `<section class="bloque"><h2>${nombre}</h2><ul class="cursos ui">${temas.map((t) => {
      const r = resumenTema(t, s);
      return `<li><a class="nom" href="#/ingles/tema/${esc(t.id)}" lang="en">${esc(t.titulo)}</a><span class="det">${t.todas.length} preguntas</span>
        <span class="estado ${r.vistas ? 'ok' : 'pend'}">${r.vistas ? `${pct(r.ok, r.intentos)} % · ${r.vistas}/${r.total} vistas` : 'sin practicar'}</span></li>`;
    }).join('')}</ul></section>`;
  }).join('');
  const ultimo = efset[0];
  app.innerHTML = `<main class="idx">
    <section class="hero"><h1>Inglés</h1>
      <p class="lead">Examen de ubicación de la Escuela de Idiomas: unas 100 preguntas de opción múltiple y una entrevista por videollamada, con cámara y un espejo detrás; se promedian y manejan inglés británico. Cada nivel que subas en la ubicación ahorra un mes de curso.</p>
      <div class="cifras"><span><b>${b.total}</b> preguntas en ${b.temas.length} temas</span><span>EF SET: <b>${ultimo ? ultimo.puntaje : '—'}</b>${base != null ? ` (línea base ${base})` : ''}, meta ${meta}</span></div>
      <div class="acciones"><a class="btn btn-primario" href="#/ingles/rutina">Rutina diaria (45 min)</a><a class="btn" href="#/ingles/simulacro">Simulacro de 100 preguntas</a><a class="btn" href="#/ingles/entrevista">Entrevista</a><a class="btn" href="#/ingles/dictado">Dictado</a></div>
    </section>
    ${b.total ? '' : '<p class="aviso-guia ui">El banco de preguntas está vacío: agrega archivos en <code>contenido/ingles/</code> y vuelve a ejecutar <code>npm run dev</code>.</p>'}
    ${grupos}
    <section class="bloque"><h2>EF SET</h2><p class="sem ui">Prueba gratuita en efset.org. Repítela en la semana del 18 de enero para medir el avance.</p>
      <form class="form-examen ui form-linea" id="f-efset"><label>Fecha<input type="date" name="fecha" value="${hoy()}" required></label><label>Puntaje (0 a 100)<input type="number" name="puntaje" min="0" max="100" required></label><button class="btn btn-primario" type="submit">Anotar</button></form>
      ${efset.length ? `<ul class="historial">${efset.map((e, i) => `<li>${conAnio(e.fecha)} · <b>${e.puntaje}</b>${i < efset.length - 1 ? ` (${e.puntaje - efset[i + 1].puntaje >= 0 ? '+' : ''}${e.puntaje - efset[i + 1].puntaje})` : ''} <button class="enlace" type="button" data-borrar="${i}">Borrar</button></li>`).join('')}</ul>` : ''}</section>
    ${sims.length ? `<section class="bloque"><h2>Simulacros</h2><ul class="historial">${sims.map((x) => `<li>${new Date(x.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })} · <b>${x.ok}/${x.total}</b> (${pct(x.ok, x.total)} %) · ${hm(x.min)}${x.porNivel ? ` · ${NIVELES.filter((n) => x.porNivel[n]).map((n) => `${n} ${pct(x.porNivel[n].ok, x.porNivel[n].n)} %`).join(', ')}` : ''}</li>`).join('')}</ul></section>` : ''}
    <footer><p>Las preguntas de este banco son de práctica, escritas para esta adaptación siguiendo el formato del examen; no son del examen real.</p></footer>
  </main>`;
  app.querySelector('#f-efset').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const lista = leerJSON(K_EFSET, []) || [];
    lista.push({ fecha: f.fecha.value, puntaje: +f.puntaje.value });
    lista.sort((x, y) => y.fecha.localeCompare(x.fecha));
    guardarJSON(K_EFSET, lista);
    portada(app);
  });
  app.querySelectorAll('[data-borrar]').forEach((x) => x.addEventListener('click', () => {
    const lista = leerJSON(K_EFSET, []) || [];
    lista.splice(+x.dataset.borrar, 1);
    guardarJSON(K_EFSET, lista);
    portada(app);
  }));
}

// ---------- Tema ----------
async function vistaTema(app, id) {
  const b = await cargarIngles();
  const t = b.tema(id);
  if (!t) throw Object.assign(new Error('Tema no encontrado'), { noEncontrada: true });
  document.title = `${t.titulo} | Inglés`;
  barra({ titulo: 'Inglés' });
  const lectura = t.grupo === 'lectura';
  const r = resumenTema(t);
  app.innerHTML = `<main class="idx">
    <p class="migas ui"><a href="#/ingles">Inglés</a></p>
    <section class="hero"><h1 lang="en">${esc(t.titulo)}</h1>
      <p class="meta ui">${GRUPOS.find(([g]) => g === t.grupo)?.[1] || ''} · ${t.todas.length} preguntas${r.vistas ? ` · ${pct(r.ok, r.intentos)} % de aciertos` : ''}</p>
      <h2 class="ui">${lectura ? 'Cómo contestar' : 'Mini lección'}</h2><ul class="resumen">${t.resumen.map((x) => `<li>${x}</li>`).join('')}</ul>
      ${lectura ? '' : '<div class="acciones"><button class="btn btn-primario" type="button" id="t-12">Practicar 12</button><button class="btn" type="button" id="t-todas">Todas las del tema</button></div>'}
    </section>
    <div id="t-zona">${lectura ? `<ul class="cursos ui">${t.textos.map((x) => `<li><span class="nom" lang="en">${esc(x.titulo)}</span><span class="det">${esc(x.nv)} · ${x.preguntas.length} preguntas</span><button class="btn" type="button" data-texto="${esc(x.id)}">Leer y contestar</button></li>`).join('')}</ul>` : ''}</div>
  </main>`;
  const zona = app.querySelector('#t-zona');
  const enc = (k, n) => `<div class="examen-cab ui"><span>Pregunta ${k + 1} de ${n}</span>${barraHTML(pct(k, n))}</div>`;
  const final = (res) => {
    const bien = res.filter((x) => x.ok).length;
    zona.innerHTML = `<section class="bloque sin-margen"><h2>${bien} de ${res.length}</h2><p class="lead">${bien < res.length ? 'Lo que fallaste quedó en el cuaderno de errores para mañana.' : 'Todas bien.'}</p>
      <div class="acciones"><button class="btn btn-primario" type="button" id="t-otra">Otra ronda</button><a class="btn" href="#/ingles">Volver a Inglés</a></div></section>`;
    zona.querySelector('#t-otra').addEventListener('click', () => practicar(12));
    zona.scrollIntoView();
  };
  const practicar = (n) => {
    const lista = ordenarPorNecesidad(t.todas).slice(0, n).sort((a, b2) => NIVELES.indexOf(a.nv) - NIVELES.indexOf(b2.nv));
    montarPreguntas(zona, lista, { etiqueta: () => `Inglés · ${t.titulo}`, encabezado: enc, alTerminar: final });
    zona.scrollIntoView();
  };
  app.querySelector('#t-12')?.addEventListener('click', () => practicar(12));
  app.querySelector('#t-todas')?.addEventListener('click', () => practicar(t.todas.length));
  zona.addEventListener('click', (ev) => {
    const bt = ev.target.closest('[data-texto]');
    if (!bt) return;
    const x = t.textos.find((y) => y.id === bt.dataset.texto);
    const pregs = x.preguntas.map((p) => ({ ...p, tema: t.id }));
    montarPreguntas(zona, pregs, { etiqueta: () => `Inglés · ${x.titulo}`, textoDe: () => x, encabezado: enc, alTerminar: final });
    zona.scrollIntoView();
  });
  return {};
}

// ---------- Rutina diaria ----------
async function vistaRutina(app) {
  const [b, extras] = await Promise.all([cargarIngles(), cargarExtras()]);
  document.title = 'Rutina | Inglés';
  barra({ titulo: 'Rutina de inglés' });
  const inicio = Date.now();
  let limpiar = () => {};
  let reloj = null;
  const pasos = [
    { id: 'gramatica', titulo: 'Gramática y uso', min: 25, nota: 'Preguntas de los temas que más necesitas, con la explicación de cada una.' },
    { id: 'hablar', titulo: 'Hablar en voz alta', min: 10, nota: 'Preguntas de la entrevista con reloj; grábate y escúchate.' },
    { id: 'escuchar', titulo: 'Listening', min: 10, nota: 'Dictado con voz británica: escribe lo que oyes.' },
  ];
  let paso = 0;

  function marco(contenido) {
    const p = pasos[paso];
    app.innerHTML = `<main class="idx">
      <p class="migas ui"><a href="#/ingles">Inglés</a></p>
      <div class="pasos-rutina ui">${pasos.map((x, i) => `<span class="${i === paso ? 'actual' : i < paso ? 'hecho' : ''}">${i + 1}. ${esc(x.titulo)} · ${x.min} min</span>`).join('')}</div>
      <div class="examen-cab ui"><span>${esc(p.titulo)}</span><span class="reloj" id="r-reloj" role="timer" aria-live="off"></span><button class="btn" type="button" id="r-saltar">${paso + 1 < pasos.length ? 'Pasar al siguiente' : 'Terminar'}</button></div>
      <p class="ui det">${esc(p.nota)} El reloj es una guía: al llegar a cero, termina la pregunta en curso y pasa al siguiente paso.</p>
      <div id="r-zona">${contenido || ''}</div></main>`;
    reloj?.detener();
    reloj = cuentaAtras(app.querySelector('#r-reloj'), p.min * 60, () => aviso(`Se acabó el tiempo de ${p.titulo.toLowerCase()}.`));
    app.querySelector('#r-saltar').addEventListener('click', siguiente);
    return app.querySelector('#r-zona');
  }

  function siguiente() {
    limpiar(); limpiar = () => {};
    paso++;
    if (paso >= pasos.length) return fin();
    correr();
  }

  function correr() {
    const p = pasos[paso];
    const zona = marco();
    if (p.id === 'gramatica') {
      // Los temas con menos aciertos primero; 15 preguntas, sin lectura
      const s = stats();
      const temas = b.temas.filter((t) => t.grupo !== 'lectura');
      if (!temas.length) { zona.innerHTML = '<p class="ui det">El banco de inglés está vacío.</p>'; return; }
      const puntaje = (t) => { const r = resumenTema(t, s); return r.intentos ? r.ok / r.intentos + r.vistas / r.total / 10 : -1 + Math.random() / 10; };
      const elegidos = [...temas].sort((x, y) => puntaje(x) - puntaje(y)).slice(0, 5);
      const lista = barajar(elegidos.flatMap((t) => ordenarPorNecesidad(t.todas, s).slice(0, 3).map((q) => ({ ...q, temaTitulo: t.titulo })))).slice(0, 15);
      montarPreguntas(zona, lista, {
        etiqueta: (q) => `Inglés · ${q.temaTitulo}`,
        encabezado: (k, n) => `<p class="origen ui">Pregunta ${k + 1} de ${n} · temas: ${elegidos.map((t) => esc(t.titulo)).join(', ')}</p>`,
        alTerminar: (res) => { zona.innerHTML = `<p class="lead">${res.filter((x) => x.ok).length} de ${res.length} bien.</p><div class="acciones"><button class="btn btn-primario" type="button" id="r-sig">Siguiente paso: hablar</button></div>`; zona.querySelector('#r-sig').addEventListener('click', siguiente); },
      });
    } else if (p.id === 'hablar') {
      zona.innerHTML = `<label class="check ui">${puedeGrabar() ? '<input type="checkbox" id="r-grabar"> Grabarme (pide permiso del micrófono; el audio no se guarda)' : 'Este navegador no permite grabar: habla igual en voz alta.'}</label><div id="r-ent"></div>`;
      const arrancar = () => {
        const e = montarEntrevista(zona.querySelector('#r-ent'), extras.entrevista, { grabarAudio: !!zona.querySelector('#r-grabar')?.checked, alTerminar: () => siguiente() });
        limpiar = e.limpiar;
      };
      zona.querySelector('#r-grabar')?.addEventListener('change', arrancar);
      arrancar();
    } else {
      const d = montarDictado(zona, extras.dictado.oraciones, { n: 8, alTerminar: () => zona.insertAdjacentHTML('beforeend', '<div class="acciones"><button class="btn btn-primario" type="button" id="r-fin">Terminar la rutina</button></div>') || zona.querySelector('#r-fin').addEventListener('click', siguiente) });
      limpiar = d.limpiar;
    }
  }

  function fin() {
    reloj?.detener();
    const min = Math.max(1, Math.round((Date.now() - inicio) / 60000));
    app.innerHTML = `<main class="idx"><section class="hero"><h1>Rutina terminada</h1><p class="lead">${hm(min)} de inglés.</p>
      <div class="acciones">${botonPlan(min)}<a class="btn btn-primario" href="#/">Volver a Hoy</a></div>
      <p class="ui det">Si usaste el cronómetro de arriba, no sumes el tiempo otra vez.</p></section></main>`;
    conectarPlan(app);
  }

  correr();
  return { limpiar: () => { limpiar(); reloj?.detener(); } };
}

// ---------- Simulacro de 100 preguntas ----------
function armarSimulacro(b, n = 100) {
  const lectura = b.temas.filter((t) => t.grupo === 'lectura').flatMap((t) => t.textos);
  const textos = barajar([...lectura]).slice(0, n >= 60 ? 2 : 1);
  const deLectura = textos.flatMap((x) => x.preguntas.map((p) => ({ ...p, tema: x.tema, textoId: x.id })));
  const resto = n - deLectura.length;
  // Reparto por turnos entre temas para que todos aparezcan
  const colas = barajar(b.temas.filter((t) => t.grupo !== 'lectura').map((t) => barajar([...t.todas])));
  const sueltas = [];
  while (sueltas.length < resto && colas.some((c) => c.length)) for (const c of colas) if (c.length && sueltas.length < resto) sueltas.push(c.pop());
  sueltas.sort((x, y) => NIVELES.indexOf(x.nv) - NIVELES.indexOf(y.nv));
  return { preguntas: [...sueltas, ...deLectura], textos };
}

async function vistaSimulacro(app) {
  const b = await cargarIngles();
  document.title = 'Simulacro | Inglés';
  barra({ titulo: 'Simulacro de inglés' });
  let reloj = null;

  function config() {
    app.innerHTML = `<main class="idx"><p class="migas ui"><a href="#/ingles">Inglés</a></p>
      <section class="hero"><h1>Simulacro</h1><p class="lead">Como el examen de ubicación: preguntas de opción múltiple de fácil a difícil, sin ver las respuestas hasta el final. Haz uno cada domingo con reloj y cuaderno de errores. Lo que falles pasa al cuaderno.</p></section>
      <form class="form-examen ui" id="f-sim">
        <label>Preguntas<select name="n">${[25, 50, 100].map((n) => `<option${n === 100 ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>Tiempo<select name="min">${[[45, '45 minutos'], [60, '1 hora'], [75, '1 hora y 15 minutos'], [90, '1 hora y media'], [0, 'Sin límite']].map(([v, t]) => `<option value="${v}"${v === 75 ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <p class="ayuda">Hay ${b.total} preguntas en el banco. Si escoges menos de 100, el tiempo se ajusta en proporción.</p>
        <p><button class="btn btn-primario" type="submit"${b.total ? '' : ' disabled'}>Empezar</button></p></form></main>`;
    app.querySelector('#f-sim').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const n = +ev.target.n.value, min = +ev.target.min.value;
      correr(n, min ? Math.round((min * n) / 100) : 0);
    });
  }

  function correr(n, minutos) {
    const { preguntas, textos } = armarSimulacro(b, n);
    const items = preguntas.map((p) => ({ p, ops: opcionesBarajadas(p.a, p.d), resp: null }));
    const inicio = Date.now();
    let k = 0, terminado = false;
    app.innerHTML = `<main class="idx"><div class="examen-cab ui"><span id="s-num"></span><span class="barra" aria-hidden="true"><i></i></span>${minutos ? '<span class="reloj" id="s-reloj" role="timer" aria-live="off"></span>' : ''}<button class="btn" type="button" id="s-fin">Terminar</button></div><div id="s-q"></div></main>`;
    const elQ = app.querySelector('#s-q');
    if (minutos) reloj = cuentaAtras(app.querySelector('#s-reloj'), minutos * 60, () => terminar());
    app.querySelector('#s-fin').addEventListener('click', () => {
      const faltan = items.filter((x) => x.resp === null).length;
      if (!faltan || confirm(`Quedan ${faltan} sin responder. ¿Terminar?`)) terminar();
    });
    const mostrar = () => {
      const it = items[k];
      const texto = it.p.textoId ? textos.find((x) => x.id === it.p.textoId) : null;
      app.querySelector('#s-num').textContent = `Pregunta ${k + 1} de ${items.length}`;
      app.querySelector('.examen-cab .barra i').style.width = `${pct(k, items.length)}%`;
      elQ.innerHTML = `<article class="ej examen-q">
        ${texto ? `<details class="lectura" open><summary class="ui">${esc(texto.titulo)}</summary><div lang="en">${texto.texto.map((x) => `<p>${esc(x)}</p>`).join('')}</div></details>` : ''}
        <div class="enun en" lang="en">${it.p.q}</div>
        <div class="ops">${it.ops.map((o, i) => `<button type="button" class="op${it.resp === i ? ' elegida' : ''}" data-i="${i}" aria-pressed="${it.resp === i}" lang="en"><b>${LETRAS[i]})</b> ${o.texto}</button>`).join('')}</div>
        <div class="acciones"><button class="btn" type="button" id="s-ant"${k ? '' : ' disabled'}>Anterior</button><button class="btn btn-primario" type="button" id="s-sig">${k + 1 < items.length ? 'Siguiente' : 'Ver resultado'}</button></div></article>`;
      elQ.querySelector('.ops').addEventListener('click', (ev) => {
        const bt = ev.target.closest('.op');
        if (!bt) return;
        it.resp = +bt.dataset.i;
        elQ.querySelectorAll('.op').forEach((o) => { const s = o === bt; o.classList.toggle('elegida', s); o.setAttribute('aria-pressed', s); });
      });
      elQ.querySelector('#s-ant').addEventListener('click', () => { k--; mostrar(); });
      elQ.querySelector('#s-sig').addEventListener('click', () => { if (k + 1 < items.length) { k++; mostrar(); } else terminar(); });
      (elQ.querySelector('.op.elegida') || elQ.querySelector('.op'))?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    };

    function terminar() {
      if (terminado) return;
      terminado = true;
      reloj?.detener();
      const min = Math.max(1, Math.round((Date.now() - inicio) / 60000));
      const ok = (it) => it.resp !== null && it.ops[it.resp].correcta;
      const porNivel = {}, porTema = {};
      for (const it of items) {
        const bien = ok(it);
        porNivel[it.p.nv] ??= { ok: 0, n: 0 }; porNivel[it.p.nv].n++; if (bien) porNivel[it.p.nv].ok++;
        porTema[it.p.tema] ??= { ok: 0, n: 0 }; porTema[it.p.tema].n++; if (bien) porTema[it.p.tema].ok++;
        if (it.resp !== null) anotar(it.p, bien, `Inglés · simulacro`);
      }
      const total = items.filter(ok).length;
      const hist = leerJSON(K_SIM, []) || [];
      hist.unshift({ fecha: Date.now(), total: items.length, ok: total, min, porNivel });
      guardarJSON(K_SIM, hist.slice(0, 30));
      window.dispatchEvent(new CustomEvent('repaso-cambio'));
      const temas = Object.entries(porTema).map(([id, v]) => ({ t: b.tema(id), ...v })).sort((x, y) => x.ok / x.n - y.ok / y.n);
      const errores = items.filter((it) => !ok(it));
      app.innerHTML = `<main class="idx"><section class="hero"><p class="migas ui"><a href="#/ingles">Inglés</a></p>
        <p class="puntaje">${pct(total, items.length)} %</p><p class="lead">${total} de ${items.length} bien en ${hm(min)}.</p>${barraHTML(pct(total, items.length))}
        <div class="cajas ui">${NIVELES.filter((nv) => porNivel[nv]).map((nv) => `<span><b>${pct(porNivel[nv].ok, porNivel[nv].n)} %</b> ${nv}<small>${porNivel[nv].ok}/${porNivel[nv].n}</small></span>`).join('')}</div>
        <p class="ui det">Aciertos por nivel del Marco Común Europeo, como orientación: no es la escala de niveles de la Escuela de Idiomas.</p>
        <div class="acciones">${botonPlan(min)}<a class="btn btn-primario" href="#/repaso">Repasar los errores</a></div></section>
        <section class="bloque sin-margen"><h2>Por tema, del más débil al más fuerte</h2><ul class="rubros ui">${temas.map((x) => `<li><a class="nom" href="#/ingles/tema/${esc(x.t?.id || '')}" lang="en">${esc(x.t?.titulo || '')}</a><span class="det">${x.ok}/${x.n}</span></li>`).join('')}</ul></section>
        ${errores.length ? `<section class="repaso"><h2 class="ui">Errores</h2>${errores.map((it) => `<article class="ej"><p class="origen ui">${esc(it.p.nv)} · ${esc(b.tema(it.p.tema)?.titulo || '')}</p><div class="enun en" lang="en">${it.p.q}</div>
          <p class="fb"><span class="veredicto no">${it.resp === null ? 'Sin responder.' : `Elegiste: <span lang="en">${it.ops[it.resp].texto}</span>.`}</span> Correcta: <b lang="en">${it.p.a}</b></p><p class="finalidad"><b>Explicación:</b> ${it.p.x}</p></article>`).join('')}</section>` : ''}
      </main>`;
      conectarPlan(app);
      window.scrollTo(0, 0);
    }
    mostrar();
  }

  config();
  return { limpiar: () => reloj?.detener() };
}

// ---------- Entrevista y dictado sueltos ----------
async function vistaEntrevista(app) {
  const { entrevista } = await cargarExtras();
  document.title = 'Entrevista | Inglés';
  barra({ titulo: 'Entrevista de inglés' });
  let actual = null;
  app.innerHTML = `<main class="idx"><p class="migas ui"><a href="#/ingles">Inglés</a></p>
    <section class="hero"><h1>Entrevista</h1><p class="lead">${esc(entrevista.formato)}</p>
      <ul class="resumen">${entrevista.preparacion.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <form class="form-examen ui form-linea" id="f-ent"><label>Tema<select name="cat"><option value="">Al azar</option>${entrevista.categorias.map((c) => `<option value="${esc(c.id)}">${esc(c.titulo)}</option>`).join('')}</select></label>
        ${puedeGrabar() ? '<label class="check"><input type="checkbox" name="grabar"> Grabarme</label>' : ''}<button class="btn btn-primario" type="submit">Empezar</button></form></section>
    <div id="ent-zona"></div>
    <section class="bloque"><h2>Frases útiles</h2>${entrevista.frases.map((f) => `<h3 class="ui">${esc(f.para)}</h3><ul class="frases" lang="en">${f.en.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}</section>
  </main>`;
  app.querySelector('#f-ent').addEventListener('submit', (ev) => {
    ev.preventDefault();
    actual?.limpiar();
    actual = montarEntrevista(app.querySelector('#ent-zona'), entrevista, { categoria: ev.target.cat.value, grabarAudio: !!ev.target.grabar?.checked });
    app.querySelector('#ent-zona').scrollIntoView();
  });
  return { limpiar: () => actual?.limpiar() };
}

async function vistaDictado(app) {
  const { dictado } = await cargarExtras();
  document.title = 'Dictado | Inglés';
  barra({ titulo: 'Dictado' });
  app.innerHTML = `<main class="idx"><p class="migas ui"><a href="#/ingles">Inglés</a></p>
    <section class="hero"><h1>Dictado</h1><p class="lead">Escucha cada oración con voz británica y escríbela. Sirve para el listening y para la ortografía británica. ${hayVoz() ? '' : 'Este navegador no tiene síntesis de voz.'}</p>
    <p class="ui det">La voz depende de tu sistema: en Windows y Android suele haber una voz «English (United Kingdom)»; si no aparece, instálala en la configuración de voz del sistema.</p></section>
    <div id="dic-zona"></div></main>`;
  const zona = app.querySelector('#dic-zona');
  const ronda = () => montarDictado(zona, dictado.oraciones, { n: 10, alTerminar: () => { zona.insertAdjacentHTML('beforeend', '<div class="acciones"><button class="btn btn-primario" type="button" id="dic-otra">Otra ronda</button></div>'); zona.querySelector('#dic-otra')?.addEventListener('click', () => { d = ronda(); }); } });
  let d = ronda();
  return { limpiar: () => d.limpiar() };
}

export default async function vistaIngles(app, [sub, id]) {
  document.title = 'Inglés | Inge 2028';
  barra({ titulo: 'Inglés' });
  if (sub === 'tema') return vistaTema(app, id);
  if (sub === 'rutina') return vistaRutina(app);
  if (sub === 'simulacro') return vistaSimulacro(app);
  if (sub === 'entrevista') return vistaEntrevista(app);
  if (sub === 'dictado') return vistaDictado(app);
  if (sub) throw Object.assign(new Error('Sección no encontrada'), { noEncontrada: true });
  await portada(app);
  return {};
}

