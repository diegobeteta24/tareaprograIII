// Copia de seguridad del avance: todo vive en localStorage de este navegador, así que se puede
// exportar a un archivo e importarlo en otro navegador o computadora.
import { esc, barra, descargar, aviso } from '../ui.js';
import { hoy } from '../fechas.js';

const PREFIJOS = ['guia-', 'privados-', 'plan-', 'repaso-', 'fund-', 'ingles-', 'oral-'];
const propia = (k) => PREFIJOS.some((p) => k.startsWith(p));

function claves() {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (propia(k)) out.push(k); } } catch { /* sin almacenamiento */ }
  return out.sort();
}

export default async function vistaDatos(app) {
  document.title = 'Copia de seguridad | Inge 2028';
  barra({ titulo: 'Copia de seguridad' });

  function pintar() {
    const ks = claves();
    const tam = ks.reduce((s, k) => s + (localStorage.getItem(k) || '').length, 0);
    app.innerHTML = `<main class="idx"><p class="migas ui"><a href="#/plan">Plan</a></p>
      <section class="hero"><h1>Copia de seguridad</h1>
        <p class="lead">Tu avance (horas registradas, trámites, ejercicios dominados, cuaderno de errores, resultados de exámenes e inglés) se guarda solo en este navegador. Si borras los datos del navegador o cambias de computadora, se pierde: exporta una copia de vez en cuando.</p>
        <div class="cifras"><span><b>${ks.length}</b> registros</span><span><b>${Math.max(1, Math.round(tam / 1024))}</b> KB</span></div>
        <div class="acciones"><button class="btn btn-primario" type="button" id="d-exportar">Exportar copia</button>
          <label class="btn" for="d-archivo">Importar copia</label><input type="file" id="d-archivo" accept="application/json,.json" hidden>
          <button class="btn" type="button" id="d-borrar">Borrar todo el avance</button></div>
        <p class="ui det">Importar reemplaza los registros que vengan en el archivo y deja los demás como están.</p>
      </section>
      ${ks.length ? `<section class="bloque sin-margen"><h2>Qué hay guardado</h2><ul class="rubros ui">${ks.map((k) => `<li><span class="nom"><code>${esc(k)}</code></span><span class="det">${Math.max(1, Math.round((localStorage.getItem(k) || '').length / 1024))} KB</span></li>`).join('')}</ul></section>` : ''}
    </main>`;
    app.querySelector('#d-exportar').addEventListener('click', () => {
      const datos = Object.fromEntries(claves().map((k) => [k, localStorage.getItem(k)]));
      descargar(`inge2028-avance-${hoy()}.json`, JSON.stringify({ app: 'estudio-privados', version: 1, exportado: new Date().toISOString(), datos }, null, 1));
    });
    app.querySelector('#d-archivo').addEventListener('change', async (ev) => {
      const f = ev.target.files?.[0];
      if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        if (j.app !== 'estudio-privados' || typeof j.datos !== 'object') throw new Error('El archivo no es una copia de esta aplicación.');
        const ks = Object.keys(j.datos).filter(propia);
        if (!confirm(`Se importarán ${ks.length} registros del ${new Date(j.exportado).toLocaleString('es-GT')}. Los que ya existan se reemplazan. ¿Continuar?`)) return;
        for (const k of ks) localStorage.setItem(k, j.datos[k]);
        aviso(`Se importaron ${ks.length} registros.`);
        window.dispatchEvent(new CustomEvent('plan-cambio'));
        window.dispatchEvent(new CustomEvent('repaso-cambio'));
        pintar();
      } catch (e) {
        aviso(`No se pudo importar: ${e.message}`);
      }
    });
    app.querySelector('#d-borrar').addEventListener('click', () => {
      if (!confirm('Esto borra todo tu avance de este navegador. ¿Exportaste una copia antes?')) return;
      if (!confirm('Última confirmación: ¿borrar todo el avance?')) return;
      for (const k of claves()) localStorage.removeItem(k);
      aviso('Avance borrado.');
      window.dispatchEvent(new CustomEvent('plan-cambio'));
      window.dispatchEvent(new CustomEvent('repaso-cambio'));
      pintar();
    });
  }
  pintar();
  return {};
}
