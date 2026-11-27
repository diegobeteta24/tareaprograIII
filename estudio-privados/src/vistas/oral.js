// Práctica del examen oral: un concepto o un tema al azar, tiempo para preparar, reloj para hablar,
// grabación opcional y autoevaluación contra la explicación de la guía. Lo que falte pasa al cuaderno.
import { cargarCatalogo, cargarCurso, ambitos as listaAmbitos } from '../datos.js';
import { leerJSON, guardarJSON } from '../progreso.js';
import { fallar, idConcepto } from '../repaso.js';
import { formulas } from '../katex.js';
import { puedeGrabar, grabar } from '../grabadora.js';
import { esc, barra, barajar, cuentaAtras, sinHTML, aviso } from '../ui.js';

const CLAVE = 'oral-config';
const CLAVE_HIST = 'oral-historial';
const CHEQUEO = ['Di la definición con las palabras que espera el examinador.', 'Di dónde se usa, con un ejemplo concreto.', 'Expliqué por qué importa.', 'Dije cuándo y cómo se aplica.'];

function ambitoDe(cat, q, opciones) {
  if (q.get('cursos')) {
    const slugs = q.get('cursos').split(',');
    const cursos = cat.areas.flatMap((a) => a.bloques.flatMap((b) => b.cursos)).filter((c) => slugs.includes(c.slug) && !c.pendiente);
    if (cursos.length) return { valor: `cursos:${slugs.join(',')}`, etiqueta: cursos.map((c) => c.titulo).join(', '), grupo: 'Del plan', cursos };
  }
  const pedido = q.get('area') ? (q.get('bloque') ? `bloque:${q.get('area')}:${q.get('bloque')}` : `area:${q.get('area')}`) : null;
  return opciones.find((o) => o.valor === pedido) || null;
}

export default async function vistaOral(app, _p, q) {
  const cat = await cargarCatalogo();
  const opciones = listaAmbitos(cat);
  const delPlan = ambitoDe(cat, q, opciones);
  if (delPlan && !opciones.includes(delPlan)) opciones.unshift(delPlan);
  document.title = 'Oral | Inge 2028';
  barra({ titulo: 'Práctica del oral' });

  const guardada = leerJSON(CLAVE, {}) || {};
  const config = {
    ambito: delPlan?.valor || (opciones.some((o) => o.valor === guardada.ambito) ? guardada.ambito : opciones[0]?.valor),
    cantidad: guardada.cantidad || 2,
    prepara: guardada.prepara ?? 30,
    habla: guardada.habla ?? 120,
    modo: guardada.modo || 'concepto',
    grabar: guardada.grabar ?? false,
  };
  let reloj = null;
  let rec = null;
  const detener = () => { reloj?.detener(); reloj = null; rec?.detener(); rec = null; };

  function pantallaConfig() {
    detener();
    const grupos = [...new Set(opciones.map((o) => o.grupo))];
    const select = grupos.map((g) => `<optgroup label="${esc(g)}">${opciones.filter((o) => o.grupo === g).map((o) => `<option value="${esc(o.valor)}"${o.valor === config.ambito ? ' selected' : ''}>${esc(o.etiqueta)}</option>`).join('')}</optgroup>`).join('');
    const hist = (leerJSON(CLAVE_HIST, []) || []).slice(0, 6);
    const sel = (nombre, valores, actual) => `<select name="${nombre}">${valores.map(([v, t]) => `<option value="${v}"${v === actual ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
    app.innerHTML = `<main class="idx">
      <p class="migas ui"><a href="#/">Hoy</a></p>
      <section class="hero"><h1>Práctica del oral</h1>
        <p class="lead">En el oral te piden desarrollar un tema en voz alta, y quien lo pierde pierde el área. Aquí sale un concepto o un tema al azar: lo preparas, lo explicas con reloj y después lo comparas con la guía. Lo que te falte pasa al cuaderno de errores.</p></section>
      <form class="form-examen ui" id="form-oral">
        <label>¿De dónde salen los temas?<select name="ambito">${select}</select></label>
        <label>Qué te preguntan${sel('modo', [['concepto', 'Un concepto (definir y explicar)'], ['tema', 'Un tema completo (desarrollarlo)']], config.modo)}</label>
        <label>Cuántos${sel('cantidad', [[1, '1'], [2, '2'], [3, '3'], [5, '5']], config.cantidad)}</label>
        <label>Tiempo para preparar${sel('prepara', [[0, 'Sin preparación'], [30, '30 segundos'], [60, '1 minuto'], [120, '2 minutos']], config.prepara)}</label>
        <label>Tiempo para hablar${sel('habla', [[60, '1 minuto'], [120, '2 minutos'], [180, '3 minutos'], [300, '5 minutos']], config.habla)}</label>
        ${puedeGrabar() ? `<label class="check"><input type="checkbox" name="grabar"${config.grabar ? ' checked' : ''}> Grabarme para escucharme después (pide permiso del micrófono; el audio no se guarda)</label>` : '<p class="ayuda">Este navegador no permite grabar; la práctica funciona igual.</p>'}
        <p><button class="btn btn-primario" type="submit">Empezar</button></p>
      </form>
      ${hist.length ? `<section class="bloque"><h2>Últimas prácticas</h2><ul class="historial">${hist.map((h) => `<li>${new Date(h.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })} · ${esc(h.ambito)} · <b>${h.bien}/${h.total}</b> bien explicados</li>`).join('')}</ul></section>` : ''}
    </main>`;
    const form = app.querySelector('#form-oral');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      Object.assign(config, { ambito: form.ambito.value, modo: form.modo.value, cantidad: +form.cantidad.value, prepara: +form.prepara.value, habla: +form.habla.value, grabar: !!form.grabar?.checked });
      if (!delPlan || config.ambito !== delPlan.valor) guardarJSON(CLAVE, config);
      comenzar();
    });
  }

  async function comenzar() {
    const ambito = opciones.find((o) => o.valor === config.ambito);
    app.innerHTML = '<p class="cargando ui">Buscando temas…</p>';
    const cursos = await Promise.all(ambito.cursos.map((c) => cargarCurso(c.slug)));
    const banco = [];
    for (const c of cursos) {
      c.temas.forEach((t, ti) => {
        if (config.modo === 'tema') banco.push({ c, t, ti, titulo: sinHTML(t.titulo) });
        else (t.conceptos || []).forEach((co, ci) => banco.push({ c, t, ti, co, ci, titulo: sinHTML(co.n) }));
      });
    }
    if (!banco.length) { aviso('Ese ámbito no tiene conceptos para practicar.'); pantallaConfig(); return; }
    const ronda = barajar(banco).slice(0, config.cantidad);
    const resultados = [];
    let i = 0;

    function cabecera(fase) {
      return `<div class="examen-cab ui"><span>${config.modo === 'tema' ? 'Tema' : 'Concepto'} ${i + 1} de ${ronda.length} · ${fase}</span><span class="reloj" id="or-reloj" role="timer" aria-live="off"></span><button class="btn" type="button" id="or-salir">Salir</button></div>`;
    }
    const pedido = (x) => `<p class="origen">${esc(x.c.titulo)} · ${x.t.titulo}</p><h2 class="oral-tema">${config.modo === 'tema' ? `Desarrolla el tema: ${x.t.titulo}` : `Explica: ${x.co.n}`}</h2>`;

    function preparar() {
      const x = ronda[i];
      if (!config.prepara) return hablar();
      app.innerHTML = `<main class="idx">${cabecera('preparación')}<article class="ej examen-q">${pedido(x)}
        <p class="ui det">Ordena tu respuesta: definición, un ejemplo, por qué importa y cuándo se aplica.</p>
        <div class="acciones"><button class="btn btn-primario" type="button" id="or-ya">Estoy listo</button></div></article></main>`;
      formulas(app);
      app.querySelector('#or-salir').addEventListener('click', fin);
      app.querySelector('#or-ya').addEventListener('click', hablar);
      app.querySelector('#or-ya').focus({ preventScroll: true });
      reloj = cuentaAtras(app.querySelector('#or-reloj'), config.prepara, hablar);
    }

    async function hablar() {
      detener();
      const x = ronda[i];
      app.innerHTML = `<main class="idx">${cabecera('habla')}<article class="ej examen-q">${pedido(x)}
        <p class="ui det" id="or-estado">${config.grabar ? 'Pidiendo el micrófono…' : 'Habla en voz alta, como frente al examinador.'}</p>
        <div class="acciones"><button class="btn btn-primario" type="button" id="or-fin">Terminé</button></div></article></main>`;
      formulas(app);
      app.querySelector('#or-salir').addEventListener('click', fin);
      const terminar = () => comparar();
      app.querySelector('#or-fin').addEventListener('click', terminar);
      app.querySelector('#or-fin').focus({ preventScroll: true });
      if (config.grabar) {
        try {
          rec = await grabar();
          const e = app.querySelector('#or-estado');
          if (e) e.textContent = 'Grabando. Habla en voz alta, como frente al examinador.';
        } catch {
          const e = app.querySelector('#or-estado');
          if (e) e.textContent = 'No se pudo usar el micrófono; sigue sin grabar.';
        }
      }
      reloj = cuentaAtras(app.querySelector('#or-reloj'), config.habla, terminar);
    }

    async function comparar() {
      reloj?.detener(); reloj = null;
      const audio = rec ? await rec.detener() : null;
      rec = null;
      const x = ronda[i];
      const explicacion = config.modo === 'tema'
        ? `${x.t.intro ? `<p class="intro">${x.t.intro}</p>` : ''}${(x.t.conceptos || []).map((co) => `<h4>${co.n}</h4>${[].concat(co.e).map((p) => `<p>${p}</p>`).join('')}`).join('')}`
        : `${[].concat(x.co.e).map((p) => `<p>${p}</p>`).join('')}${x.co.f ? `<div class="pizarra">\\[${x.co.f}\\]</div>` : ''}
           <dl class="uso"><div><dt>Dónde se usa</dt><dd>${x.co.u[0]}</dd></div><div><dt>Por qué</dt><dd>${x.co.u[1]}</dd></div><div><dt>Cuándo</dt><dd>${x.co.u[2]}</dd></div><div><dt>Cómo</dt><dd>${x.co.u[3]}</dd></div></dl>`;
      app.innerHTML = `<main class="idx"><div class="examen-cab ui"><span>${config.modo === 'tema' ? 'Tema' : 'Concepto'} ${i + 1} de ${ronda.length} · comparación</span><button class="btn" type="button" id="or-salir">Salir</button></div>
        <article class="ej examen-q">${pedido(x)}
        ${audio ? `<p class="ui det">Tu respuesta:</p><audio controls src="${audio}"></audio>` : ''}
        <h3 class="ui">Lo que dice la guía</h3><div class="concepto">${explicacion}</div>
        <fieldset class="chequeo ui"><legend>¿Qué lograste?</legend>${CHEQUEO.map((t, k) => `<label><input type="checkbox" data-k="${k}"> ${t}</label>`).join('')}</fieldset>
        <div class="acciones"><button class="btn btn-primario" type="button" data-ok="1">Lo expliqué bien</button><button class="btn" type="button" data-ok="0">Me faltó</button></div>
        <p class="ui det"><a href="#/curso/${esc(x.c.slug)}/t${x.ti + 1}">Abrir el tema en la guía</a></p></article></main>`;
      formulas(app);
      app.querySelector('#or-salir').addEventListener('click', fin);
      app.querySelectorAll('[data-ok]').forEach((b) => b.addEventListener('click', () => {
        const ok = b.dataset.ok === '1';
        resultados.push({ titulo: x.titulo, curso: x.c.titulo, ok });
        if (!ok) {
          // Si practicó un tema completo, al cuaderno van sus conceptos
          const lista = config.modo === 'tema' ? (x.t.conceptos || []).map((_, ci) => ci) : [x.ci];
          for (const ci of lista) fallar(idConcepto(x.c.slug, `t${x.ti + 1}-c${ci + 1}`), `Oral · ${x.c.titulo} · ${sinHTML(x.t.conceptos[ci].n)}`);
          window.dispatchEvent(new CustomEvent('repaso-cambio'));
        }
        if (audio) URL.revokeObjectURL(audio);
        i++;
        if (i < ronda.length) preparar(); else fin();
      }));
      window.scrollTo(0, 0);
    }

    function fin() {
      detener();
      const bien = resultados.filter((r) => r.ok).length;
      if (resultados.length) {
        const h = leerJSON(CLAVE_HIST, []) || [];
        h.unshift({ fecha: Date.now(), ambito: ambito.etiqueta, total: resultados.length, bien });
        guardarJSON(CLAVE_HIST, h.slice(0, 30));
      }
      app.innerHTML = `<main class="idx"><section class="hero"><h1>Práctica terminada</h1>
        <p class="lead">${resultados.length ? `${bien} de ${resultados.length} bien explicados.${bien < resultados.length ? ' Lo que te faltó quedó en el cuaderno de errores para mañana.' : ''}` : 'No terminaste ningún tema.'}</p>
        ${resultados.length ? `<ul class="rubros ui">${resultados.map((r) => `<li><span class="nom">${esc(r.titulo)}</span><span class="det">${esc(r.curso)} · ${r.ok ? 'bien' : 'me faltó'}</span></li>`).join('')}</ul>` : ''}
        <p class="acciones"><button class="btn btn-primario" type="button" id="or-otra">Otra ronda</button><button class="btn" type="button" id="or-config">Cambiar configuración</button></p></section></main>`;
      app.querySelector('#or-otra').addEventListener('click', comenzar);
      app.querySelector('#or-config').addEventListener('click', pantallaConfig);
    }

    preparar();
  }

  if (!opciones.length) {
    app.innerHTML = '<main class="idx"><section class="hero"><h1>Práctica del oral</h1><p class="lead">Todavía no hay guías publicadas.</p></section></main>';
    return {};
  }
  pantallaConfig();
  return { limpiar: detener };
}
