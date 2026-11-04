---
name: marca-atn
description: Marca de ATN Noticias (cadena de ficción de la serie Succession, para practicar) y los datos de la primera junta de Tom Wambsgans con la redacción. Úsala para la página de la junta, el muro de preguntas, los correos de confirmación y el resumen de cada mañana.
---

# ATN Noticias

Cadena de noticias **de ficción** de Waystar RoyCo, de la serie *Succession*. Es material de práctica de un curso, sin afiliación con HBO ni con sus titulares.

## Voz

- De tú, directa y segura, como una redacción de noticias. Frases cortas. Titulares de pocas palabras.
- Dice lo que la redacción tiene que saber: cuándo, dónde, cómo entra y qué pasa con su pregunta.
- Nada de cifras de la cadena, ratings, promesas ni declaraciones de sus directivos.
- Sin guiones largos.

## Colores

Salen del logotipo: un bloque rojo con "ATN" en blanco y "NOTICIAS" en negro, en letra condensada.

| Uso | Color |
|---|---|
| Rojo ATN (bloques, botones, la barra de "en vivo") | `#C8102E` |
| Negro (texto, fondo de la vista para proyectar) | `#111111` |
| Blanco (fondo principal y texto sobre rojo) | `#FFFFFF` |
| Gris claro (fondos de tarjetas) | `#F2F2F0` |
| Gris (detalles, notas) | `#6B6B6B` |

El rojo es para lo que importa: el botón principal, la marca "En vivo" y los votos. No pintes la página entera de rojo.

## Letras

- Titulares: **Oswald** (Google Fonts), 500 y 700, en mayúsculas, como el logotipo.
- Texto: **Inter** (Google Fonts), 400 y 600.

## El logotipo

No hay archivo: se dibuja con HTML y CSS. Un bloque rojo con "ATN" en blanco, en Oswald 700, y a su derecha "NOTICIAS" en negro (en blanco sobre fondo oscuro), en Oswald 500 con letras espaciadas.

## La junta

| Dato | Valor |
|---|---|
| Evento | Primera junta de Tom Wambsgans con la redacción de ATN |
| Quién la convoca | Tom Wambsgans, presidente de noticias de ATN |
| Fecha | La da la función `datos_junta` de la base: a tres días de la instalación, entre semana, a las 10:00 h de Nueva York. Nunca se escribe fija |
| En persona | Sala de redacción de ATN, Nueva York. Se entra con el gafete de ATN |
| En línea | Transmisión interna. La liga personal llega por correo un día antes |
| Registro | Cierra la víspera a las 18:00 h (también lo da `datos_junta`) |
| Orden del día | 1. Tom se presenta. 2. Lo que sigue para ATN. 3. Las preguntas de la redacción, empezando por las más votadas |
| Preguntas | Hasta tres por persona, de máximo 200 caracteres. Se votan en el muro; en la junta se contestan las más votadas |

## Imágenes

En `sitio/img/`: `gafete-persona.webp` y `gafete-linea.webp` (el gafete de la junta en cada modalidad) y `redaccion.webp` (la sala de redacción). Siempre con texto alternativo.

## El correo de confirmación

- Asunto: "Tu lugar en la junta con Tom Wambsgans".
- De tú, corto: su nombre, su modalidad, la fecha, la hora y el lugar, y cómo entra (en persona, con su gafete; en línea, con la liga que le llega un día antes).
- Al final, cómo darse de baja: responder "baja" a ese correo.

## El resumen de cada mañana

- Lo escribe una tarea de Claude cada día a las 7:00: las tres noticias más importantes del negocio de los medios en las últimas 24 horas, una línea por noticia y por qué le importa a una cadena de noticias. Máximo 120 palabras.
- La página lo muestra como "El resumen de hoy", con la fecha y la liga de cada fuente.

## Datos personales

Toda página que pida datos lleva un aviso de privacidad corto: quién los recibe (la oficina de Tom Wambsgans en ATN, de práctica), para qué (confirmar el registro y mandar el acceso), que en el muro solo sale el nombre de pila, que no se comparten y cómo darse de baja (responder "baja" al correo).
