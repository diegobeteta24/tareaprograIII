// Descarga las guías de PrivStudyPage (https://github.com/jairocodes/PrivStudyPage) en
// privados-umg/privados-umg/, fijadas a un commit revisado. No se guardan en este repositorio:
// el original no publica licencia, así que su contenido se usa desde su fuente y con crédito.
//   node scripts/traer-guias.mjs                 descarga solo si faltan (lo llama npm run datos)
//   node scripts/traer-guias.mjs --forzar        vuelve a descargar todo
//   node scripts/traer-guias.mjs --desde <dir>   copia desde un clon local de PrivStudyPage
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './comun.mjs';

const REPO = 'jairocodes/PrivStudyPage';
const COMMIT = 'ca11d86233f2949138ced2a171bb3eea8083e5f7'; // release 1.1.0, revisado el 26-nov-2026
const BASE = 'privados-umg/privados-umg';
const DESTINO = path.join(RAIZ, BASE);
const CURSOS = ['administracion-ti', 'algebra-lineal', 'arquitectura-computadoras-1', 'arquitectura-computadoras-2', 'automatas-lenguajes-formales', 'calculo-1', 'calculo-2', 'compiladores', 'contabilidad-1', 'contabilidad-2', 'derecho-informatico', 'desarrollo-humano-profesional', 'electronica-analogica', 'electronica-digital', 'emprendedores-negocios', 'estadistica-1', 'estadistica-2', 'etica-profesional', 'fisica-1', 'fisica-2', 'inteligencia-artificial', 'investigacion-operaciones', 'matematica-discreta', 'metodologia-investigacion', 'metodos-numericos', 'microeconomia', 'precalculo', 'proceso-administrativo', 'redes-1', 'redes-2', 'seguridad-auditoria-sistemas', 'seminario-ti', 'sistemas-operativos-1', 'sistemas-operativos-2', 'telecomunicaciones'];
const ARCHIVOS = ['SKILL.md', 'references/cursos.csv', 'references/cursos.md', 'references/lecciones.md', 'references/modelo-datos.md', ...CURSOS.map((c) => `data/${c}.json`)];

const args = process.argv.slice(2);
const forzar = args.includes('--forzar');
const desde = args.includes('--desde') ? path.resolve(args[args.indexOf('--desde') + 1] || '') : null;

const completo = () => ARCHIVOS.every((f) => fs.existsSync(path.join(DESTINO, f)));
if (completo() && !forzar && !desde) process.exit(0);

async function obtener(rel) {
  if (desde) {
    const ruta = fs.existsSync(path.join(desde, BASE, rel)) ? path.join(desde, BASE, rel) : path.join(desde, rel);
    return fs.readFileSync(ruta);
  }
  const url = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/${BASE}/${rel}`;
  for (let intento = 1; ; intento++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (intento >= 3) throw new Error(`${rel}: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 800 * intento));
    }
  }
}

console.log(`Trayendo las guías de PrivStudyPage (${REPO}, commit ${COMMIT.slice(0, 7)})${desde ? ` desde ${desde}` : ''}…`);
const temporal = `${DESTINO}.descarga`;
fs.rmSync(temporal, { recursive: true, force: true });
try {
  let hechos = 0;
  const cola = [...ARCHIVOS];
  const trabajador = async () => {
    for (let rel = cola.shift(); rel; rel = cola.shift()) {
      const datos = await obtener(rel);
      if (rel.endsWith('.json')) JSON.parse(datos.toString('utf8')); // que no llegue un archivo cortado
      const ruta = path.join(temporal, rel);
      fs.mkdirSync(path.dirname(ruta), { recursive: true });
      fs.writeFileSync(ruta, datos);
      hechos++;
    }
  };
  await Promise.all(Array.from({ length: 6 }, trabajador));
  fs.rmSync(DESTINO, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.renameSync(temporal, DESTINO);
  fs.writeFileSync(path.join(DESTINO, 'ORIGEN.txt'), `Descargado de https://github.com/${REPO} (commit ${COMMIT}) el ${new Date().toISOString()}.\nNo se versiona en este repositorio: ver README.md, sección Créditos.\n`);
  console.log(`Listo: ${hechos} archivos en ${BASE}/.`);
} catch (e) {
  fs.rmSync(temporal, { recursive: true, force: true });
  console.error(`\nNo se pudieron descargar las guías: ${e.message}`);
  console.error('Revisa tu conexión y vuelve a intentar, o clona el repositorio y copia desde ahí:');
  console.error(`  git clone https://github.com/${REPO}.git ../PrivStudyPage`);
  console.error('  node scripts/traer-guias.mjs --desde ../PrivStudyPage');
  process.exit(1);
}
