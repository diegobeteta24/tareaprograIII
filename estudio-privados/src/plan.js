// Lógica del plan: en qué semana o fase cae una fecha, horas registradas, trámites y cronómetro.
// El plan viene de contenido/plan/plan.json; lo que hace el estudiante se guarda en localStorage.
import { leerJSON, guardarJSON } from './progreso.js';
import { hoy, sumar, dias, diaSemana } from './fechas.js';

const K = { sesiones: 'plan-sesiones', tramites: 'plan-tramites', ajustes: 'plan-ajustes', crono: 'plan-cronometro', puntos: 'plan-puntos' };

// ---------- Fechas del plan ----------
export const arranque = (plan) => leerJSON(K.ajustes, {})?.arranque || plan.arranqueSeminario;
export const arranqueCambiado = (plan) => arranque(plan) !== plan.arranqueSeminario;

export function fijarArranque(plan, fecha) {
  const a = leerJSON(K.ajustes, {}) || {};
  if (!fecha || fecha === plan.arranqueSeminario) delete a.arranque; else a.arranque = fecha;
  guardarJSON(K.ajustes, a);
}

export const semanaDe = (plan, fecha = hoy()) => plan.semanas.find((s) => s.inicio <= fecha && fecha <= s.fin) || null;

/** Fases de 2027 y 2028 con fechas reales: todo se corre junto con el arranque del seminario. */
export function fases(plan) {
  const a = arranque(plan);
  const lista = plan.fases.map((f) => {
    const fin = sumar(a, f.finDesdeArranque);
    return {
      ...f,
      inicio: f.inicio || sumar(a, f.inicioDesdeArranque),
      fin,
      clases: (f.clases || []).map((n) => sumar(a, n)),
      hitos: (f.hitos || []).map((h) => ({ ...h, fecha: sumar(a, h.desdeArranque) })),
    };
  });
  // Si el arranque se adelanta mucho, la primera fase (fija en febrero) no puede terminar antes de empezar
  return lista.filter((f) => f.inicio <= f.fin);
}

export const faseDe = (plan, fecha = hoy()) => fases(plan).find((f) => f.inicio <= fecha && fecha <= f.fin) || null;

export function puntos(plan, personal = {}) {
  const a = arranque(plan);
  const resp = leerJSON(K.puntos, {}) || {};
  return plan.puntosDeControl.map((p) => ({
    ...p,
    ...(personal.puntosDeControl?.[p.id] || {}),
    fecha: p.fecha || sumar(a, p.desdeArranque),
    respuesta: resp[p.id] ?? null,
  }));
}

export function responderPunto(id, valor) {
  const r = leerJSON(K.puntos, {}) || {};
  if (valor === null) delete r[id]; else r[id] = valor;
  guardarJSON(K.puntos, r);
}

/** Lo que el plan pide para un día de la semana (0 = domingo). */
export function plantillaDe(plan, fecha) {
  if (plan.libres.includes(fecha)) return { libre: true, bloques: [] };
  return { libre: false, bloques: plan.plantilla.dias[diaSemana(fecha)] || [] };
}

// ---------- Sesiones de estudio ----------
export const sesiones = () => {
  const v = leerJSON(K.sesiones, []);
  return Array.isArray(v) ? v : [];
};

/** Suma minutos a un rubro. sem: id de semana o de fase; clave: rubro del plan o "ingles". */
export function registrar({ sem, clave, min, fecha = hoy(), nombre = '' }) {
  const m = Math.round(min);
  if (!(m > 0)) return null;
  const s = { t: Date.now(), fecha, sem, clave, min: m, nombre };
  guardarJSON(K.sesiones, [...sesiones(), s]);
  return s;
}

export function borrarSesion(t) {
  guardarJSON(K.sesiones, sesiones().filter((s) => s.t !== t));
}

/** Minutos por rubro dentro de una semana o fase. */
export function minutosDe(sem) {
  const m = {};
  for (const s of sesiones()) if (s.sem === sem) m[s.clave] = (m[s.clave] || 0) + s.min;
  return m;
}

/** Avance de una semana: horas planificadas y minutos hechos, de área y de inglés. */
export function avanceSemana(semana) {
  const m = minutosDe(semana.id);
  const area = semana.area.map((it) => ({ ...it, hecho: m[it.clave] || 0 }));
  const hechoArea = Object.entries(m).filter(([k]) => k !== 'ingles').reduce((s, [, v]) => s + v, 0);
  return {
    area,
    planArea: semana.area.reduce((s, it) => s + it.horas, 0) * 60,
    hechoArea,
    planIngles: semana.inglesHoras * 60,
    hechoIngles: m.ingles || 0,
  };
}

/** Rubro en el que conviene seguir: el primero de la semana que no ha llegado a sus horas. */
export function rubroActual(semana) {
  const { area } = avanceSemana(semana);
  return area.find((it) => it.hecho < it.horas * 60) || area[area.length - 1] || null;
}

export function totales(plan) {
  const t = { area: 0, ingles: 0, fundamentos: 0 };
  const idsSemana = new Set(plan.semanas.map((s) => s.id));
  for (const s of sesiones()) {
    if (s.clave === 'ingles') t.ingles += s.min;
    else if (s.clave === 'fundamentos') t.fundamentos += s.min;
    else if (idsSemana.has(s.sem)) t.area += s.min;
  }
  return t;
}

// ---------- Trámites ----------
export const tramitesHechos = () => leerJSON(K.tramites, {}) || {};

export function marcarTramite(id, hecho) {
  const t = tramitesHechos();
  if (hecho) t[id] = hoy(); else delete t[id];
  guardarJSON(K.tramites, t);
}

/** Trámites de una semana: los del plan más los personales (personal/mis-datos.json). */
export const tramitesDe = (semana, personal = {}) => [...(semana.tramites || []), ...(personal.tramites?.[semana.id] || [])];

/** Trámites de semanas ya pasadas que siguen sin marcar. */
export function atrasados(plan, personal, fecha = hoy()) {
  const hechos = tramitesHechos();
  return plan.semanas
    .filter((s) => s.fin < fecha)
    .flatMap((s) => tramitesDe(s, personal).filter((t) => !hechos[t.id]).map((t) => ({ ...t, sem: s.id })));
}

// ---------- Cronómetro de sesión ----------
// Guarda la hora de inicio, no un contador: sobrevive a recargar la página o cerrar la pestaña.
export const crono = {
  leer: () => leerJSON(K.crono, null),
  iniciar({ sem, clave, nombre }) {
    guardarJSON(K.crono, { sem, clave, nombre, inicio: Date.now(), acumulado: 0, pausado: false });
  },
  transcurrido(c = crono.leer()) {
    if (!c) return 0;
    return c.acumulado + (c.pausado ? 0 : Date.now() - c.inicio);
  },
  alternar() {
    const c = crono.leer();
    if (!c) return;
    if (c.pausado) guardarJSON(K.crono, { ...c, pausado: false, inicio: Date.now() });
    else guardarJSON(K.crono, { ...c, pausado: true, acumulado: crono.transcurrido(c) });
  },
  /** Termina y registra la sesión. Devuelve la sesión guardada o null si duró menos de un minuto. */
  detener() {
    const c = crono.leer();
    if (!c) return null;
    const min = Math.round(crono.transcurrido(c) / 60000);
    try { localStorage.removeItem(K.crono); } catch { /* sin almacenamiento */ }
    return min >= 1 ? registrar({ sem: c.sem, clave: c.clave, min, nombre: c.nombre }) : null;
  },
  descartar() {
    try { localStorage.removeItem(K.crono); } catch { /* sin almacenamiento */ }
  },
};

/** Días que faltan para una fecha (negativo si ya pasó). */
export const faltan = (fecha, desde = hoy()) => dias(desde, fecha);
