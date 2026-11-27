# Guías locales

Guías que no vienen de PrivStudyPage. Usan el mismo formato (`privados-umg/privados-umg/references/modelo-datos.md`)
y la aplicación las mezcla con las originales al generar los datos.

- El `titulo` debe coincidir con la columna `curso` de `privados-umg/privados-umg/references/cursos.csv`.
- Si PrivStudyPage publica más adelante una guía con el mismo `slug`, se usa la de PrivStudyPage y la local queda ignorada.
- Llevan dos campos extra: `"origen": "local"` y `"aviso"`, un texto corto que la aplicación muestra en la cabecera de la guía para decir de dónde salió el temario.

**De dónde sale el temario.** Los programas oficiales de estos cursos (portal de contenidos de la carrera) no se pudieron abrir
al escribirlas, así que cubren el temario habitual de cada curso y no el del programa. Sirven para repasar teoría y practicar;
los temas hay que confirmarlos con el programa o con quien imparta el bloque.

## Agregar o corregir una guía

```bash
node scripts/barajar-ops.mjs contenido/guias/<slug>.json   # reubica la opción correcta de los cuestionarios
npm run validar -- contenido/guias/<slug>.json             # estructura, niveles y fórmulas
npm run datos                                              # regenera public/data
```
