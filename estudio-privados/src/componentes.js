// Piezas de interfaz que comparten varias vistas.
import { esc } from './ui.js';
import { corto, relativo } from './fechas.js';

/** Lista de trámites con casilla. Cada trámite: {id, texto, fecha?, sem?}. */
export function htmlTramites(lista, hechos, fecha, titulo, vacio = '') {
  if (!lista.length) return vacio ? `<section class="bloque"><h2>${titulo}</h2><p class="sem ui">${vacio}</p></section>` : '';
  const items = lista.map((t) => {
    const hecho = !!hechos[t.id];
    const tarde = !hecho && t.fecha && t.fecha < fecha;
    const cuando = t.fecha ? `<span class="cuando${tarde ? ' tarde' : ''}">${corto(t.fecha)}${hecho ? '' : ` · ${relativo(t.fecha, fecha)}`}</span>` : '';
    return `<li class="${hecho ? 'hecho' : ''}"><label><input type="checkbox" data-tramite="${esc(t.id)}"${hecho ? ' checked' : ''}><span>${esc(t.texto)}${t.sem ? ` <span class="cuando">(${esc(t.sem)})</span>` : ''}</span></label>${cuando}</li>`;
  }).join('');
  return `<section class="bloque"><h2>${titulo}</h2><ul class="tramites ui">${items}</ul></section>`;
}

/**
 * Vuelve a pintar una vista sin perder el foco del teclado: recuerda en qué control estaba
 * (por sus atributos data-) y lo enfoca otra vez cuando existe en el nuevo HTML.
 */
export function enfocarDeNuevo(raiz, pintar) {
  const a = document.activeElement;
  let selector = null;
  if (a && a !== raiz && raiz.contains(a)) {
    const partes = Object.entries(a.dataset).map(([k, v]) => `[data-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}="${CSS.escape(v)}"]`);
    if (partes.length) selector = a.tagName.toLowerCase() + partes.join('');
  }
  pintar();
  if (selector) raiz.querySelector(selector)?.focus({ preventScroll: true });
}
