# Banco de inglés: formato de los archivos

Cada archivo de esta carpeta es un tema del banco de preguntas para el examen de ubicación de la
Escuela de Idiomas (unas 100 preguntas de opción múltiple, inglés británico). `npm run validar:ingles`
revisa todos los archivos; la aplicación los carga desde `public/data/ingles.json`.

## Tema de gramática o vocabulario

```json
{
  "id": "conditionals",
  "grupo": "gramatica",
  "titulo": "Conditionals: zero, first, second, third and mixed",
  "resumen": [
    "<b>Zero:</b> <i>if + present, present</i> para verdades generales: <i>If you heat ice, it melts.</i>",
    "..."
  ],
  "preguntas": [
    {
      "id": "conditionals-01",
      "nv": "B1",
      "q": "If I ___ you, I would accept the offer.",
      "a": "were",
      "d": ["am", "would be", "have been"],
      "x": "Segundo condicional (situación irreal en presente): <i>if + past simple</i>, <i>would + infinitive</i>. Con <i>I</i> se prefiere <i>were</i> en registro cuidado."
    }
  ]
}
```

| Campo | Regla |
| --- | --- |
| `id` | igual al nombre del archivo sin `.json` |
| `grupo` | `gramatica`, `vocabulario`, `britanico` o `lectura` |
| `titulo` | en inglés, como aparece en los libros de gramática |
| `resumen` | de 4 a 8 puntos en español con ejemplos en inglés; es la mini lección que se lee antes de practicar |
| `preguntas[].id` | `<id del tema>-NN`, único en todo el banco |
| `preguntas[].nv` | nivel MCER: `A2`, `B1`, `B2` o `C1` |
| `preguntas[].q` | enunciado en inglés; el hueco se escribe con tres guiones bajos `___` |
| `preguntas[].a` | la única respuesta correcta |
| `preguntas[].d` | exactamente 3 distractores, distintos entre sí y de la respuesta |
| `preguntas[].x` | explicación en español de por qué es esa y por qué fallan las otras |

La aplicación baraja las opciones cada vez que muestra la pregunta, así que el orden de `a` y `d` no importa.

## Lectura

```json
{
  "id": "reading",
  "grupo": "lectura",
  "titulo": "Reading comprehension",
  "resumen": ["..."],
  "textos": [
    {
      "id": "reading-t1",
      "nv": "B2",
      "titulo": "Remote work",
      "texto": ["First paragraph...", "Second paragraph..."],
      "preguntas": [
        {"id": "reading-t1-01", "nv": "B2", "q": "According to the text, ...", "a": "...", "d": ["...", "...", "..."], "x": "..."}
      ]
    }
  ]
}
```

## Reglas de redacción

1. **Una sola respuesta defendible.** Si dos opciones pueden ser correctas en algún registro o variedad, se cambia la pregunta. Los distractores deben ser claramente incorrectos por una razón que la explicación nombra.
2. **Inglés británico** en ortografía y uso (*colour*, *organise*, *at the weekend*, *have got*). Nunca se pregunta algo cuya respuesta dependa de la variedad sin decirlo en el enunciado.
3. Enunciados cortos (una o dos oraciones), con contexto suficiente para decidir el tiempo verbal.
4. Los distractores son errores reales de hispanohablantes cuando se puede (*I have 25 years*, *depend of*, *actually* por «actualmente»).
5. Sin preguntas de cultura general ni de vocabulario rebuscado: lo que mide un examen de ubicación de A2 a C1.
