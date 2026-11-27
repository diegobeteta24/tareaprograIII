// Cuaderno de errores: repasa las tarjetas que vencen hoy (cajas de Leitner).
import { cargarCurso, cargarIngles } from '../datos.js';
import * as R from '../repaso.js';
import { hoy, corto, relativo } from '../fechas.js';
import { formulas } from '../katex.js';
import { esc, barra, barraHTML, LETRAS, NIVEL, tipoDe, opcionesBarajadas, aviso, pct } from '../ui.js';

/** Busca el contenido de una tarjeta. Devuelve null si ya no existe (guía cambiada o pregunta borrada). */
async function contenido(id) {
  const p = R.partes(id);
  try {
    if (p.tipo === 'ingles') {
      const b = await cargarIngles();
      const q = b.porId.get(p.pregunta);
      return q ? { ...p, q, texto: b.textoDe(q), tema: b.tema(q.tema) } : null;
    }
    const c = await cargarCurso(p.slug);
    const [t, x] = (p.ej || p.concepto).match(/\d+/g).map(Number);
    const tema = c.temas[t - 1];
    if (!tema) return null;
    if (p.tipo === 'guia') {
      const e = tema.ejercicios[x - 1];
      return e ? { ...p, e, curso: c, tema, t } : null;
    }
    const co = tema.conceptos?.[x - 1];
    return co ? { ...p, co, curso: c, tema, t } : null;
  } catch {
    return null;
  }
}

function htmlConcepto(co) {
  const [d, p, w, h] = co.u;
  return `${[].concat(co.e).map((x) => `<p>${x}</p>`).join('')}${co.f ? `<div class="pizarra">\\[${co.f}\\]</div>` : ''}${co.tabla ? `<div class="tabla">${co.tabla}</div>` : ''}
    <dl class="uso"><div><dt>Dónde se usa</dt><dd>${d}</dd></div><div><dt>Por qué</dt><dd>${p}</dd></div><div><dt>Cuándo</dt><dd>${w}</dd></div><div><dt>Cómo</dt><dd>${h}</dd></div></dl>`;
}

export default async function vistaRepaso(app) {
  document.title = 'Repaso | Inge 2028';
  barra({ titulo: 'Cuaderno de errores' });

  function portada() {
    const r = R.resumen();
    const todas = Object.entries(R.tarjetas()).sort((a, b) => a[1].vence.localeCompare(b[1].vence));
    const lista = todas.length
      ? `<ul class="rubros ui tarjetas">${todas.map(([id, c]) => `<li><span class="nom">${esc(c.etiqueta || id)}</span><span class="det">caja ${c.caja} · ${c.vence <= hoy() ? '<b>hoy</b>' : `${corto(c.vence)} (${relativo(c.vence)})`}${c.fallos ? ` · ${c.fallos} ${c.fallos === 1 ? 'fallo' : 'fallos'}` : ''}</span>
          <button class="enlace" type="button" data-quitar="${esc(id)}">Quitar</button></li>`).join('')}</ul>`
      : '<p class="sem ui">El cuaderno está vacío. Se llena solo con lo que falles en el modo examen, en los cuestionarios de las guías, en el oral y en inglés; también puedes mandar un ejercicio con el botón «+ Repaso» de cada guía.</p>';
    app.innerHTML = `<main class="idx">
      <section class="hero"><h1>Cuaderno de errores</h1>
        <p class="lead">Cada error se repasa al día siguiente; si lo aciertas, vuelve en 2, 4, 8 y 16 días, y después sale del cuaderno. Si lo fallas, regresa a la primera caja. Diez minutos diarios bastan.</p>
        <div class="cifras"><span><b>${r.hoy}</b> para hoy</span><span><b>${r.total}</b> en el cuaderno</span><span><b>${r.graduadas}</b> ya dominadas</span></div>
        <div class="cajas ui" aria-label="Tarjetas por caja">${r.cajas.map((n, i) => `<span><b>${n}</b> caja ${i + 1}<small>${R.INTERVALOS[i]} d</small></span>`).join('')}</div>
        ${r.hoy ? `<p class="acciones"><button class="btn btn-primario" type="button" id="empezar">Repasar ${r.hoy} ${r.hoy === 1 ? 'tarjeta' : 'tarjetas'}</button></p>` : '<p class="ui det">Nada vence hoy.</p>'}
      </section>
      <section class="bloque sin-margen"><h2>Todas las tarjetas</h2>${lista}</section>
    </main>`;
    app.querySelector('#empezar')?.addEventListener('click', sesion);
    app.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => {
      R.quitar(b.dataset.quitar);
      window.dispatchEvent(new CustomEvent('repaso-cambio'));
      portada();
    }));
  }

  async function sesion() {
    const cola = R.pendientes();
    let i = 0, bien = 0, graduadas = 0, vistas = 0;

    async function siguiente() {
      if (i >= cola.length) return fin();
      const tarjeta = cola[i];
      const x = await contenido(tarjeta.id);
      const cab = `<div class="examen-cab ui"><span>Tarjeta ${i + 1} de ${cola.length} · caja ${tarjeta.caja}</span>${barraHTML(pct(i, cola.length))}<button class="btn" type="button" id="salir">Salir</button></div>`;
      if (!x) {
        app.innerHTML = `<main class="idx">${cab}<article class="ej"><p>Esta tarjeta apunta a un ejercicio que ya no existe (${esc(tarjeta.etiqueta || tarjeta.id)}). Se quita del cuaderno.</p>
          <div class="acciones"><button class="btn btn-primario" type="button" id="seguir">Seguir</button></div></article></main>`;
        R.quitar(tarjeta.id);
        app.querySelector('#seguir').addEventListener('click', () => { i++; siguiente(); });
        app.querySelector('#salir').addEventListener('click', fin);
        return;
      }
      const origen = x.tipo === 'ingles'
        ? `Inglés · ${esc(x.tema?.titulo || '')} · ${esc(x.q.nv)}`
        : `${esc(x.curso.titulo)} · ${x.tema.titulo}${x.e ? ` · <span class="nv ${x.e.nv}">${NIVEL[x.e.nv] || x.e.nv}</span>` : ''}`;
      let cuerpo, acciones;
      if (x.tipo === 'ingles') {
        x.ops = opcionesBarajadas(x.q.a, x.q.d);
        cuerpo = `${x.texto ? `<details class="lectura"><summary class="ui">Texto: ${esc(x.texto.titulo)}</summary>${x.texto.texto.map((p) => `<p>${esc(p)}</p>`).join('')}</details>` : ''}
          <div class="enun en" lang="en">${x.q.q}</div><div class="ops">${x.ops.map((o, k) => `<button type="button" class="op" data-k="${k}" lang="en"><b>${LETRAS[k]})</b> ${o.texto}</button>`).join('')}</div><div class="fb" hidden></div>`;
        acciones = '';
      } else if (x.tipo === 'concepto') {
        cuerpo = `<div class="enun"><p><b>Explica en voz alta:</b> ${x.co.n}</p><p class="ui det">Di la definición, un ejemplo de dónde se usa, por qué importa y cuándo se aplica. Después compara.</p></div><div class="sol" hidden>${htmlConcepto(x.co)}</div>`;
        acciones = '<button class="btn btn-primario" type="button" id="ver">Ver la explicación</button>';
      } else {
        const tipo = tipoDe(x.e);
        if (tipo === 'quiz') {
          cuerpo = `<div class="enun">${x.e.q}</div><div class="ops">${x.e.ops.map((o, k) => `<button type="button" class="op" data-k="${k}"><b>${LETRAS[k]})</b> ${o}</button>`).join('')}</div><div class="fb" hidden></div>`;
          acciones = '';
        } else {
          const sol = tipo === 'resuelto'
            ? `<ol class="pasos">${x.e.pasos.map((p) => `<li>${p}</li>`).join('')}</ol><div class="resultado"><b>Resultado:</b> ${x.e.r}</div>`
            : `<div class="resultado"><b>Respuesta:</b> ${x.e.r}</div>`;
          cuerpo = `<div class="enun">${x.e.q}</div><p class="ui det">Resuélvelo en papel antes de ver la respuesta.</p><div class="sol" hidden>${sol}</div>`;
          acciones = '<button class="btn btn-primario" type="button" id="ver">Mostrar respuesta</button>';
        }
      }
      app.innerHTML = `<main class="idx">${cab}<article class="ej examen-q"><p class="origen">${origen}</p>${cuerpo}<div class="acciones" id="acc">${acciones}</div></article></main>`;
      formulas(app);
      app.querySelector('#salir').addEventListener('click', fin);
      const acc = app.querySelector('#acc');

      const calificar = (ok) => {
        vistas++;
        if (ok) bien++;
        const r = R.repasar(tarjeta.id, ok);
        if (r?.graduada) graduadas++;
        window.dispatchEvent(new CustomEvent('repaso-cambio'));
      };
      const botonSeguir = () => {
        acc.innerHTML = `<button class="btn btn-primario" type="button" id="seguir">${i + 1 < cola.length ? 'Siguiente' : 'Terminar'}</button>`;
        const s = acc.querySelector('#seguir');
        s.addEventListener('click', () => { i++; siguiente(); });
        s.focus({ preventScroll: true });
      };
      const opciones = app.querySelector('.ops');
      if (opciones) {
        const correcta = x.tipo === 'ingles' ? x.ops.findIndex((o) => o.correcta) : x.e.ok;
        opciones.addEventListener('click', (ev) => {
          const b = ev.target.closest('.op');
          if (!b || b.disabled) return;
          const k = +b.dataset.k;
          opciones.querySelectorAll('.op').forEach((o) => { o.disabled = true; if (+o.dataset.k === correcta) o.classList.add('bien'); });
          if (k !== correcta) b.classList.add('mal');
          const fb = app.querySelector('.fb');
          fb.hidden = false;
          fb.innerHTML = `<p class="veredicto ${k === correcta ? 'si' : 'no'}" aria-live="polite">${k === correcta ? 'Correcto: sube de caja.' : `Incorrecto: la correcta es la ${LETRAS[correcta]}). Vuelve mañana.`}</p><p class="finalidad"><b>Explicación:</b> ${x.tipo === 'ingles' ? x.q.x : x.e.r}</p>`;
          calificar(k === correcta);
          formulas(fb);
          botonSeguir();
        });
        opciones.querySelector('.op')?.focus({ preventScroll: true });
      } else {
        app.querySelector('#ver').addEventListener('click', () => {
          app.querySelector('.sol').hidden = false;
          acc.innerHTML = `<button class="btn btn-primario" type="button" data-ok="1">${x.tipo === 'concepto' ? 'Lo expliqué bien' : 'La sabía'}</button><button class="btn" type="button" data-ok="0">${x.tipo === 'concepto' ? 'Me faltó' : 'No la sabía'}</button>`;
          acc.querySelectorAll('[data-ok]').forEach((b) => b.addEventListener('click', () => { calificar(b.dataset.ok === '1'); i++; siguiente(); }));
          acc.querySelector('[data-ok]').focus({ preventScroll: true });
        });
        app.querySelector('#ver').focus({ preventScroll: true });
      }
      window.scrollTo(0, 0);
    }

    function fin() {
      const r = R.resumen();
      app.innerHTML = `<main class="idx"><section class="hero"><h1>Repaso terminado</h1>
        <p class="lead">${vistas ? `${bien} de ${vistas} bien.` : 'No repasaste tarjetas.'}${graduadas ? ` ${graduadas} ${graduadas === 1 ? 'tarjeta salió' : 'tarjetas salieron'} del cuaderno por dominarlas.` : ''} Quedan ${r.hoy} para hoy y ${r.total} en total.</p>
        <p class="acciones"><a class="btn btn-primario" href="#/">Volver a Hoy</a><button class="btn" type="button" id="cuaderno">Ver el cuaderno</button></p></section></main>`;
      app.querySelector('#cuaderno').addEventListener('click', portada);
      if (vistas) aviso('Repaso guardado.');
    }

    siguiente();
  }

  portada();
  return {};
}
