// Fundamentos sin calculadora: las sesiones de S0 con sus videos y un practicador con ejercicios
// generados al azar (src/fundamentos/generadores.js), revisión inmediata y solución paso a paso.
//   #/fundamentos[?sesion=f2]                     sesiones y temas
//   #/fundamentos/practica?sesion=f2              15 ejercicios de la sesión, de fácil a difícil
//   #/fundamentos/practica?tema=fracciones[&nivel=2&n=10]
import { cargarPlan } from '../datos.js';
import { TEMAS, temaDe, generar, revisar } from '../fundamentos/generadores.js';
import { leerJSON, guardarJSON } from '../progreso.js';
import { registrar, semanaDe } from '../plan.js';
import { hoy, corto } from '../fechas.js';
import { formulas } from '../katex.js';
import { esc, barra, barraHTML, pct, hm, aviso, LETRAS } from '../ui.js';

const CLAVE = 'fund-stats';
const stats = () => leerJSON(CLAVE, {}) || {};
function anotar(tema, ok) {
  const s = stats();
  const t = s[tema] || { n: 0, ok: 0 };
  t.n++; if (ok) t.ok++;
  t.ultimo = hoy();
  s[tema] = t;
  guardarJSON(CLAVE, s);
}

function htmlVideo(v) {
  return `<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.t)}</a>${v.canal ? ` <span class="det">· ${esc(v.canal)}</span>` : ''}${v.dur ? ` <span class="det">· ${esc(v.dur)}</span>` : ''}</li>`;
}

function portada(app, fund, q) {
  const s = stats();
  const abierta = q.get('sesion');
  const fecha = hoy();
  const sesiones = fund.sesiones.map((x) => {
    const temas = x.temas.map((id) => {
      const t = temaDe(id), e = s[id];
      return `<li><span class="nom">${esc(t?.titulo || id)}</span><span class="det">${e ? `${e.ok}/${e.n} bien (${pct(e.ok, e.n)} %)` : 'sin practicar'}</span>
        <a class="btn" href="#/fundamentos/practica?tema=${esc(id)}">Practicar</a></li>`;
    }).join('');
    const estado = x.fecha === fecha ? ' · <b>hoy</b>' : x.fecha < fecha ? '' : '';
    return `<details class="semana${x.fecha === fecha ? ' actual' : ''}" id="${esc(x.id)}"${abierta === x.id || (!abierta && x.fecha === fecha) ? ' open' : ''}>
      <summary class="ui"><span class="sid">${corto(x.fecha)}</span><span class="stit">${esc(x.titulo)}</span><span class="sfecha">1 hora${estado}</span></summary>
      <div class="sub">
        <p class="ui det">${esc(x.reparto)}${x.lectura ? ` ${esc(x.lectura)}` : ''}</p>
        <p class="acciones"><a class="btn btn-primario" href="#/fundamentos/practica?sesion=${esc(x.id)}">Practicar 15 ejercicios de esta sesión</a></p>
        <ul class="rubros ui">${temas}</ul>
        <h3>Videos, en este orden</h3><ol class="videos ui">${x.videos.map(htmlVideo).join('')}</ol>
        ${x.reserva?.length ? `<p class="ui det">De reserva, solo si sobra tiempo:</p><ul class="videos ui">${x.reserva.map(htmlVideo).join('')}</ul>` : ''}
      </div></details>`;
  }).join('');
  const temasSueltos = TEMAS.map((t) => {
    const e = s[t.id];
    return `<li><a class="nom" href="#/fundamentos/practica?tema=${t.id}">${esc(t.titulo)}</a><span class="det">${e ? `${pct(e.ok, e.n)} % de ${e.n}` : '—'}</span></li>`;
  }).join('');
  const total = Object.values(s).reduce((a, x) => ({ n: a.n + x.n, ok: a.ok + x.ok }), { n: 0, ok: 0 });

  app.innerHTML = `<main class="idx">
    <p class="migas ui"><a href="#/">Hoy</a></p>
    <section class="hero"><h1>${esc(fund.titulo)}</h1>
      <p class="lead">${esc(fund.descripcion)}</p>
      <p class="ui det">${esc(fund.regla)}</p>
      ${total.n ? `<div class="cifras"><span><b>${total.n}</b> ejercicios resueltos</span><span><b>${pct(total.ok, total.n)} %</b> bien</span></div>` : ''}
      <p class="ui det">Material: ${fund.material.map((m) => `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.t)}</a>`).join(' · ')}</p>
    </section>
    <section class="bloque sin-margen"><h2>Las cinco sesiones</h2>${sesiones}</section>
    <section class="bloque"><h2>Practicar un tema</h2><p class="sem ui">Cada vez salen ejercicios nuevos. Los números del enunciado se escogen para que el resultado salga exacto: si te da un decimal largo, revisa el procedimiento.</p>
      <ul class="cursos ui temas-fund">${temasSueltos}</ul></section>
    <footer><p>Escribe las respuestas como enteros, decimales o fracciones (<code>3/4</code>, <code>-2</code>, <code>0.25</code>). No hace falta simplificar para que cuente, pero te lo va a recordar.</p></footer>
  </main>`;
  if (abierta) document.getElementById(abierta)?.scrollIntoView();
}

function practica(app, fund, q) {
  // Lista de ejercicios
  const sesion = fund.sesiones.find((x) => x.id === q.get('sesion'));
  const tema = temaDe(q.get('tema'));
  let lista, titulo;
  if (sesion) {
    titulo = sesion.titulo;
    lista = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3].map((nv, k) => ({ tema: sesion.temas[k % sesion.temas.length], nv }));
  } else if (tema) {
    titulo = tema.titulo;
    const n = Math.min(30, Math.max(3, +q.get('n') || 10));
    const fijo = +q.get('nivel');
    lista = Array.from({ length: n }, (_, k) => ({ tema: tema.id, nv: fijo || 1 + Math.floor((3 * k) / n) }));
  } else {
    throw Object.assign(new Error('Elige una sesión o un tema'), { noEncontrada: true });
  }
  document.title = `${titulo} | Fundamentos`;
  barra({ titulo: 'Fundamentos' });

  const inicio = Date.now();
  const resultados = [];
  let k = 0, ej = null, respondida = false;

  function mostrar() {
    const item = lista[k];
    ej = generar(item.tema, item.nv);
    respondida = false;
    const t = temaDe(item.tema);
    const entrada = ej.ops
      ? `<div class="ops">${ej.ops.map((o, i) => `<button type="button" class="op" data-i="${i}"><b>${LETRAS[i]})</b> ${o}</button>`).join('')}</div>`
      : `<div class="campos">${ej.campos.map((c, i) => `<label class="campo"><span>${c.antes || ''}</span><input type="text" inputmode="text" autocomplete="off" spellcheck="false" data-i="${i}" aria-label="Respuesta ${ej.campos.length > 1 ? i + 1 : ''}"><span>${c.despues || ''}</span></label>`).join('')}</div>`;
    app.innerHTML = `<main class="idx">
      <div class="examen-cab ui"><span>Ejercicio ${k + 1} de ${lista.length}</span>${barraHTML(pct(k, lista.length))}<a class="btn" href="#/fundamentos${sesion ? `?sesion=${sesion.id}` : ''}">Salir</a></div>
      <article class="ej examen-q fund">
        <p class="origen">${esc(t.titulo)} · nivel ${item.nv} de 3</p>
        <div class="enun grande">${ej.q}</div>
        <form id="f-resp">${entrada}
          <div class="acciones">${ej.ops ? '' : '<button class="btn btn-primario" type="submit">Comprobar</button>'}<button class="btn" type="button" id="f-ver">No sé: ver la solución</button></div>
        </form>
        <div id="f-fb" aria-live="polite"></div>
      </article></main>`;
    formulas(app);
    const form = app.querySelector('#f-resp');
    form.addEventListener('submit', (ev) => { ev.preventDefault(); comprobar(); });
    app.querySelector('#f-ver').addEventListener('click', () => calificar(false, true));
    app.querySelector('.ops')?.addEventListener('click', (ev) => {
      const b = ev.target.closest('.op');
      if (!b || respondida) return;
      app.querySelectorAll('.op').forEach((o) => { o.disabled = true; if (+o.dataset.i === ej.ok) o.classList.add('bien'); });
      const ok = +b.dataset.i === ej.ok;
      if (!ok) b.classList.add('mal');
      calificar(ok);
    });
    (app.querySelector('.campos input') || app.querySelector('.op'))?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function comprobar() {
    if (respondida) return;
    const valores = [...app.querySelectorAll('.campos input')].map((x) => x.value);
    const r = revisar(ej, valores);
    const fb = app.querySelector('#f-fb');
    if (r.invalida) {
      fb.innerHTML = '<p class="veredicto no ui">Escribe un número en cada casilla: entero, decimal o fracción como <code>3/4</code>.</p>';
      return;
    }
    calificar(r.ok, false, r.simplificar);
  }

  function calificar(ok, sinIntento = false, simplificar = false) {
    if (respondida) return;
    respondida = true;
    anotar(lista[k].tema, ok);
    resultados.push({ tema: lista[k].tema, ok });
    app.querySelectorAll('.campos input').forEach((x) => { x.readOnly = true; x.classList.add(ok ? 'bien' : 'mal'); });
    app.querySelectorAll('.op').forEach((o) => { o.disabled = true; if (+o.dataset.i === ej.ok) o.classList.add('bien'); });
    const fb = app.querySelector('#f-fb');
    const veredicto = ok
      ? `<p class="veredicto si ui">Correcto.${simplificar ? ' Simplifica la fracción en el examen.' : ''}</p>`
      : `<p class="veredicto no ui">${sinIntento ? 'Esta es la solución.' : 'Incorrecto.'} Respuesta: ${ej.r}</p>`;
    fb.innerHTML = `${veredicto}<details class="solucion"${ok ? '' : ' open'}><summary class="ui">Solución paso a paso</summary><ol class="pasos">${ej.sol.map((p) => `<li>${p}</li>`).join('')}</ol></details>
      <div class="acciones"><button class="btn btn-primario" type="button" id="f-sig">${k + 1 < lista.length ? 'Siguiente' : 'Ver resultado'}</button></div>`;
    app.querySelector('.acciones button[type="submit"]')?.setAttribute('disabled', '');
    app.querySelector('#f-ver').disabled = true;
    formulas(fb);
    const sig = fb.querySelector('#f-sig');
    sig.addEventListener('click', () => { k++; if (k < lista.length) mostrar(); else fin(); });
    sig.focus({ preventScroll: true });
  }

  function fin() {
    const min = Math.max(1, Math.round((Date.now() - inicio) / 60000));
    const bien = resultados.filter((r) => r.ok).length;
    const porTema = {};
    for (const r of resultados) { porTema[r.tema] ??= { ok: 0, n: 0 }; porTema[r.tema].n++; if (r.ok) porTema[r.tema].ok++; }
    const sem = semanaDe(fund.plan);
    app.innerHTML = `<main class="idx"><section class="hero"><h1>${bien} de ${resultados.length}</h1>
      <p class="lead">${esc(titulo)}. Tiempo: ${hm(min)}.</p>${barraHTML(pct(bien, resultados.length))}
      <ul class="rubros ui">${Object.entries(porTema).map(([id, v]) => `<li><span class="nom">${esc(temaDe(id).titulo)}</span><span class="det">${v.ok}/${v.n}</span><a class="btn" href="#/fundamentos/practica?tema=${id}">Repetir</a></li>`).join('')}</ul>
      <p class="acciones"><button class="btn btn-primario" type="button" id="f-registrar">Sumar ${hm(min)} a Fundamentos en el plan</button><button class="btn" type="button" id="f-otra">Otra ronda igual</button><a class="btn" href="#/fundamentos">Volver a las sesiones</a></p>
      <p class="ui det">Si usaste el cronómetro de arriba, no sumes el tiempo otra vez.</p></section></main>`;
    app.querySelector('#f-registrar').addEventListener('click', (ev) => {
      registrar({ sem: sem?.id || 'extra', clave: 'fundamentos', min, nombre: 'Fundamentos' });
      ev.target.disabled = true;
      aviso(`Se sumaron ${hm(min)} a Fundamentos${sem ? ` (${sem.id})` : ''}.`);
      window.dispatchEvent(new CustomEvent('plan-cambio'));
    });
    app.querySelector('#f-otra').addEventListener('click', () => practica(app, fund, q));
  }

  mostrar();
}

export default async function vistaFundamentos(app, [sub], q) {
  const plan = await cargarPlan();
  const fund = plan.fundamentos;
  if (!fund) throw new Error('Faltan las sesiones de fundamentos (contenido/plan/fundamentos.json).');
  fund.plan = plan;
  if (sub === 'practica') practica(app, fund, q);
  else {
    document.title = 'Fundamentos | Inge 2028';
    barra({ titulo: 'Fundamentos' });
    portada(app, fund, q);
  }
  return {};
}

