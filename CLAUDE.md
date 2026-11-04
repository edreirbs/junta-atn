# La primera junta de Tom con la redacción de ATN

Este repositorio es el material de la Sesión 7 de Claude for Business.
El ejemplo es la **primera junta de Tom Wambsgans, presidente de noticias de ATN, con su redacción**. ATN es una cadena de ficción de la serie *Succession*. La marca y los datos de la junta están en la Skill `marca-atn`. Si la persona trae su propio evento, usa sus datos y su marca, y conserva todo lo demás.

## Qué se construye

Una página, primero para celular, que se vea de primer nivel desde el primer vistazo:

1. **Portada:** "La primera junta de Tom con la redacción", la fecha, una **cuenta regresiva en vivo** y el botón "Registrarme". El gafete de la junta en grande, con un efecto 3D sobrio (se inclina con el mouse o al mover el celular; en iPhone, pide el permiso de movimiento con `DeviceOrientationEvent.requestPermission()` al primer toque; respeta `prefers-reduced-motion`).
2. **Contador:** "Ya vienen N de la redacción", con `contar_asistentes()`, cada 15 segundos y al registrarse. Debajo, cuándo cierra el registro (`cierre_registro`); solo se muestra, no bloquea el formulario.
3. **Orden del día:** los tres puntos de la Skill.
4. **Registro:** nombre, correo y modalidad (En persona · En línea). Al registrarse, una animación sobria, "Tu lugar quedó, [nombre de pila]" y "En unos minutos te llega la confirmación". Desde ese momento, ese dispositivo puede preguntar en el muro. El gafete de la portada cambia con la modalidad elegida.
5. **El muro de preguntas, en vivo**, con el título "Las preguntas de la redacción": cada quien manda su pregunta (máximo 200 caracteres, con contador) y vota las de los demás. Cada pregunta muestra solo el nombre de pila, el texto, sus votos y el botón "Votar". Las más nuevas arriba. Cuando alguien pregunta o vota, en cualquier celular, todas las pantallas se actualizan al instante, con una animación corta en la que cambió. Una marca roja "En vivo" dice si está conectado. Si un dispositivo que no se ha registrado quiere preguntar, el aviso dice exactamente "Regístrate para preguntar"; votar no necesita registro.
6. **El resumen de hoy:** el último resumen de noticias que dejó la tarea de Claude, con su fecha y la liga de cada fuente. Si todavía no hay, "El primer resumen llega mañana a las 7:00".
7. **Vista para proyectar:** con `#pantalla` al final de la liga, solo el contador, la marca "En vivo" y el muro, en letra grande, sobre fondo negro, para la pantalla de la sala. Se activa y se quita al cambiar la liga (`hashchange`), sin recargar.
8. El **aviso de privacidad** corto.

Nada de cifras de la cadena, ratings, resultados ni declaraciones inventadas.

## Reglas de la casa

- Todo el sitio vive en `sitio/`: `index.html`, `estilos.css`, `app.js`, `config.js` y las imágenes en `sitio/img/`. `config.js` define solo `window.JUNTA_CONFIG = { supabaseUrl: "...", supabaseKey: "sb_publishable_..." }`. HTML, CSS y JavaScript sin compilar. **No uses** frameworks, `npm` ni pasos de compilación. Solo las letras de Google Fonts que diga la Skill.
- La página pesa poco: imágenes en `.webp`, sin videos. Netlify cobra créditos por cada GB que se descarga.
- **Supabase**, con `fetch` a las funciones (`POST https://<proyecto>.supabase.co/rest/v1/rpc/<función>`, encabezados `apikey` y `Content-Type: application/json`). Con una llave `sb_publishable_...` no mandes `Authorization`.

  | Para | Función | Regresa |
  |---|---|---|
  | La fecha | `datos_junta()` | `fecha` y `cierre_registro`. Muéstralas en español, con la zona de Nueva York. Si la base no responde, calcula tres días después de hoy, entre semana, a las 10:00 h de Nueva York |
  | El contador | `contar_asistentes()` | un número |
  | Registrarse | `registrarse(p_nombre, p_correo, p_modalidad, p_llave)` | `{ok, nombre}` o `{ok: false, motivo}`: `ya` ("Ya estás registrado con ese correo") o `datos` |
  | Preguntar | `preguntar(p_llave, p_texto)` | `{ok, id}` o `motivo`: `registro` (pide registrarse primero), `texto` o `limite` (ya mandó tres) |
  | Votar | `votar(p_pregunta, p_llave)` | `{ok, votos}` o `motivo`: `ya` (ya votó esa) o `no existe` |
  | El muro | `ver_muro()` | la lista: `id`, `nombre_pila`, `texto`, `votos`, `creado` |
  | El resumen | `resumen_de_hoy()` | `{fecha, texto, fuentes: [{titulo, liga}]}` o `null` |

- **La llave del dispositivo:** la primera vez, la página crea una con `crypto.randomUUID()` y la guarda en `localStorage`. Con ella se registra, pregunta y vota: **un voto por llave del dispositivo** en cada pregunta. Guarda también en `localStorage` qué preguntas ya votó y si ya se registró.
- **En vivo:** Supabase Realtime, con la única librería permitida, `@supabase/supabase-js@2` desde jsDelivr (`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm`), cargada con `import()` dentro de un `try`. Escucha `postgres_changes` (`INSERT` y `UPDATE`) de la tabla `muro`. **Si Realtime no está disponible** (la librería no carga, el canal no queda `SUBSCRIBED` en 8 segundos o se cae), la página no se rompe: **consulta `ver_muro()` cada 5 segundos** y la marca dice "Actualizando cada 5 s". Con la pestaña oculta, deja de consultar.
- **Seguridad:**
  - Los datos personales **nunca** se leen desde el público. La página no toca las tablas `asistentes`, `resumen` ni nada del esquema `privado`: solo llama a las funciones de arriba y escucha el muro.
  - El muro muestra **solo el nombre de pila y el texto**. Nunca correo, apellido ni llave.
  - Todo texto que escribió una persona (preguntas, nombres) y el resumen se pintan con `textContent`, **nunca** con `innerHTML`. Las ligas del resumen se ponen con `href` solo si empiezan con `https://`, con `rel="noopener"`.
  - Solo la llave *publishable* va en `sitio/config.js`. Nunca la secreta (`sb_secret_...`) ni la `service_role`.
- La columna `estado_correo` (`pendiente`, `enviado`, `invalido`, `rebotado`, sin acento) la llena la tarea programada de Claude, no la página.
- Textos en español de México, de tú, con la voz de la marca. Sin guiones largos.
- Al pie de la página va esta leyenda: "Material de ficción con fines educativos. Personajes y empresas de la serie Succession (HBO). Sin afiliación con HBO ni con sus titulares."

## La base de datos

- `supabase/esquema.sql` crea las tablas, sus permisos, las funciones, el muro en vivo, el aviso a Claude, el resumen y unos datos de práctica (siete de la redacción y seis preguntas). Se corre con el conector de Supabase en el proyecto que diga la persona. Se puede correr otra vez: no borra nada.
- `supabase/tarea_correos.md` trae el prompt de la tarea programada que manda las confirmaciones y cómo conectarla con la página.
- `supabase/tarea_resumen.md` trae el prompt de la tarea del resumen de las 7 de la mañana.
- El asesor de seguridad de Supabase avisa que el público puede ejecutar las funciones y leer `muro`. Es a propósito: el muro solo tiene el nombre de pila y el texto, y las funciones nunca regresan correos.

## Cómo se trabaja

- Cada cambio va en una rama y se revisa en la vista previa del Pull Request. **Nunca** directo en `main`: cada publicación de `main` en Netlify gasta créditos.
- Antes de abrir el Pull Request, pide al subagente `revisor-seguridad` que revise.
- Si pruebas registrarte, preguntar o votar en la base, borra después lo que insertaste y regresa los votos como estaban: la persona cuenta con los siete de práctica y sus seis preguntas tal como vienen.
- `respaldo/sitio/` es una página terminada y probada. **No** la copies ni la leas para construir, salvo que la persona lo pida ("usa el respaldo").
