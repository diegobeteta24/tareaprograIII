// Plan completo: semanas de estudio previo, ruta 2027–2028, puntos de control y sesiones registradas.
import { cargarPlan, cargarPersonal } from '../datos.js';
import * as P from '../plan.js';
import { hoy, corto, conAnio, relativo, rango, diaMes } from '../fechas.js';
import { esc, barra, barraHTML, hm, pct, aviso, descargar } from '../ui.js';
import { planAICS } from '../calendario.js';
import { htmlTramites, enfocarDeNuevo } from '../componentes.js';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function htmlSemana(s, fecha, hechos, personal) {
  const av = P.avanceSemana(s);
  const estado = s.fin < fecha ? 'pasada' : s.inicio <= fecha ? 'actual' : 'futura';
  const plan = av.planArea + av.planIngles;
  const hecho = av.hechoArea + av.hechoIngles;
  const rubros = av.area.map((it) => `<li><span class="nom">${esc(it.nombre)}</span><span class="det">${hm(it.hecho)} de ${it.horas} h</span>${it.nota ? `<span class="nota">${esc(it.nota)}</span>` : ''}</li>`).join('');
  const ingles = s.inglesHoras
    ? `<li><span class="nom">Inglés</span><span class="det">${hm(av.hechoIngles)} de ${s.inglesHoras} h</span><span class="nota">${esc(s.inglesNota || '')}</span></li>`
    : s.inglesNota ? `<li><span class="nom">Inglés</span><span class="nota">${esc(s.inglesNota)}</span></li>` : '';
  const tram = P.tramitesDe(s, personal);
  return `<details class="semana ${estado}"${estado === 'actual' ? ' open' : ''}>
    <summary class="ui"><span class="sid">${esc(s.id)}</span><span class="stit">${esc(s.titulo)}</span><span class="sfecha">${rango(s.inicio, s.fin)}</span>
      <span class="shoras">${hm(hecho)} de ${hm(plan)}</span>${barraHTML(pct(hecho, plan))}</summary>
    <ul class="rubros ui">${rubros}${ingles}</ul>
    ${tram.length ? htmlTramites(tram, hechos, fecha, 'Trámites').replace('<section class="bloque">', '<div class="sub">').replace('</section>', '</div>').replace('<h2>', '<h3>').replace('</h2>', '</h3>') : ''}
  </details>`;
}

export default async function vistaPlan(app) {
  const [plan, personal] = await Promise.all([cargarPlan(), cargarPersonal()]);
  document.title = 'Plan | Inge 2028';
  barra({ titulo: 'Plan' });
  const ac = new AbortController();

  function pintar() {
    const fecha = hoy();
    const hechos = P.tramitesHechos();
    const tot = P.totales(plan);
    const ini = P.arranque(plan);
    const movido = P.arranqueCambiado(plan);
    const fases = P.fases(plan);
    const pts = P.puntos(plan, personal);

    const totales = [['Áreas', tot.area, plan.totales.area], ['Inglés', tot.ingles, plan.totales.ingles], ['Fundamentos', tot.fundamentos, plan.totales.fundamentos]]
      .map(([n, m, h]) => `<li><div class="fh-cab"><span class="nom">${n}</span><span class="det">${hm(m)} de ${h} h</span></div>${barraHTML(pct(m, h * 60))}</li>`).join('');

    const ruta = fases.map((f) => {
      const estado = f.fin < fecha ? 'pasada' : f.inicio <= fecha ? 'actual' : 'futura';
      const hitos = f.hitos.map((h) => `<li><span class="cuando">${conAnio(h.fecha)}</span> ${esc(h.texto)}</li>`).join('');
      const clases = f.clases.length ? `<p class="clases ui">Clases previstas: ${f.clases.map(diaMes).join(', ')}.</p>` : '';
      return `<li class="fase ${estado}"><p class="ffecha ui">${conAnio(f.inicio)} → ${conAnio(f.fin)}${estado === 'actual' ? ' · <b>ahora</b>' : ''}</p>
        <h3>${esc(f.titulo)}</h3><p>${esc(f.estudio)}</p>${clases}${hitos ? `<ul class="hitos ui">${hitos}</ul>` : ''}</li>`;
    }).join('');

    const controles = pts.map((p) => {
      const estado = p.respuesta === 'si' ? 'Cumplido' : p.respuesta === 'no' ? 'Todavía no' : p.fecha < fecha ? 'Sin responder' : relativo(p.fecha, fecha);
      return `<li class="${p.respuesta === 'si' ? 'hecho' : ''}"><div class="fh-cab"><span class="nom">${esc(p.id)} · ${conAnio(p.fecha)}</span><span class="det">${esc(estado)}</span></div>
        <p>${esc(p.pregunta)}</p><p class="sino"><b>Si la respuesta es no:</b> ${esc(p.siNo)}</p>
        <div class="acciones"><button class="btn" type="button" data-accion="pc" data-id="${esc(p.id)}" data-valor="si" aria-pressed="${p.respuesta === 'si'}">Sí</button><button class="btn" type="button" data-accion="pc" data-id="${esc(p.id)}" data-valor="no" aria-pressed="${p.respuesta === 'no'}">Todavía no</button>${p.respuesta ? `<button class="enlace" type="button" data-accion="pc" data-id="${esc(p.id)}" data-valor="">Borrar respuesta</button>` : ''}</div></li>`;
    }).join('');

    const plantilla = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const bs = plan.plantilla.dias[d] || [];
      const txt = bs.map((b) => `${b.tipo === 'area' ? 'Área' : b.modo === 'simulacro' ? 'Inglés: simulacro de 100 preguntas' : 'Inglés'} ${hm(b.min)}${b.cuando ? ` ${b.cuando}` : ''}`).join(' · ');
      return `<tr><th scope="row">${DIAS[d]}</th><td>${esc(txt || 'Sin sesión')}</td></tr>`;
    }).join('');

    const ses = P.sesiones().slice(-12).reverse();
    const registro = ses.length
      ? `<ul class="historial">${ses.map((s) => `<li>${corto(s.fecha)} · ${esc(s.sem)} · ${esc(s.nombre || s.clave)} · <b>${hm(s.min)}</b> <button class="enlace" type="button" data-accion="borrar" data-t="${s.t}" aria-label="Borrar el registro de ${hm(s.min)} de ${esc(s.nombre || s.clave)}">Borrar</button></li>`).join('')}</ul>`
      : '<p class="sem ui">Todavía no hay sesiones. Se registran con el cronómetro o con los botones de la vista Hoy.</p>';

    // Datos personales (solo si existe personal/mis-datos.json)
    const notas = personal.notas?.bloques?.length
      ? `<section class="bloque"><h2>Tus notas por bloque</h2><p class="sem ui">Del más débil al más fuerte dentro de cada área. Vienen de <code>personal/mis-datos.json</code>, que no se sube al repositorio.</p>
        <div class="tabla"><table><thead><tr><th>Área</th><th>Bloque</th><th>Promedio</th><th>Exámenes</th></tr></thead><tbody>
        ${personal.notas.bloques.map((b) => `<tr><td>${esc(b.areaNombre || b.area)}</td><td>${esc(b.nombre)}</td><td>${esc(b.promedio)}</td><td>${b.examenes != null ? esc(b.examenes) + ' %' : '—'}</td></tr>`).join('')}
        </tbody></table></div>${personal.notas.lectura ? `<p class="sem ui">${esc(personal.notas.lectura)}</p>` : ''}</section>` : '';
    const contactos = personal.contactos?.length
      ? `<section class="bloque"><h2>Contactos</h2><ul class="rubros ui">${personal.contactos.map((c) => `<li><span class="nom">${esc(c.quien)}</span><span class="nota">${esc(c.dato)}</span></li>`).join('')}</ul></section>` : '';

    app.innerHTML = `<main class="idx">
      <section class="hero">
        <p class="meta ui">${esc(plan.nombre)} · actualizado el ${conAnio(plan.actualizado)}</p>
        <h1>Plan</h1>
        <p class="lead">${esc(plan.descripcion)} Meta: ${esc(plan.meta.texto.replace(/^./, (c) => c.toLowerCase()))} Fecha límite: ${conAnio(plan.meta.fecha)}.</p>
        <ul class="horas total">${totales}</ul>
      </section>

      <section class="bloque sin-margen"><h2>Estudio previo, semana por semana</h2>
        <p class="sem ui">${rango(plan.semanas[0].inicio, plan.semanas.at(-1).fin)}. Abre una semana para ver sus rubros y trámites.</p>
        ${plan.semanas.map((s) => htmlSemana(s, fecha, hechos, personal)).join('')}</section>

      <section class="bloque"><h2>Arranque del seminario</h2>
        <p class="sem ui">Es la fecha que hay que defender: cada semana de atraso en el arranque corre toda la ruta una semana.</p>
        <form class="form-examen ui" id="form-arranque">
          <label>Primer día de clases del seminario<input type="date" name="arranque" value="${esc(ini)}" min="2027-01-01" max="2028-12-31" required></label>
          <p class="ayuda">${movido ? `Ajustado por ti. El plan original dice ${conAnio(plan.arranqueSeminario)}: la ruta de abajo está corrida ${Math.abs(P.faltan(ini, plan.arranqueSeminario))} días.` : 'Fecha del plan. Cámbiala cuando el grupo confirme su calendario.'}</p>
          <div class="acciones"><button class="btn btn-primario" type="submit">Guardar fecha</button>${movido ? '<button class="btn" type="button" data-accion="restaurar">Volver a la del plan</button>' : ''}</div>
        </form></section>

      <section class="bloque"><h2>Ruta 2027–2028</h2>
        <p class="sem ui">Las fechas de clase son ilustrativas: usan sábados y el orden Ciencias, Administración y Análisis. Se ajustan cuando el grupo publique su calendario.</p>
        <ol class="ruta">${ruta}</ol></section>

      <section class="bloque"><h2>Puntos de control</h2><ul class="controles ui">${controles}</ul></section>

      <section class="bloque"><h2>Plantilla semanal</h2><p class="sem ui">${plan.plantilla.horasSemana} horas por semana. ${esc(plan.plantilla.nota)}</p>
        <div class="tabla"><table><tbody>${plantilla}</tbody></table></div></section>

      ${notas}${contactos}

      <section class="bloque"><h2>Últimas sesiones registradas</h2>${registro}</section>
      <section class="bloque"><h2>Llevarlo al calendario del teléfono</h2>
        <p class="sem ui">Descarga las fechas del plan (trámites, puntos de control, sesiones de fundamentos, inicio de cada semana e hitos de 2027–2028, con la fecha de arranque que tengas guardada) e impórtalas en Google Calendar desde la computadora: Configuración → Importar y exportar. Los trámites y puntos de control avisan a las 9:00 del día anterior. Si después cambias la fecha de arranque, vuelve a descargar e importar: los eventos se actualizan.</p>
        <p class="acciones"><button class="btn btn-primario" type="button" data-accion="ics">Descargar calendario (.ics)</button></p></section>
      <footer><p><a href="#/datos">Copia de seguridad del avance</a> · <a href="#/">Volver a Hoy</a></p>
      <p>El plan se edita en <code>contenido/plan/plan.json</code>; después de cambiarlo, vuelve a ejecutar <code>npm run dev</code>.</p></footer>
    </main>`;
  }

  app.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    const d = b.dataset;
    if (d.accion === 'pc') P.responderPunto(d.id, d.valor || null);
    else if (d.accion === 'borrar') { P.borrarSesion(+d.t); aviso('Registro eliminado.'); }
    else if (d.accion === 'restaurar') { P.fijarArranque(plan, null); aviso('Se restauró la fecha del plan.'); }
    else if (d.accion === 'ics') { descargar('inge2028-plan.ics', planAICS(plan, personal), 'text/calendar'); aviso('Calendario descargado.'); return; }
    enfocarDeNuevo(app, pintar);
  }, { signal: ac.signal });

  app.addEventListener('change', (ev) => {
    const c = ev.target.closest('[data-tramite]');
    if (!c) return;
    P.marcarTramite(c.dataset.tramite, c.checked);
    // Se conserva qué semanas estaban abiertas
    const abiertas = [...app.querySelectorAll('details.semana')].map((x) => x.open);
    enfocarDeNuevo(app, () => { pintar(); app.querySelectorAll('details.semana').forEach((x, i) => { x.open = abiertas[i]; }); });
  }, { signal: ac.signal });

  app.addEventListener('submit', (ev) => {
    if (ev.target.id !== 'form-arranque') return;
    ev.preventDefault();
    const v = ev.target.arranque.value;
    if (!v) return;
    P.fijarArranque(plan, v);
    aviso(`Arranque del seminario: ${conAnio(v)}.`);
    pintar();
  }, { signal: ac.signal });

  pintar();
  return { limpiar: () => ac.abort() };
}
