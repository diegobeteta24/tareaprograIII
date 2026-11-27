// Arranque y enrutador por hash:
//   #/                        hoy: qué toca según el plan
//   #/plan                    semanas, ruta 2027–2028 y puntos de control
//   #/areas                   las tres áreas del seminario
//   #/area/:area              bloques y cursos del área
//   #/curso/:slug[/tN]        guía del curso, opcionalmente en el tema N
//   #/examen[?area=&bloque=]  modo examen
//   #/oral                    práctica del examen oral
//   #/repaso                  cuaderno de errores
//   #/fundamentos             aritmética y álgebra sin calculadora
//   #/ingles[/...]            examen de ubicación de inglés
//   #/datos                   copia de seguridad del avance
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
import '@fontsource-variable/archivo';
import '@fontsource-variable/literata';
import '@fontsource-variable/literata/wght-italic.css';
import './estilos.css';
import { iniciarTema, barra, esc, aviso, hhmmss, hm } from './ui.js';
import { crono } from './plan.js';
import { resumen as resumenRepaso } from './repaso.js';
import vistaHoy from './vistas/hoy.js';
import vistaPlan from './vistas/plan.js';
import vistaInicio from './vistas/inicio.js';
import vistaArea from './vistas/area.js';
import vistaCurso from './vistas/curso.js';
import vistaExamen from './vistas/examen.js';
import vistaOral from './vistas/oral.js';
import vistaRepaso from './vistas/repaso.js';
import vistaFundamentos from './vistas/fundamentos.js';
import vistaIngles from './vistas/ingles.js';
import vistaDatos from './vistas/datos.js';

const app = document.getElementById('app');
let actual = null; // { limpiar?, slug?, irA? }

const VISTAS = {
  undefined: [vistaHoy, 'hoy'],
  plan: [vistaPlan, 'plan'],
  areas: [vistaInicio, 'areas'],
  area: [vistaArea, 'areas'],
  curso: [vistaCurso, 'areas'],
  examen: [vistaExamen, 'examen'],
  oral: [vistaOral, 'oral'],
  repaso: [vistaRepaso, 'repaso'],
  fundamentos: [vistaFundamentos, 'fundamentos'],
  ingles: [vistaIngles, 'ingles'],
  datos: [vistaDatos, 'plan'],
};

function parsear() {
  const h = location.hash.replace(/^#\/?/, '');
  const [ruta, qs = ''] = h.split('?');
  return { partes: ruta.split('/').filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(qs) };
}

/** Número de tarjetas que vencen hoy, junto al enlace de Repaso. */
export function pintarRepaso() {
  const el = document.getElementById('nav-repaso');
  const n = resumenRepaso().hoy;
  el.hidden = !n;
  el.textContent = n;
  el.setAttribute('aria-label', `${n} tarjetas para hoy`);
}

async function navegar() {
  const { partes, q } = parsear();
  const [seccion, ...resto] = partes;

  // Dentro del mismo curso solo se desplaza al tema
  if (seccion === 'curso' && actual?.slug && actual.slug === resto[0]) {
    actual.irA?.(resto[1]);
    return;
  }

  actual?.limpiar?.();
  actual = null;
  barra();
  const [vista, nav] = VISTAS[seccion] || [];
  document.querySelectorAll('.nav-top a').forEach((a) => {
    const activo = a.dataset.nav === nav;
    a.classList.toggle('activo', activo);
    if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  // En pantallas angostas el menú se desliza de lado: que la pestaña activa quede a la vista
  const activa = document.querySelector('.nav-top a.activo');
  const menu = document.querySelector('.nav-top');
  if (activa && menu.scrollWidth > menu.clientWidth) menu.scrollLeft = activa.offsetLeft - (menu.clientWidth - activa.offsetWidth) / 2;
  pintarRepaso();
  window.scrollTo(0, 0);
  try {
    if (!vista) throw Object.assign(new Error('Página no encontrada'), { noEncontrada: true });
    actual = (await vista(app, resto, q)) || {};
    app.focus({ preventScroll: true });
  } catch (e) {
    if (!e.noEncontrada) console.error(e);
    document.title = 'Inge 2028';
    app.innerHTML = `<main class="idx"><section class="hero"><h1>${e.noEncontrada ? 'Página no encontrada' : 'No se pudo cargar'}</h1>
      <p class="lead">${e.noEncontrada ? 'La dirección no corresponde a ninguna sección.' : 'Revisa que los datos estén generados (<code>npm run datos</code>) y vuelve a intentarlo.'}</p>
      <p class="ui" style="color:var(--muted);font-size:14px">${esc(e.noEncontrada ? location.hash : e.message)}</p>
      <p><a class="btn btn-primario" href="#/">Ir al inicio</a></p></section></main>`;
  }
}

// ---------- Cronómetro de sesión en la cabecera ----------
function iniciarCrono() {
  const caja = document.getElementById('crono');
  const texto = document.getElementById('crono-texto');
  const pausa = document.getElementById('crono-pausa');
  const pintar = () => {
    const c = crono.leer();
    caja.hidden = !c;
    if (!c) return;
    texto.textContent = `${hhmmss(crono.transcurrido(c))} · ${c.nombre}`;
    pausa.textContent = c.pausado ? 'Seguir' : 'Pausar';
    pausa.setAttribute('aria-label', c.pausado ? 'Reanudar la sesión' : 'Pausar la sesión');
    caja.classList.toggle('pausado', !!c.pausado);
  };
  pausa.addEventListener('click', () => { crono.alternar(); pintar(); });
  document.getElementById('crono-fin').addEventListener('click', () => {
    const c = crono.leer();
    const s = crono.detener();
    pintar();
    aviso(s ? `Sesión registrada: ${hm(s.min)} de ${c.nombre}.` : 'La sesión duró menos de un minuto; no se registró.');
    window.dispatchEvent(new CustomEvent('plan-cambio'));
  });
  window.addEventListener('plan-cambio', pintar);
  setInterval(pintar, 1000);
  pintar();
}

iniciarTema();
iniciarCrono();
window.addEventListener('repaso-cambio', pintarRepaso);
window.addEventListener('hashchange', navegar);
navegar();
