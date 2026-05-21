# Calculus

Juego web de calculo mental con ambientacion de academia magica.
Pensado para practicar rapidez en suma, resta, multiplicacion y division.

Ahora incluye modo multijugador por turnos con personalizacion por edad.

## Estructura

- `index.html`: interfaz principal.
- `assets/css/style.css`: estilo visual y responsive.
- `assets/js/operations.js`: generacion de ejercicios por operacion y dificultad.
- `assets/js/gameEngine.js`: motor del juego (puntaje, racha, rondas, cronometro, insignias).
- `assets/js/ui.js`: renderizado y feedback visual.
- `assets/js/app.js`: conexion entre UI y motor.

## Modo multijugador por edad

- Elige `Modo de Juego > Multijugador por Turnos`.
- Define nombre y edad para cada jugadora.
- Con `Dificultad por Edad` activada, el nivel se adapta automaticamente:
	- 4-6 anos: nivel 1
	- 7-8 anos: nivel 2
	- 9-11 anos: nivel 3
	- 12+ anos: nivel 4
- Las `Rondas` se aplican por jugadora en multijugador.

## Temporizador de respuesta (matraz)

- Cada pregunta tiene un tiempo limite visual con un matraz que se vacia.
- El matraz tiene forma alquimica (cuello, cuerpo, base y burbujas animadas).
- Si el tiempo llega a 0, la pregunta cuenta como fallo y pasa al siguiente turno.
- El tiempo es fijo para todas las preguntas: 20 segundos.

## Sonidos divertidos

- Incluye sonidos para: inicio de mision, acierto, error, salto, timeout y subida de nivel.
- En los ultimos 3 segundos de cada pregunta suena una alerta corta.
- Puedes activarlos o desactivarlos desde `Sonidos Divertidos` en la configuracion.

## Voces magicas

- Se usan voces del navegador (SpeechSynthesis) para narrar eventos del juego.
- Frases incluidas: inicio, cambio de turno, acierto, error, salto, timeout, alerta de poco tiempo y fin de mision.
- Se activan y desactivan con el mismo control `Sonidos Divertidos`.

## Publicar en GitHub Pages

1. Sube esta carpeta a un repositorio de GitHub.
2. Ve a Settings > Pages.
3. En Build and deployment, elige Deploy from a branch.
4. Selecciona la rama principal (main) y carpeta `/ (root)`.
5. Guarda y espera el enlace publico de Pages.

## Personalizacion rapida

- Dificultad y rangos numericos: edita `getRange` en `assets/js/operations.js`.
- Puntos, rachas e insignias: edita `submit` y `updateBadges` en `assets/js/gameEngine.js`.
- Textos motivacionales y mensajes: edita `badgeMessages` y `getMotivationalTip` en `assets/js/ui.js`.

## Idea de adherencia

Usa sesiones diarias cortas de 5-10 minutos y registra mejores puntajes por semana para mantener motivacion.
