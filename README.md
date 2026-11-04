# La primera junta de Tom con la redacción de ATN

Material de la **Sesión 7** de *Claude for Business*: Claude Code en la nube.

El ejemplo es la primera junta de **Tom Wambsgans, presidente de noticias de ATN**, con su redacción. ATN es una cadena de ficción de la serie *Succession*. Puedes usar tu propio evento: dile a Claude cuál es y con qué marca.

## Qué hay aquí

| Carpeta o archivo | Para qué |
|---|---|
| `CLAUDE.md` | Lo que Claude necesita saber para construir la página |
| `.claude/skills/marca-atn/` | Skill con la marca de ATN y los datos de la junta |
| `.claude/agents/revisor-seguridad.md` | Subagente que revisa la página antes del Pull Request; solo puede leer |
| `supabase/esquema.sql` | El registro, el muro de preguntas en vivo, los votos, el resumen, el aviso a Claude y unos datos de práctica |
| `supabase/tarea_correos.md` | La tarea programada que manda las confirmaciones, cómo conectarla con la página y "Pregúntale a tu lista" |
| `supabase/tarea_resumen.md` | La tarea programada del resumen de las 7 de la mañana |
| `sitio/` | Lo que publica Netlify. Aquí construye Claude la página. Ya trae las imágenes en `sitio/img/` |
| `respaldo/sitio/` | Una página terminada y probada, por si la tuya no queda |
| `netlify.toml` | Le dice a Netlify que publique la carpeta `sitio/` |

## Regla de oro con Netlify

Cada publicación de `main` gasta créditos del plan gratis. Los cambios se hacen en una rama y se revisan en la vista previa del Pull Request, que es gratis. Se fusiona una sola vez, cuando ya quedó.

## Seguridad, en corto

- La página nunca lee datos personales: solo llama a funciones de la base.
- El muro muestra solo el nombre de pila y el texto. Votar es con una función, un voto por dispositivo.
- Todo texto de una persona se pinta como texto, nunca como HTML.
- Si el aviso en vivo no está disponible, la página consulta el muro cada 5 segundos.

---

Material de ficción con fines educativos. Personajes y empresas de la serie Succession (HBO). Sin afiliación con HBO ni con sus titulares.
