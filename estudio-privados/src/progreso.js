// Progreso guardado en el navegador. Usa las mismas claves que las guías HTML del motor
// (guia-<slug>-progreso con ids t<tema>-e<ejercicio>) para conservar el avance existente.
// Basado en PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes; adaptado para este proyecto.
const clave = (slug) => `guia-${slug}-progreso`;

export function leerJSON(k, porDefecto) {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

export function guardarJSON(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* almacenamiento no disponible */ }
}

export function leer(slug) {
  const v = leerJSON(clave(slug), {});
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

export const guardar = (slug, hechos) => guardarJSON(clave(slug), hechos);

/** Ejercicios dominados de un curso del catálogo (solo cuenta ids válidos). */
export function dominados(curso) {
  if (!curso.temas) return 0;
  const h = leer(curso.slug);
  let n = 0;
  curso.temas.forEach((t, i) => {
    for (let j = 1; j <= t.ejercicios; j++) if (h[`t${i + 1}-e${j}`]) n++;
  });
  return n;
}

export const ultimo = {
  leer: () => leerJSON('privados-ultimo', null),
  guardar: (v) => guardarJSON('privados-ultimo', v),
};
