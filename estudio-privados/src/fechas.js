// Fechas locales como texto AAAA-MM-DD. Se trabaja a mediodía para que ninguna resta cruce de día.
const DIA = 86400000;
const dos = (n) => String(n).padStart(2, '0');

export const iso = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

export function deISO(s) {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d, 12);
}

/** Fecha de hoy. Para revisar otra fecha del plan: sessionStorage.setItem('fecha-prueba', '2026-12-12'). */
export function hoy() {
  try {
    const p = sessionStorage.getItem('fecha-prueba');
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  } catch { /* sin almacenamiento */ }
  return iso(new Date());
}

export function sumar(s, n) {
  const d = deISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** Días de a hasta b (positivo si b es posterior). */
export const dias = (a, b) => Math.round((deISO(b) - deISO(a)) / DIA);
export const diaSemana = (s) => deISO(s).getDay();

const fmt = (op) => new Intl.DateTimeFormat('es-GT', op);
const F_LARGO = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const F_CORTO = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const F_ANIO = fmt({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const F_DIA = fmt({ day: 'numeric', month: 'short' });

export const largo = (s) => F_LARGO.format(deISO(s));
export const corto = (s) => F_CORTO.format(deISO(s)).replace(/\./g, '');
export const conAnio = (s) => F_ANIO.format(deISO(s)).replace(/\./g, '');
export const diaMes = (s) => F_DIA.format(deISO(s)).replace(/\./g, '');
export const rango = (a, b) => `${diaMes(a)} – ${a.slice(0, 4) === b.slice(0, 4) && a.slice(0, 4) === hoy().slice(0, 4) ? diaMes(b) : conAnio(b).replace(/^\S+\s/, '')}`;

/** "hoy", "mañana", "en 5 días", "hace 3 días". */
export function relativo(s, desde = hoy()) {
  const n = dias(desde, s);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n === -1) return 'ayer';
  return n > 0 ? `en ${n} días` : `hace ${-n} días`;
}
