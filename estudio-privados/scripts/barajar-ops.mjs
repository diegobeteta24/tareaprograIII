// Reubica la opción correcta de cada cuestionario para que no quede siempre en la misma letra.
// Dentro de cada tema ordena los cuestionarios por el CRC32 de su enunciado y les asigna las
// posiciones a, b, c, d por turnos, empezando en una letra que depende del título del tema: así
// las cuatro letras salen casi la misma cantidad de veces y el orden no se puede adivinar.
// Se puede escribir la correcta de primero con "ok": 0. Es idempotente: repetirlo no cambia nada.
//   node scripts/barajar-ops.mjs contenido/guias/bases-de-datos-1.json [más.json]
import fs from 'node:fs';
import { crc32 } from './comun.mjs';

const texto = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

for (const ruta of process.argv.slice(2)) {
  const curso = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  let movidas = 0, total = 0;
  const cuenta = [0, 0, 0, 0];
  for (const t of curso.temas || []) {
    const quiz = (t.ejercicios || []).filter((e) => Array.isArray(e.ops) && e.ops.length === 4 && Number.isInteger(e.ok) && e.ok >= 0 && e.ok < 4);
    const orden = [...quiz].sort((a, b) => crc32(texto(a.q)) - crc32(texto(b.q)) || texto(a.q).localeCompare(texto(b.q)));
    const inicio = crc32(texto(t.titulo)) % 4;
    orden.forEach((e, i) => {
      total++;
      const destino = (inicio + i) % 4;
      const correcta = e.ops[e.ok];
      const resto = e.ops.filter((_, k) => k !== e.ok);
      resto.splice(destino, 0, correcta);
      if (destino !== e.ok) movidas++;
      e.ops = resto;
      e.ok = destino;
      cuenta[destino]++;
    });
  }
  fs.writeFileSync(ruta, JSON.stringify(curso, null, 1) + '\n');
  console.log(`${ruta}: ${total} cuestionarios, ${movidas} reubicados (a ${cuenta[0]}, b ${cuenta[1]}, c ${cuenta[2]}, d ${cuenta[3]}).`);
}
