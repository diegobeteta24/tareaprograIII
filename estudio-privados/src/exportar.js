// Exporta una guía a Markdown para subirla como fuente a NotebookLM (o leerla en cualquier editor).
// Conserva las fórmulas como LaTeX entre $...$, que NotebookLM entiende como texto.
const ENT = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** HTML simple de las guías a Markdown. */
export function md(html) {
  let s = String(html ?? '');
  s = s.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, c) => `\n\n\`\`\`\n${c}\n\`\`\`\n\n`);
  s = s.replace(/<table>([\s\S]*?)<\/table>/g, (_, t) => {
    const filas = [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((f) => [...f[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()));
    if (!filas.length) return '';
    const [cab, ...resto] = filas;
    return `\n\n| ${cab.join(' | ')} |\n|${cab.map(() => ' --- ').join('|')}|\n${resto.map((f) => `| ${f.join(' | ')} |`).join('\n')}\n\n`;
  });
  s = s.replace(/<li>/g, '\n- ').replace(/<\/li>/g, '').replace(/<\/?(ul|ol)>/g, '\n');
  s = s.replace(/<br\s*\/?>/g, '\n').replace(/<\/?b>/g, '**').replace(/<\/?i>/g, '*').replace(/<\/?code>/g, '`');
  s = s.replace(/<sub>(.*?)<\/sub>/g, '_$1').replace(/<sup>(.*?)<\/sup>/g, '^$1');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&(lt|gt|amp|quot|#39|nbsp);/g, (e) => ENT[e]);
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, f) => `$${f.trim()}$`).replace(/\\\[([\s\S]+?)\\\]/g, (_, f) => `$$${f.trim()}$$`);
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  // Un bloque de código al inicio necesita su propia línea para que la valla funcione
  return s.startsWith('```') ? `\n${s}` : s;
}

const LETRAS = 'abcd';

export function cursoAMarkdown(c, { area = '', bloque = '' } = {}) {
  const out = [`# ${md(c.titulo)}`, '', `${md(c.meta)}${area ? ` · Área: ${area}` : ''}${bloque ? ` · Bloque: ${bloque}` : ''}`, '', md(c.lead)];
  if (c.firma) out.push('', `Idea central: $$${c.firma}$$${c.firma_nota ? ` (${md(c.firma_nota)})` : ''}`);
  if (c.aviso) out.push('', `> ${md(c.aviso)}`);
  c.temas.forEach((t, i) => {
    out.push('', `## Tema ${i + 1}. ${md(t.titulo)}`);
    if (t.intro) out.push('', md(t.intro));
    for (const co of t.conceptos || []) {
      out.push('', `### ${md(co.n)}`, '', ...[].concat(co.e).map((p) => `${md(p)}\n`));
      if (co.f) out.push(`$$${co.f}$$`, '');
      if (co.tabla) out.push(md(co.tabla), '');
      const [d, p, w, h] = co.u || [];
      out.push(`- **Dónde se usa:** ${md(d)}`, `- **Por qué importa:** ${md(p)}`, `- **Cuándo:** ${md(w)}`, `- **Cómo:** ${md(h)}`);
    }
    out.push('', `### Ejercicios del tema ${i + 1}`);
    t.ejercicios.forEach((e, j) => {
      out.push('', `**Ejercicio ${j + 1}.** ${md(e.q)}`);
      if (e.pasos) out.push('', 'Solución:', ...e.pasos.map((p, k) => `${k + 1}. ${md(p)}`), '', `Resultado: ${md(e.r)}`, e.fin ? `Para qué sirve: ${md(e.fin)}` : '');
      else if (e.ops) out.push('', ...e.ops.map((o, k) => `${LETRAS[k]}) ${md(o)}`), '', `Respuesta: ${LETRAS[e.ok]}). ${md(e.r)}`);
      else out.push('', `Respuesta: ${md(e.r)}`);
    });
  });
  out.push('', '---', '', `Fuente: ${c.local ? 'guía local de esta adaptación' : 'PrivStudyPage (https://github.com/jairocodes/PrivStudyPage), de jairocodes'}. Programa oficial del curso: ${c.fuente}`);
  return out.filter((x) => x !== undefined).join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
