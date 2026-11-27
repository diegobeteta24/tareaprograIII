# Datos personales (no se suben a git)

Copia `mis-datos.ejemplo.json` como `mis-datos.json` en esta carpeta y llénalo con lo tuyo. `npm run dev` lo lee y la
aplicación lo muestra en el Plan (notas por bloque y contactos) y en Hoy (trámites propios de cada semana). Todo lo de
esta carpeta, salvo este archivo y el ejemplo, está en `.gitignore`.

| Campo | Para qué |
| --- | --- |
| `notas.bloques` | Promedio y porcentaje de exámenes por bloque del seminario: el Plan los muestra del más débil al más fuerte. |
| `notas.lectura` | Una línea con la conclusión que sacaste de tus notas. |
| `contactos` | Personas y oficinas a las que escribes: `quien` y `dato` (correo, teléfono, horario). |
| `tramites` | Trámites propios por semana del plan (`S0` a `S9`), con `id` único, `texto` y `fecha` opcional (AAAA-MM-DD). Se suman a los del plan. |
| `puntosDeControl` | Para cambiar el texto de un punto de control (`PC1` a `PC6`): `pregunta` o `siNo`. |
| `ingles` | `efsetBase` (tu primer puntaje del EF SET) y `efsetMeta`. |

**Cuidado:** `npm run build` copia estos datos a `dist/data/personal.json`. Si publicas `dist/` en internet, borra antes
`mis-datos.json` o no lo publiques.
