// Hoy: qué toca según el plan, horas de la semana, trámites y punto de control.
import { cargarPlan, cargarPersonal, cargarCatalogo, ubicarCurso } from '../datos.js';
import * as P from '../plan.js';
import { hoy, largo, corto, conAnio, relativo, diaSemana, rango } from '../fechas.js';
import { resumen as resumenRepaso } from '../repaso.js';
import { ultimo } from '../progreso.js';
import { esc, barraHTML, hm, pct, aviso } from '../ui.js';
import { htmlTramites, enfocarDeNuevo } from '../componentes.js';

const SUGERENCIA = {
  1: 'Lunes: empieza con el cuestionario de entrada (20 minutos) para saber qué tema oír y practicar primero.',
  2: 'De 10 a 15 ejercicios a mano y con reloj. El audio da el mapa; el parcial se gana resolviendo.',
  3: 'De 10 a 15 ejercicios a mano y con reloj. El audio da el mapa; el parcial se gana resolviendo.',
  4: 'De 10 a 15 ejercicios a mano y con reloj. Cierra explicando dos conceptos en voz alta.',
  6: 'Sábado: simulacro de 2 horas con reloj, revisión de errores y dos temas explicados en voz alta.',
};

/** Enlaces de estudio de un rubro del plan: guías, cuestionario, problemas, simulacro y oral. */
function enlacesRubro(it, cat, dia) {
  if (it.ruta) return `<a class="btn btn-primario" href="${esc(it.ruta)}">Abrir</a>`;
  const cursos = (it.cursos || []).map((s) => ubicarCurso(cat, s)).filter((u) => u && !u.curso.pendiente);
  const guias = cursos.map((u) => `<a class="btn" href="#/curso/${esc(u.curso.slug)}">Guía: ${esc(u.curso.titulo)}</a>`).join('');
  const ambito = cursos.length ? `cursos=${cursos.map((u) => u.curso.slug).join(',')}` : it.bloque ? `area=${it.area}&bloque=${it.bloque}` : `area=${it.area}`;
  const hay = cursos.length || cat.areas.find((a) => a.id === it.area)?.listos;
  if (!hay) return `<a class="btn" href="#/area/${esc(it.area)}">Ver el área</a>`;
  const practica = dia === 6
    ? `<a class="btn btn-primario" href="#/examen?${ambito}&preset=simulacro">Simulacro de 2 h</a><a class="btn" href="#/oral?${ambito}">Oral: dos temas</a>`
    : dia === 1
      ? `<a class="btn btn-primario" href="#/examen?${ambito}&preset=entrada">Cuestionario de entrada</a><a class="btn" href="#/examen?${ambito}&preset=problemas">Problemas con reloj</a>`
      : `<a class="btn btn-primario" href="#/examen?${ambito}&preset=problemas">Problemas con reloj</a><a class="btn" href="#/oral?${ambito}">Oral</a>`;
  return `${practica}${guias || `<a class="btn" href="#/area/${esc(it.area)}">Ver el área</a>`}`;
}

const botonCrono = (sem, clave, nombre) => `<button class="btn" type="button" data-accion="crono" data-sem="${esc(sem)}" data-clave="${esc(clave)}" data-nombre="${esc(nombre)}">Cronómetro</button>`;
const botonSumar = (sem, clave, nombre, min) => `<button class="btn" type="button" data-accion="sumar" data-sem="${esc(sem)}" data-clave="${esc(clave)}" data-nombre="${esc(nombre)}" data-min="${min}">+${hm(min)}</button>`;

function filaHoras({ sem, clave, nombre, hecho, plan, nota, extras = [45, 90] }) {
  const lleno = plan && hecho >= plan;
  return `<li class="fila-horas${lleno ? ' completa' : ''}">
    <div class="fh-cab"><span class="nom">${esc(nombre)}</span><span class="det">${hm(hecho)}${plan ? ` de ${hm(plan)}` : ''}</span></div>
    ${plan ? barraHTML(pct(hecho, plan)) : ''}
    ${nota ? `<p class="fh-nota">${esc(nota)}</p>` : ''}
    <div class="acciones">${botonCrono(sem, clave, nombre)}${extras.map((m) => botonSumar(sem, clave, nombre, m)).join('')}</div>
  </li>`;
}

function htmlPunto(pts, fecha) {
  // Primero uno vencido sin responder (es una decisión pendiente); si no hay, el siguiente
  const p = pts.find((x) => x.respuesta === null && x.fecha < fecha) || pts.find((x) => x.respuesta === null && x.fecha >= fecha);
  if (!p) return '';
  const pasado = p.fecha < fecha;
  return `<section class="bloque"><h2>Punto de control ${esc(p.id.replace('PC', ''))}</h2>
    <p class="sem ui">${conAnio(p.fecha)} · ${relativo(p.fecha, fecha)}${pasado ? ' · sin responder' : ''}</p>
    <div class="punto"><p>${esc(p.pregunta)}</p>
    <div class="acciones"><button class="btn" type="button" data-accion="pc" data-id="${esc(p.id)}" data-valor="si">Sí</button><button class="btn" type="button" data-accion="pc" data-id="${esc(p.id)}" data-valor="no">Todavía no</button></div></div></section>`;
}

export default async function vistaHoy(app) {
  const [plan, personal, cat] = await Promise.all([cargarPlan(), cargarPersonal(), cargarCatalogo()]);
  document.title = 'Hoy | Inge 2028';
  const ac = new AbortController();

  function pintar() {
    const fecha = hoy();
    const dia = diaSemana(fecha);
    const semana = P.semanaDe(plan, fecha);
    const fase = semana ? null : P.faseDe(plan, fecha);
    const inicioPlan = plan.semanas[0].inicio;
    const ini = P.arranque(plan);
    const faltan = P.faltan(ini, fecha);
    const hechos = P.tramitesHechos();
    const { libre, bloques } = P.plantillaDe(plan, fecha);
    const rep = resumenRepaso(fecha);
    const tot = P.totales(plan);

    // ----- Cabecera -----
    const contexto = semana
      ? `Semana ${esc(semana.id)} · ${esc(semana.titulo)} · ${rango(semana.inicio, semana.fin)}`
      : fase ? `${esc(fase.titulo)} · ${rango(fase.inicio, fase.fin)}`
        : fecha < inicioPlan ? `El plan arranca el ${largo(inicioPlan)}` : 'Fuera de las fechas del plan';
    const cuenta = faltan > 0 ? `Faltan <b>${faltan}</b> días para el arranque del seminario (${conAnio(ini)}).`
      : fase?.seminario ? 'Seminario en curso.' : '';

    // ----- Qué toca hoy -----
    const tarjetas = [];
    if (libre) tarjetas.push('<li class="toca"><h3>Día libre en el plan</h3><p>Hoy no hay sesión. Si quieres, repasa tus tarjetas pendientes.</p></li>');
    else if (semana) {
      const sesiones = semana.id === 'S0' ? plan.fundamentos?.sesiones || [] : [];
      if (semana.id === 'S0') {
        const s = sesiones.find((x) => x.fecha === fecha);
        const prox = sesiones.find((x) => x.fecha > fecha);
        tarjetas.push(s
          ? `<li class="toca"><p class="etq ui">Fundamentos · 1 hora, a lápiz y sin calculadora</p><h3>${esc(s.titulo)}</h3><p>${esc(s.reparto)}</p>
              <div class="acciones"><a class="btn btn-primario" href="#/fundamentos?sesion=${esc(s.id)}">Abrir la sesión de hoy</a><a class="btn" href="#/fundamentos/practica?sesion=${esc(s.id)}">Practicar 15 ejercicios</a>${botonCrono(semana.id, 'fundamentos', 'Fundamentos')}</div></li>`
          : `<li class="toca"><p class="etq ui">Fundamentos</p><h3>Hoy no hay sesión nueva</h3><p>${prox ? `La siguiente es el ${largo(prox.fecha)}: ${esc(prox.titulo.toLowerCase())}.` : 'Ya pasaron las cinco sesiones.'} Puedes repetir ejercicios de las anteriores.</p>
              <div class="acciones"><a class="btn" href="#/fundamentos">Ver las sesiones</a></div></li>`);
      }
      for (const b of semana.id === 'S0' ? [] : bloques) {
        if (b.tipo === 'area') {
          const it = P.rubroActual(semana);
          if (!it) continue;
          tarjetas.push(`<li class="toca"><p class="etq ui">Área · ${hm(b.min)} ${esc(b.cuando || '')}</p><h3>${esc(it.nombre)}</h3>
            <p>${esc(SUGERENCIA[dia] || '')}${it.nota ? ` ${esc(it.nota)}` : ''}</p>
            <div class="acciones">${enlacesRubro(it, cat, dia)}${botonCrono(semana.id, it.clave, it.nombre)}</div></li>`);
        } else if (b.tipo === 'ingles' && semana.inglesHoras) {
          tarjetas.push(b.modo === 'simulacro'
            ? `<li class="toca"><p class="etq ui">Inglés · ${hm(b.min)}</p><h3>Simulacro de 100 preguntas</h3><p>Con reloj. Al terminar, lo que falles pasa solo al cuaderno de errores.</p>
                <div class="acciones"><a class="btn btn-primario" href="#/ingles/simulacro">Empezar el simulacro</a>${botonCrono(semana.id, 'ingles', 'Inglés')}</div></li>`
            : `<li class="toca"><p class="etq ui">Inglés · ${hm(b.min)}</p><h3>Rutina diaria</h3><p>25 minutos de gramática, 10 hablando en voz alta y grabándote, y 10 de listening con acento británico.</p>
                <div class="acciones"><a class="btn btn-primario" href="#/ingles/rutina">Empezar la rutina</a><a class="btn" href="#/ingles">Temas de inglés</a></div></li>`);
        }
      }
      if (semana.id !== 'S0' && !bloques.some((b) => b.tipo === 'area')) {
        tarjetas.push(`<li class="toca suave"><p class="etq ui">Área</p><p>${dia === 0 ? 'Domingo' : 'Viernes'}: el plan no pide sesión de área hoy.</p></li>`);
      }
    } else if (fase) {
      const prox = fase.clases.find((c) => c >= fecha);
      tarjetas.push(`<li class="toca"><p class="etq ui">${fase.seminario ? 'Seminario' : 'Entre áreas'}</p><h3>${esc(fase.titulo)}</h3><p>${esc(fase.estudio)}</p>
        ${prox ? `<p class="ui det">Próxima clase prevista: <b>${largo(prox)}</b> (${relativo(prox, fecha)}). Las fechas de clase son ilustrativas hasta que el grupo publique su calendario.</p>` : ''}
        <div class="acciones">${fase.area ? `<a class="btn btn-primario" href="#/area/${esc(fase.area)}">Abrir el área</a><a class="btn" href="#/examen?area=${esc(fase.area)}&preset=problemas">Problemas con reloj</a><a class="btn" href="#/oral?area=${esc(fase.area)}">Oral</a>` : '<a class="btn" href="#/plan">Ver la ruta</a>'}</div></li>`);
    } else {
      tarjetas.push(`<li class="toca"><h3>${fecha < inicioPlan ? 'Todavía no arranca el plan' : 'El plan ya no tiene sesiones para esta fecha'}</h3><p>Puedes estudiar por tu cuenta desde las áreas o revisar la ruta completa.</p>
        <div class="acciones"><a class="btn btn-primario" href="#/areas">Áreas</a><a class="btn" href="#/plan">Plan</a></div></li>`);
    }
    tarjetas.push(rep.hoy
      ? `<li class="toca"><p class="etq ui">Repaso · 10 minutos</p><h3>${rep.hoy} ${rep.hoy === 1 ? 'tarjeta vence' : 'tarjetas vencen'} hoy</h3><div class="acciones"><a class="btn btn-primario" href="#/repaso">Repasar</a></div></li>`
      : `<li class="toca suave"><p class="etq ui">Repaso</p><p>Sin tarjetas para hoy${rep.total ? ` (${rep.total} en el cuaderno)` : '. Lo que falles en exámenes y cuestionarios aparecerá aquí'}.</p></li>`);

    // ----- Horas de la semana o de la fase -----
    let htmlHoras = '';
    if (semana) {
      const av = P.avanceSemana(semana);
      const filas = av.area.map((it) => filaHoras({ sem: semana.id, clave: it.clave, nombre: it.nombre, hecho: it.hecho, plan: it.horas * 60, nota: it.nota, extras: it.clave === 'fundamentos' ? [30, 60] : [45, 90] }));
      if (semana.inglesHoras) filas.push(filaHoras({ sem: semana.id, clave: 'ingles', nombre: 'Inglés', hecho: av.hechoIngles, plan: av.planIngles, nota: semana.inglesNota, extras: [45, 75] }));
      const planTotal = av.planArea + av.planIngles;
      htmlHoras = `<section class="bloque"><div class="bloque-cab"><h2>Esta semana</h2><span class="ui det">${hm(av.hechoArea + av.hechoIngles)} de ${hm(planTotal)}</span></div>
        <p class="sem ui">${semana.reducida ? esc(plan.plantilla.nota) : `Plantilla de ${plan.plantilla.horasSemana} horas: área de lunes a jueves por la noche y el sábado de 07:00 a 12:00; inglés de lunes a viernes y simulacro el domingo.`}${!semana.inglesHoras && semana.inglesNota ? ` ${esc(semana.inglesNota)}` : ''}</p>
        <ul class="horas">${filas.join('')}</ul></section>`;
    } else if (fase) {
      const m = P.minutosDe(fase.id);
      htmlHoras = `<section class="bloque"><h2>Horas de esta etapa</h2><ul class="horas">
        ${filaHoras({ sem: fase.id, clave: fase.id, nombre: fase.area ? 'Área' : 'Estudio', hecho: m[fase.id] || 0, plan: 0 })}
        ${filaHoras({ sem: fase.id, clave: 'ingles', nombre: 'Inglés', hecho: m.ingles || 0, plan: 0, extras: [45, 75] })}</ul></section>`;
    }
    const ult = P.sesiones().slice(-1)[0];
    const deshacer = ult && ult.fecha === fecha ? `<p class="ui det">Último registro: ${hm(ult.min)} de ${esc(ult.nombre || ult.clave)}. <button class="enlace" type="button" data-accion="deshacer" data-t="${ult.t}">Deshacer</button></p>` : '';

    // ----- Trámites, hitos y punto de control -----
    const htmlTram = semana
      ? htmlTramites(P.tramitesDe(semana, personal), hechos, fecha, 'Trámites de la semana', semana.id === 'S4' || semana.id === 'S5' ? 'Semana de fiestas: sin trámites.' : '')
      : fase ? htmlTramites(fase.hitos.map((h, i) => ({ id: `${fase.id}-h${i}`, texto: h.texto, fecha: h.fecha })), hechos, fecha, 'Fechas de esta etapa') : '';
    const atras = P.atrasados(plan, personal, fecha);
    const htmlAtras = htmlTramites(atras.slice(-6), hechos, fecha, 'Pendientes de semanas anteriores')
      .replace('</ul></section>', `</ul>${atras.length > 6 ? `<p class="sem ui">Y ${atras.length - 6} más en el <a href="#/plan">Plan</a>.</p>` : ''}</section>`);
    const u = ultimo.leer();
    const continuar = u?.slug ? `<p class="continuar ui">Continúa donde te quedaste: <a href="#/curso/${esc(u.slug)}${u.tema ? '/' + esc(u.tema) : ''}"><b>${esc(u.titulo)}</b>${u.temaTitulo ? ', ' + esc(u.temaTitulo) : ''}</a></p>` : '';

    app.innerHTML = `<main class="idx">
      <section class="hero">
        <p class="meta ui">${contexto}</p>
        <h1>${esc(largo(fecha).replace(/^./, (c) => c.toUpperCase()))}</h1>
        <p class="lead">${cuenta}</p>
        <div class="cifras"><span>Áreas: <b>${hm(tot.area)}</b> de ${plan.totales.area} h</span><span>Inglés: <b>${hm(tot.ingles)}</b> de ${plan.totales.ingles} h</span><span>Fundamentos: <b>${hm(tot.fundamentos)}</b> de ${plan.totales.fundamentos} h</span></div>
      </section>
      ${continuar}
      <section class="bloque sin-margen"><h2>Qué toca hoy</h2><ul class="tocas">${tarjetas.join('')}</ul></section>
      ${htmlHoras}${deshacer}
      ${htmlTram}${htmlAtras}
      ${htmlPunto(P.puntos(plan, personal), fecha)}
      <section class="bloque"><h2>Método de cada bloque</h2>
        <details class="metodo"><summary class="ui">Ver los cinco pasos</summary><ol>${plan.metodo.map((m) => `<li><b>${esc(m.t)}.</b> ${esc(m.d)}</li>`).join('')}</ol></details></section>
      <footer><p><a href="#/plan">Plan completo y ruta 2027–2028</a> · <a href="#/datos">Copia de seguridad del avance</a></p>
      <p>Tu avance se guarda solo en este navegador. Guías de Ciencias y Administración: <a href="https://github.com/jairocodes/PrivStudyPage" target="_blank" rel="noopener">PrivStudyPage</a>, de jairocodes.</p></footer>
    </main>`;
  }

  app.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    const d = b.dataset;
    if (d.accion === 'crono') {
      const c = P.crono.leer();
      if (c && !confirm(`Ya hay una sesión en curso (${c.nombre}). ¿Terminarla y empezar ${d.nombre}?`)) return;
      if (c) P.crono.detener();
      P.crono.iniciar({ sem: d.sem, clave: d.clave, nombre: d.nombre });
      aviso(`Cronómetro en marcha: ${d.nombre}. Se detiene desde la barra de arriba.`);
    } else if (d.accion === 'sumar') {
      P.registrar({ sem: d.sem, clave: d.clave, min: +d.min, nombre: d.nombre });
      aviso(`Se sumaron ${hm(+d.min)} a ${d.nombre}.`);
    } else if (d.accion === 'deshacer') {
      P.borrarSesion(+d.t);
      aviso('Registro eliminado.');
    } else if (d.accion === 'pc') {
      P.responderPunto(d.id, d.valor);
      const p = P.puntos(plan, personal).find((x) => x.id === d.id);
      aviso(d.valor === 'si' ? `${d.id} cumplido.` : `Si no: ${p.siNo}`);
    }
    window.dispatchEvent(new CustomEvent('plan-cambio'));
  }, { signal: ac.signal });

  app.addEventListener('change', (ev) => {
    const c = ev.target.closest('[data-tramite]');
    if (!c) return;
    P.marcarTramite(c.dataset.tramite, c.checked);
    enfocarDeNuevo(app, pintar);
  }, { signal: ac.signal });

  // También lo dispara el cronómetro de la cabecera al registrar una sesión
  window.addEventListener('plan-cambio', () => enfocarDeNuevo(app, pintar), { signal: ac.signal });

  pintar();
  return { limpiar: () => ac.abort() };
}
