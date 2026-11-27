// Exporta las fechas del plan a iCalendar (.ics) para importarlas en Google Calendar u otro calendario.
// Eventos de día completo: trámites con fecha, puntos de control, sesiones de fundamentos e hitos de 2027–2028.
import * as P from './plan.js';
import { sumar } from './fechas.js';

const escapar = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Parte líneas de más de 75 octetos, como pide el formato (RFC 5545). */
function plegar(linea) {
  const bytes = new TextEncoder().encode(linea);
  if (bytes.length <= 75) return linea;
  const partes = [];
  let actual = '', largo = 0;
  for (const ch of linea) {
    const n = new TextEncoder().encode(ch).length;
    if (largo + n > (partes.length ? 74 : 75)) { partes.push(actual); actual = ''; largo = 0; }
    actual += ch; largo += n;
  }
  partes.push(actual);
  return partes.join('\r\n ');
}

function evento({ uid, fecha, titulo, descripcion = '', alarma = true }) {
  const d = fecha.replace(/-/g, '');
  const lineas = [
    'BEGIN:VEVENT',
    `UID:${uid}@inge2028`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${sumar(fecha, 1).replace(/-/g, '')}`,
    `SUMMARY:${escapar(titulo)}`,
    ...(descripcion ? [`DESCRIPTION:${escapar(descripcion)}`] : []),
    'TRANSP:TRANSPARENT',
    ...(alarma ? ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapar(titulo)}`, 'TRIGGER:-PT15H', 'END:VALARM'] : []),
    'END:VEVENT',
  ];
  return lineas.map(plegar).join('\r\n');
}

/** Arma el calendario completo. El aviso llega a las 9:00 del día anterior (15 horas antes de la medianoche). */
export function planAICS(plan, personal = {}) {
  const ev = [];
  for (const s of plan.semanas) {
    ev.push(evento({ uid: `semana-${s.id}`, fecha: s.inicio, titulo: `${s.id}: ${s.titulo}`, descripcion: s.area.map((a) => `${a.nombre}: ${a.horas} h`).join('\n') + (s.inglesHoras ? `\nInglés: ${s.inglesHoras} h` : ''), alarma: false }));
    for (const t of P.tramitesDe(s, personal)) if (t.fecha) ev.push(evento({ uid: `tramite-${t.id}`, fecha: t.fecha, titulo: t.texto.length > 90 ? `${t.texto.slice(0, 87)}…` : t.texto, descripcion: t.texto }));
  }
  for (const x of plan.fundamentos?.sesiones || []) ev.push(evento({ uid: `fund-${x.id}`, fecha: x.fecha, titulo: `Fundamentos: ${x.titulo}`, descripcion: x.reparto, alarma: false }));
  for (const p of P.puntos(plan, personal)) ev.push(evento({ uid: `pc-${p.id}`, fecha: p.fecha, titulo: `${p.id}: ${p.pregunta}`, descripcion: `Si la respuesta es no: ${p.siNo}` }));
  for (const f of P.fases(plan)) {
    f.hitos.forEach((h, i) => ev.push(evento({ uid: `hito-${f.id}-${i}`, fecha: h.fecha, titulo: h.texto.length > 90 ? `${h.texto.slice(0, 87)}…` : h.texto, descripcion: `${f.titulo}. ${h.texto}` })));
    f.clases.forEach((c, i) => ev.push(evento({ uid: `clase-${f.id}-${i}`, fecha: c, titulo: `Clase ${i + 1} prevista: ${f.titulo}`, descripcion: 'Fecha ilustrativa: ajústala cuando el grupo publique su calendario.', alarma: false })));
  }
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Inge 2028//Plan de estudio//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', plegar(`X-WR-CALNAME:${escapar(`Inge 2028 · ${plan.nombre}`)}`), 'X-WR-TIMEZONE:America/Guatemala', ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n';
}
