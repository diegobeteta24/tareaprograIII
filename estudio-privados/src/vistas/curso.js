// Guía de un curso. Porta motor.render() y el bloque JS de scripts/motor/motor.py
// con el mismo marcado: conceptos, ejercicios, cuestionarios, filtros, índice y progreso.
// Los textos del curso son HTML de confianza (escrito para la guía) y se insertan tal cual.
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
import { cargarCatalogo, cargarCurso, ubicarCurso } from '../datos.js';
import { leer, guardar, ultimo } from '../progreso.js';
import { fallar, agregar, tiene, idGuia } from '../repaso.js';
import { formulas } from '../katex.js';
import { esc, barra, NIVEL, LETRAS, tipoDe, reducirMovimiento, aviso, sinHTML, descargar } from '../ui.js';
import { cursoAMarkdown } from '../exportar.js';

const COMO = 'Cada tema trae conceptos con su uso real y 10 ejercicios: 5 resueltos paso a paso y 5 para resolver con la respuesta final oculta. Intenta cada ejercicio antes de abrir la solución y márcalo como dominado cuando lo resuelvas sin ayuda; tu avance se guarda en este navegador.';

function htmlConcepto(c) {
  const parrafos = [].concat(c.e).map((p) => `<p>${p}</p>`).join('');
  const f = c.f ? `<div class="pizarra">\\[${c.f}\\]${c.fn ? `<span class="nota">${c.fn}</span>` : ''}</div>` : '';
  const tabla = c.tabla ? `<div class="tabla">${c.tabla}</div>` : '';
  const [d, p, w, h] = c.u;
  return `<article class="concepto"><h4>${c.n}</h4>${parrafos}${f}${tabla}
    <dl class="uso"><div><dt>Dónde se usa</dt><dd>${d}</dd></div><div><dt>Por qué</dt><dd>${p}</dd></div><div><dt>Cuándo</dt><dd>${w}</dd></div><div><dt>Cómo</dt><dd>${h}</dd></div></dl></article>`;
}

function htmlEjercicio(e, tid, ei) {
  const eid = `${tid}-e${ei}`;
  const tipo = tipoDe(e);
  const quiz = tipo === 'quiz';
  const etiqueta = { resuelto: 'Resuelto paso a paso', quiz: 'Cuestionario', practica: 'Para resolver' }[tipo];
  let cuerpo;
  if (quiz) {
    const ops = e.ops.map((o, i) => `<button type="button" class="op" data-i="${i}"><b>${LETRAS[i]})</b> ${o}</button>`).join('');
    cuerpo = `<div class="ops" data-ok="${e.ok}" data-letra="${LETRAS[e.ok]}">${ops}</div><div class="fb" hidden><p class="veredicto" aria-live="polite"></p><p class="finalidad"><b>Explicación:</b> ${e.r}</p></div>`;
  } else if (tipo === 'resuelto') {
    const pasos = e.pasos.map((p) => `<li>${p}</li>`).join('');
    cuerpo = `<details><summary>Ver solución paso a paso</summary><ol class="pasos">${pasos}</ol><div class="resultado"><b>Resultado:</b> ${e.r}</div><p class="finalidad"><b>Para qué sirve:</b> ${e.fin}</p></details>`;
  } else {
    cuerpo = `<details><summary>Ver respuesta final</summary><div class="resultado"><b>Respuesta:</b> ${e.r}</div></details>`;
  }
  return `<article class="ej" id="${eid}" data-tipo="${tipo}" data-nivel="${e.nv}"><header><span class="num">${quiz ? 'Pregunta' : 'Ejercicio'} ${ei}</span><span class="nv ${e.nv}">${NIVEL[e.nv] || e.nv}</span><span class="tipo">${etiqueta}</span><button type="button" class="al-repaso" data-repaso="${eid}" aria-label="Mandar el ${quiz ? 'pregunta' : 'ejercicio'} ${ei} al cuaderno de errores">+ Repaso</button><label class="dominar"><input type="checkbox" data-ej="${eid}" data-tema="${tid}"> Dominado</label></header>
    <div class="enun">${e.q}</div>${cuerpo}</article>`;
}

function htmlTema(t, ti) {
  const tid = `t${ti}`;
  const hayQuiz = t.ejercicios.some((e) => 'ops' in e);
  const todoQuiz = t.ejercicios.every((e) => 'ops' in e);
  return `<section class="tema" id="${tid}"><h2><small>Tema ${ti}</small>${t.titulo}</h2>
    ${t.intro ? `<p class="intro">${t.intro}</p>` : ''}
    ${t.conceptos?.length ? `<h3>Conceptos</h3>${t.conceptos.map(htmlConcepto).join('')}` : ''}
    <h3>${todoQuiz ? 'Cuestionario' : hayQuiz ? 'Ejercicios y cuestionario' : 'Ejercicios'}</h3>
    ${t.ejercicios.map((e, i) => htmlEjercicio(e, tid, i + 1)).join('')}</section>`;
}

function paginaPendiente(app, ubic) {
  const { area, bloque, curso } = ubic;
  document.title = `${curso.titulo} | Inge 2028`;
  barra({ titulo: curso.titulo });
  app.innerHTML = `<main class="idx"><p class="migas ui"><a href="#/areas">Áreas</a><span>/</span><a href="#/area/${area.id}">${esc(area.nombre)}</a></p>
    <section class="hero"><h1>${esc(curso.titulo)}</h1><p class="meta ui">Ciclo ${curso.ciclo}, bloque ${esc(bloque.nombre)}</p>
    <p class="lead">Esta guía está en preparación. Mientras tanto puedes repasar con el programa oficial del curso.</p>
    <p><a class="btn btn-primario" href="${esc(curso.pdf)}" target="_blank" rel="noopener">Abrir programa oficial (PDF)</a></p></section></main>`;
}

export default async function vistaCurso(app, [slug, temaInicial]) {
  const cat = await cargarCatalogo();
  const ubic = ubicarCurso(cat, slug);
  if (!ubic) throw Object.assign(new Error('Curso no encontrado'), { noEncontrada: true });
  if (ubic.curso.pendiente) { paginaPendiente(app, ubic); return {}; }
  const { area, bloque } = ubic;
  const curso = await cargarCurso(slug);

  document.title = `${curso.titulo} | Inge 2028`;
  const hayQuiz = curso.temas.some((t) => t.ejercicios.some((e) => 'ops' in e));
  const tocItems = curso.temas.map((t, i) => `<li><a href="#/curso/${esc(slug)}/t${i + 1}" data-tema="t${i + 1}"><span>${i + 1}. ${t.titulo}</span><span class="cnt" data-cnt="t${i + 1}">0/${t.ejercicios.length}</span></a></li>`).join('');

  app.innerHTML = `<div class="layout">
    <nav class="toc ui" id="toc" aria-label="Temas del curso"><a class="indice-link" href="#/area/${area.id}">← ${esc(area.nombre)}</a><ol>${tocItems}</ol></nav>
    <main class="curso-main">
      <section class="hero">
        <p class="migas ui"><a href="#/areas">Áreas</a><span>/</span><a href="#/area/${area.id}">${esc(area.nombre)}</a><span>/</span>${esc(bloque.nombre)}</p>
        <h1>${curso.titulo}</h1>
        <p class="meta ui">${curso.meta}</p>
        ${curso.firma ? `<div class="pizarra">\\[${curso.firma}\\]${curso.firma_nota ? `<span class="nota">${curso.firma_nota}</span>` : ''}</div>` : ''}
        <p class="lead">${curso.lead}</p>
        ${curso.aviso ? `<p class="aviso-guia ui">${esc(curso.aviso)}</p>` : ''}
        <div class="como"><p><b>Cómo usar esta guía.</b> ${curso.como || COMO}</p><p>Fuente del temario: <a href="${esc(curso.fuente)}" target="_blank" rel="noopener">programa oficial del curso</a>.</p></div>
        <div class="filtros ui" role="group" aria-label="Filtrar ejercicios"><span>Ejercicios:</span>
          <button class="chip" data-grupo="tipo" data-valor="todos" aria-pressed="true">Todos</button>
          <button class="chip" data-grupo="tipo" data-valor="resuelto" aria-pressed="false">Resueltos</button>
          <button class="chip" data-grupo="tipo" data-valor="practica" aria-pressed="false">Para resolver</button>
          ${hayQuiz ? '<button class="chip" data-grupo="tipo" data-valor="quiz" aria-pressed="false">Cuestionario</button>' : ''}
          <button class="chip" data-grupo="tipo" data-valor="pendientes" aria-pressed="false">Sin dominar</button>
          <span style="margin-left:10px">Nivel:</span>
          <button class="chip" data-grupo="nivel" data-valor="todos" aria-pressed="true">Todos</button>
          <button class="chip" data-grupo="nivel" data-valor="B" aria-pressed="false">Básico</button>
          <button class="chip" data-grupo="nivel" data-valor="I" aria-pressed="false">Intermedio</button>
          <button class="chip" data-grupo="nivel" data-valor="A" aria-pressed="false">Avanzado</button>
        </div>
        <p class="ui acciones"><a class="btn" href="#/examen?area=${area.id}&bloque=${bloque.id}">Examen del bloque ${esc(bloque.nombre)}</a><a class="btn" href="#/examen?cursos=${esc(slug)}&preset=problemas">Problemas con reloj</a><a class="btn" href="#/oral?cursos=${esc(slug)}">Oral de este curso</a><button class="btn" type="button" id="exportar-md" title="Archivo Markdown con todo el curso, para subirlo como fuente a NotebookLM">Descargar para NotebookLM</button></p>
      </section>
      ${curso.temas.map((t, i) => htmlTema(t, i + 1)).join('')}
      <footer><p>Guía de repaso para el Seminario de Privados, Ingeniería en Sistemas UMG, pensum 2014. Área ${esc(area.nombre)}.</p>
      <p>${curso.local ? 'Guía local de esta adaptación.' : 'Guía de <a href="https://github.com/jairocodes/PrivStudyPage" target="_blank" rel="noopener">PrivStudyPage</a>, de jairocodes.'}</p></footer>
    </main></div>`;

  formulas(app);

  const ac = new AbortController();
  const on = (el, ev, fn) => el.addEventListener(ev, fn, { signal: ac.signal });

  // Progreso (marcar dominado)
  const hechos = leer(slug);
  const cajas = [...app.querySelectorAll('.dominar input')];
  function contar() {
    let ok = 0;
    const porTema = {};
    for (const c of cajas) {
      const t = c.dataset.tema;
      porTema[t] ??= [0, 0];
      porTema[t][1]++;
      if (c.checked) { ok++; porTema[t][0]++; }
      c.closest('.ej').classList.toggle('hecho', c.checked);
    }
    barra({ titulo: curso.titulo, ok, total: cajas.length });
    for (const [t, [h, n]] of Object.entries(porTema)) {
      const el = app.querySelector(`.toc [data-cnt="${t}"]`);
      if (el) { el.textContent = `${h}/${n}`; el.classList.toggle('full', h === n); }
    }
  }
  for (const c of cajas) {
    c.checked = !!hechos[c.dataset.ej];
    on(c, 'change', () => {
      if (c.checked) hechos[c.dataset.ej] = 1; else delete hechos[c.dataset.ej];
      guardar(slug, hechos);
      contar();
    });
  }
  contar();

  // Cuestionarios con retroalimentación inmediata
  for (const g of app.querySelectorAll('.ops')) {
    const ok = +g.dataset.ok;
    const art = g.closest('.ej');
    const fb = art.querySelector('.fb');
    const v = fb.querySelector('.veredicto');
    on(g, 'click', (ev) => {
      const b = ev.target.closest('.op');
      if (!b || b.disabled) return;
      const i = +b.dataset.i;
      g.querySelectorAll('.op').forEach((x) => { x.disabled = true; if (+x.dataset.i === ok) x.classList.add('bien'); });
      if (i === ok) {
        v.textContent = 'Correcto.';
        v.className = 'veredicto si';
        const c = art.querySelector('.dominar input');
        if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event('change')); }
      } else {
        b.classList.add('mal');
        v.textContent = `Incorrecto. La respuesta correcta es la ${g.dataset.letra}). Pasó al cuaderno de errores.`;
        v.className = 'veredicto no';
        const id = art.id;
        fallar(idGuia(slug, id), `${curso.titulo} · ${sinHTML(curso.temas[+id.split('-')[0].slice(1) - 1]?.titulo)}`);
        marcarRepaso(art);
        window.dispatchEvent(new CustomEvent('repaso-cambio'));
      }
      fb.hidden = false;
      if (!fb.querySelector('.ops-reiniciar')) {
        const r = document.createElement('button');
        r.type = 'button';
        r.className = 'ops-reiniciar';
        r.textContent = 'Intentar de nuevo';
        r.addEventListener('click', () => {
          g.querySelectorAll('.op').forEach((x) => { x.disabled = false; x.classList.remove('bien', 'mal'); });
          fb.hidden = true;
        });
        fb.appendChild(r);
      }
    });
  }

  // Exportar la guía para NotebookLM
  on(app.querySelector('#exportar-md'), 'click', () => {
    descargar(`${slug}.md`, cursoAMarkdown(curso, { area: area.nombre, bloque: bloque.nombre }), 'text/markdown');
    aviso('Guía descargada. Súbela a tu cuaderno de NotebookLM como fuente.');
  });

  // Mandar un ejercicio al cuaderno de errores a mano
  function marcarRepaso(art) {
    const b = art.querySelector('.al-repaso');
    if (!b) return;
    b.textContent = 'En el repaso';
    b.disabled = true;
  }
  for (const b of app.querySelectorAll('.al-repaso')) {
    const eid = b.dataset.repaso;
    if (tiene(idGuia(slug, eid))) marcarRepaso(b.closest('.ej'));
    on(b, 'click', () => {
      const ti = +eid.split('-')[0].slice(1);
      agregar(idGuia(slug, eid), `${curso.titulo} · ${sinHTML(curso.temas[ti - 1]?.titulo)}`);
      marcarRepaso(b.closest('.ej'));
      window.dispatchEvent(new CustomEvent('repaso-cambio'));
      aviso('Ejercicio agregado al cuaderno de errores: aparece hoy en Repaso.');
    });
  }

  // Filtros por tipo y nivel
  const filtro = { tipo: 'todos', nivel: 'todos' };
  const ejercicios = [...app.querySelectorAll('.ej')];
  for (const b of app.querySelectorAll('.chip')) {
    on(b, 'click', () => {
      const g = b.dataset.grupo;
      app.querySelectorAll(`.chip[data-grupo="${g}"]`).forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
      filtro[g] = b.dataset.valor;
      for (const e of ejercicios) {
        const nivelOk = filtro.nivel === 'todos' || e.dataset.nivel === filtro.nivel;
        const tipoOk = filtro.tipo === 'pendientes' ? !e.classList.contains('hecho') : filtro.tipo === 'todos' || e.dataset.tipo === filtro.tipo;
        e.classList.toggle('oculto', !(nivelOk && tipoOk));
      }
    });
  }

  // Índice en móvil
  const toc = app.querySelector('nav.toc');
  const bi = document.querySelector('.btn-indice');
  bi.hidden = false;
  const cerrarToc = () => { toc.classList.remove('abierto'); bi.setAttribute('aria-expanded', 'false'); };
  on(bi, 'click', () => bi.setAttribute('aria-expanded', toc.classList.toggle('abierto')));
  on(toc, 'click', (e) => { if (e.target.closest('a') && window.innerWidth <= 960) cerrarToc(); });

  // Scrollspy y "continuar donde te quedaste"
  const links = Object.fromEntries([...app.querySelectorAll('.toc a[data-tema]')].map((a) => [a.dataset.tema, a]));
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((es) => {
      for (const en of es) {
        if (!en.isIntersecting) continue;
        Object.values(links).forEach((l) => l.classList.remove('activo'));
        links[en.target.id]?.classList.add('activo');
        const n = +en.target.id.slice(1);
        ultimo.guardar({ slug, titulo: curso.titulo, tema: en.target.id, temaTitulo: curso.temas[n - 1]?.titulo.replace(/<[^>]+>/g, '') });
      }
    }, { rootMargin: '-30% 0px -60% 0px' });
    app.querySelectorAll('section.tema').forEach((s) => io.observe(s));
  }
  ultimo.guardar({ slug, titulo: curso.titulo });

  function irA(tema) {
    cerrarToc();
    const el = tema && /^t\d+$/.test(tema) ? document.getElementById(tema) : null;
    if (el) el.scrollIntoView({ behavior: reducirMovimiento() ? 'auto' : 'smooth' });
    else window.scrollTo(0, 0);
  }
  if (temaInicial) requestAnimationFrame(() => document.getElementById(temaInicial)?.scrollIntoView());

  return {
    slug,
    irA,
    limpiar() {
      ac.abort();
      io?.disconnect();
      bi.hidden = true;
      bi.setAttribute('aria-expanded', 'false');
    },
  };
}
