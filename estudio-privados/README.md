# Inge 2028: estudio local de privados e inglés (UMG)

Aplicación web para estudiar en tu computadora, sin cuentas ni servidor, para el **Seminario de Privados** de
Ingeniería en Sistemas de la UMG (pensum 2014) y para el **examen de ubicación de inglés** de la Escuela de Idiomas.
Es una adaptación de [PrivStudyPage](https://github.com/jairocodes/PrivStudyPage), de jairocodes (ver
[Créditos](#créditos-y-licencia)), organizada alrededor de un plan de estudio semana por semana.

## Cómo se usa

Necesitas [Node.js](https://nodejs.org/) 18 o más reciente y conexión a internet la primera vez.

```bash
cd estudio-privados
npm install
npm run dev
```

Abre <http://localhost:5173>. La primera vez se descargan las 35 guías originales de PrivStudyPage (unos segundos).
Desde ahí funciona sin internet, salvo los videos de YouTube y los enlaces externos.

**Usa siempre la misma dirección.** El avance se guarda en el navegador y depende de la dirección: si abres la app en
otro puerto o en otro navegador, parece vacía. Para pasar el avance de un lado a otro, usa *Plan → Copia de seguridad*.

Para dejarla compilada y abrirla sin el servidor de desarrollo: `npm run build` y después `npm run preview`.

## Qué trae

| Sección | Para qué |
| --- | --- |
| **Hoy** | Qué toca hoy según el plan: el bloque de la semana con enlaces directos a sus guías y ejercicios, la rutina de inglés, el simulacro del domingo, trámites con casilla, el siguiente punto de control y cuántos días faltan para el seminario. Cronómetro de sesión (sigue corriendo aunque recargues) y registro de horas. |
| **Plan** | Las semanas S0 a S9 con sus horas, trámites y avance; la ruta 2027–2028 (seminario, certificación, tesis) que se corre sola si cambias la fecha de arranque del seminario; puntos de control; plantilla semanal y sesiones registradas. Exporta todas las fechas a un calendario `.ics` para Google Calendar, con aviso el día anterior. |
| **Áreas** | Las guías por área y bloque: conceptos con su uso real, ejercicios resueltos paso a paso, ejercicios para resolver y cuestionarios. Cada guía se descarga en Markdown para subirla como fuente a NotebookLM, y cada ejercicio se puede mandar al cuaderno de errores. |
| **Examen** | Preguntas al azar de un área, un bloque o los cursos de la semana, con reloj. Ajustes del plan: *cuestionario de entrada* (20 min), *problemas con reloj* y *simulacro de 2 horas*. |
| **Oral** | Un concepto o un tema al azar: tiempo para prepararlo, reloj para explicarlo en voz alta, grabación opcional y comparación con la guía. |
| **Repaso** | Cuaderno de errores con repaso espaciado (1, 2, 4, 8 y 16 días). Se llena solo con lo que fallas en exámenes, cuestionarios, oral e inglés. |
| **Fundamentos** | Las cinco sesiones de aritmética y álgebra sin calculadora (25 al 30 de noviembre) con sus videos, y un generador de ejercicios nuevos cada vez, con revisión inmediata y solución paso a paso. |
| **Inglés** | Banco de preguntas por tema (gramática, vocabulario, inglés británico y lectura) con mini lección; rutina diaria de 45 minutos; simulacro de 100 preguntas con reloj; entrevista con reloj y grabación; dictado con voz británica; registro del EF SET. |

## Tus datos personales

Las notas por bloque, los contactos y los trámites propios van en `personal/mis-datos.json`, que **no se sube a git**.
Copia `personal/mis-datos.ejemplo.json` y lee `personal/LEEME.md`.

## Cambiar el plan

El plan está en `contenido/plan/plan.json`: semanas, horas por bloque, trámites, plantilla semanal, fases de 2027–2028
(con días contados desde el arranque del seminario) y puntos de control. Después de editarlo, vuelve a correr
`npm run dev`. La fecha de arranque del seminario se cambia desde la app, en *Plan*, sin tocar el archivo.

Para ver cómo se verá la app otro día: en la consola del navegador, `sessionStorage.setItem('fecha-prueba', '2026-12-12')`
y recarga (se borra al cerrar la pestaña).

## Contenido y pruebas

| Ruta | Qué es |
| --- | --- |
| `privados-umg/` | Las guías de PrivStudyPage. **No está en git**: la descarga `npm run traer-guias` (o sola, con `npm run dev`). |
| `contenido/guias/` | Guías locales del área de Análisis, Diseño y Desarrollo, que PrivStudyPage todavía no tiene: Bases de Datos I, Bases de Datos II y Programación III (72 ejercicios cada una). Mismo formato. |
| `contenido/ingles/` | Banco de inglés: 389 preguntas en 21 temas (gramática, vocabulario, inglés británico y 5 textos de lectura), de B1 a C1. Formato en `contenido/ingles/FORMATO.md`. |
| `contenido/plan/` | Plan del escenario y sesiones de fundamentos. |
| `contenido/extras/` | Preguntas de la entrevista y oraciones del dictado. |
| `src/fundamentos/` | Generadores de ejercicios de fundamentos. |

```bash
npm run validar          # estructura y fórmulas de todas las guías (originales y locales)
npm run validar:ingles   # banco de inglés
npm test                 # genera miles de ejercicios de fundamentos y comprueba cada respuesta contra el enunciado
```

Las guías locales y el banco de inglés se escribieron para esta adaptación. Los resultados de los ejercicios de las
guías locales se comprobaron con código (SQL con SQLite, algoritmos en Python) y sus cuestionarios con el validador,
pero no los revisó un catedrático, y los programas oficiales de esos cursos no se pudieron abrir: confirma los temas
con quien imparta cada bloque. Cada pregunta de inglés la contestó a ciegas un revisor independiente, sin ver la clave,
para encontrar las que admitían más de una respuesta; esas se corrigieron. Son preguntas de práctica, no del examen real.

## Créditos y licencia

- **PrivStudyPage**, de [jairocodes](https://github.com/jairocodes/PrivStudyPage): las 35 guías de Ciencias de la
  Ingeniería y Administración de Sistemas, la asignación de cursos a bloques y la base de la aplicación (vista de
  guía, modo examen, estilos, validador). Su repositorio **no publica licencia**, así que sus guías no se copian aquí:
  se descargan de su fuente, fijadas al commit `ca11d86`. El código de la aplicación que viene de ahí está adaptado y
  lo indica en sus comentarios. Esta adaptación es para uso personal de estudio; si quieres publicarla o compartirla,
  pide antes permiso o una licencia a su autor.
- Videos de fundamentos: canales de YouTube *Daniel Carreón*, *Matemáticas profe Alex*, *Gominol Tree Matemáticas* y
  *Susi Profe*, enlazados, no copiados. Material de lectura: Khan Academy y OpenStax en LibreTexts Español.
- Fórmulas con [KaTeX](https://katex.org/) y tipografías Archivo y Literata empaquetadas con
  [Fontsource](https://fontsource.org/) (licencia OFL), para que todo funcione sin internet.
