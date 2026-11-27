// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
import { cargarCatalogo } from '../datos.js';
import { dominados, ultimo } from '../progreso.js';
import { esc, barra, barraHTML } from '../ui.js';

export default async function vistaInicio(app) {
  const cat = await cargarCatalogo();
  document.title = 'Áreas | Inge 2028';
  barra({ titulo: 'Áreas' });

  const listos = cat.areas.reduce((s, a) => s + a.listos, 0);
  const total = cat.areas.reduce((s, a) => s + a.total, 0);
  const ejercicios = cat.areas.reduce((s, a) => s + a.ejercicios, 0);

  const tarjetas = cat.areas.map((a) => {
    const cursos = a.bloques.flatMap((b) => b.cursos).filter((c) => !c.pendiente);
    const dom = cursos.reduce((s, c) => s + dominados(c), 0);
    const pct = a.ejercicios ? Math.round((100 * dom) / a.ejercicios) : 0;
    const semanas = a.bloques.filter((b) => b.semana).map((b) => b.nombre).join(', ');
    return `<a class="area-card" href="#/area/${a.id}">
      <h2>${esc(a.nombre)}</h2>
      <p>${esc(semanas)}</p>
      ${a.ejercicios ? barraHTML(pct) : ''}
      <div class="cifras"><span><b>${a.listos}</b> de ${a.total} guías listas${a.locales ? ` (${a.locales} locales)` : ''}</span>${a.ejercicios ? `<span><b>${a.ejercicios}</b> ejercicios y preguntas</span><span><b>${dom}</b> dominados (${pct} %)</span>` : '<span>Guías en preparación</span>'}</div>
    </a>`;
  }).join('');

  const u = ultimo.leer();
  const continuar = u?.slug
    ? `<p class="continuar ui">Continúa donde te quedaste: <a href="#/curso/${esc(u.slug)}${u.tema ? '/' + esc(u.tema) : ''}"><b>${esc(u.titulo)}</b>${u.temaTitulo ? ', ' + esc(u.temaTitulo) : ''}</a></p>`
    : '';

  app.innerHTML = `<main class="idx">
    <section class="hero">
      <h1>Áreas del seminario</h1>
      <p class="meta ui">Seminario de Privados, Ingeniería en Sistemas de Información y Ciencias de la Computación, UMG, pensum 2014</p>
      <p class="lead">Una guía por curso con conceptos y su uso real, ejercicios resueltos paso a paso, ejercicios para resolver y cuestionarios. ${listos} de ${total} guías listas, ${ejercicios} ejercicios y preguntas.</p>
      <p class="acciones"><a class="btn btn-primario" href="#/examen">Modo examen</a><a class="btn" href="#/oral">Práctica del oral</a></p>
    </section>
    ${continuar}
    <div class="areas">${tarjetas}</div>
    <footer><p>El privado evalúa tres áreas; cada una tiene seis bloques de una semana más una semana de proyecto final y examen. La asignación de cursos a bloques es una propuesta de estudio de PrivStudyPage: confírmala con quien coordine tu grupo.</p>
    <p>Guías de Ciencias y Administración: <a href="https://github.com/jairocodes/PrivStudyPage" target="_blank" rel="noopener">PrivStudyPage</a>, de jairocodes. Las de Análisis marcadas como locales son de esta adaptación. Tu avance se guarda solo en este navegador.</p></footer>
  </main>`;
}
