// Utilidades de interfaz compartidas por las vistas.
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const NIVEL = { B: 'Básico', I: 'Intermedio', A: 'Avanzado' };
export const LETRAS = 'abcdefg';
export const tipoDe = (e) => ('pasos' in e ? 'resuelto' : 'ops' in e ? 'quiz' : 'practica');
export const sinHTML = (s) => String(s ?? '').replace(/<[^>]+>/g, '');

export const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Actualiza la barra superior: título de contexto y avance (opcional). */
export function barra({ titulo = '', ok = null, total = null } = {}) {
  document.getElementById('barra-titulo').textContent = titulo;
  const av = document.getElementById('barra-avance');
  const prog = document.getElementById('barra-prog');
  if (total) {
    av.hidden = false;
    av.querySelector('i').style.width = `${(100 * ok) / total}%`;
    prog.textContent = `${ok}/${total} dominados`;
  } else {
    av.hidden = true;
    prog.textContent = '';
  }
}

export function iniciarTema() {
  const b = document.querySelector('.btn-tema');
  const r = document.documentElement;
  const etiqueta = () => { b.textContent = r.dataset.theme === 'light' ? 'Modo oscuro' : 'Modo claro'; };
  etiqueta();
  b.addEventListener('click', () => {
    const n = r.dataset.theme === 'light' ? 'dark' : 'light';
    r.dataset.theme = n;
    try { localStorage.setItem('guia-tema', n); } catch { /* sin almacenamiento */ }
    etiqueta();
  });
}

export function barraHTML(pct) {
  return `<span class="barra" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;
}

export const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);

/** Minutos como "45 min", "1 h" o "1 h 30". */
export function hm(min) {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
}

/** Horas con un decimal como mucho: 5 -> "5 h", 5.5 -> "5.5 h". */
export const horas = (min) => `${Math.round(min / 6) / 10} h`;

export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function hhmmss(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  return `${h ? h + ':' : ''}${String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function barajar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Aviso breve en la esquina; se lee con lectores de pantalla y desaparece solo. */
export function aviso(texto) {
  let el = document.getElementById('aviso');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aviso';
    el.className = 'aviso ui';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = texto;
  el.classList.add('visible');
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => el.classList.remove('visible'), 3500);
}

export function descargar(nombre, contenido, tipo = 'application/json') {
  const url = URL.createObjectURL(contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const t = document.createElement('textarea');
    t.value = texto;
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* sin portapapeles */ }
    t.remove();
    return ok;
  }
}

/**
 * Cuenta regresiva sobre un elemento. Devuelve {detener, restante}. Llama a alTerminar al llegar a cero.
 * Usa la hora del sistema, no la cantidad de tics, para no atrasarse con la pestaña en segundo plano.
 */
export function cuentaAtras(el, segundos, alTerminar) {
  const fin = Date.now() + segundos * 1000;
  let id = null;
  const restante = () => Math.max(0, Math.ceil((fin - Date.now()) / 1000));
  const tic = () => {
    const r = restante();
    if (el) { el.textContent = mmss(r); el.classList.toggle('poco', r <= 10); }
    if (!r) { clearInterval(id); id = null; alTerminar?.(); }
  };
  tic();
  id = setInterval(tic, 250);
  return { detener: () => { clearInterval(id); id = null; }, restante };
}

/** Opciones de una pregunta barajadas: [{texto, correcta}]. */
export const opcionesBarajadas = (correcta, distractores) => barajar([{ texto: correcta, correcta: true }, ...distractores.map((texto) => ({ texto, correcta: false }))]);
