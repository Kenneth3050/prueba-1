# Cubo — isla dinámica para Windows (v1.8)

## Cambios 1.8
- La isla expandida ya no tiene filas de botones: ahora son PÁGINAS con flechas ‹ › y puntos indicadores
  (Hora, Música, Temporizador, Cronómetro, Pomodoro, Rendimiento, Portapapeles, Accesos, Notas, Asistentes).
  También cambian con Ctrl+Alt+← / → o desplazando horizontalmente con el panel táctil.
- Página de Notas dentro de la isla (marca como hechas) y página de Asistentes (Hablar, ChatGPT, Gemini, Claude, Copilot, Google, captura, ajustes).
- Vínculos con IA por voz: "pregúntale a Gemini …", "dile a ChatGPT …", "abre Claude". Dos modos: abrir el navegador con tu pregunta
  o responder dentro de la isla con tu clave de API (ChatGPT, Gemini, Claude). Las claves se guardan cifradas con Windows.
- Panel de configuración nuevo: fondo negro con acentos de neón, cada sección y cada opción explican para qué sirven, y hay buscador.

# (historial) Cubo — isla dinámica para Windows (v1.7)

## Cambios 1.7
- La app ahora se llama **Cubo** (palabra de activación por defecto: "hey cubo"). Tus ajustes y notas se migran solos.
- Corregida la navegación del panel de configuración (las secciones ahora cambian al pulsarlas).
- El asistente de voz se configura en el panel: nombre/palabra de activación, voz, velocidad, tono, volumen y tiempo de escucha.
- Herramientas nuevas en la isla (botones al expandir la hora): cronómetro, pomodoro, rendimiento (CPU/RAM),
  historial del portapapeles (opcional, solo en memoria), accesos rápidos configurables, captura de pantalla,
  silencio del micrófono (en llamadas, Ctrl+Alt+K) y relojes del mundo.
- Atajos: Ctrl+Alt+4 cronómetro · 5 pomodoro · 6 rendimiento · 7 portapapeles · 8 accesos · K micrófono.
- El asistente también entiende cronómetro, pomodoro, rendimiento, portapapeles, capturas, micrófono y "abre <acceso>".

# (historial) Isla dinámica para Windows (v1.6)

## Cambios 1.6
- Logo nuevo (cubo de cristal) en el instalador, la bandeja, las ventanas y el panel.
- Asistente de voz: Ctrl+Alt+V, botón 🎤 al expandir la hora, o palabra de activación "isla" (experimental).
  Entiende volumen, música, temporizadores, notas, hora, fecha, clima, configuración y cambio de muñequito,
  y responde en pantalla y en voz alta. Usa el reconocimiento de voz de Windows (debe estar instalado para tu idioma).
- Notas: ventana propia (Ctrl+Alt+N) con agregar, editar, marcar como hecha, fijar y borrar.
  La nota fijada aparece en la isla al expandir la hora, y el asistente puede crear notas por voz.


## Cambios 1.5
- Control de volumen real: rueda del ratón sobre la isla, control deslizante en la vista de música,
  aviso al cambiar el volumen con el teclado y atajos Ctrl+Alt+RePág / AvPág / M.
- Se quitó la batería (equipo de escritorio).
- Panel de configuración nuevo: barra lateral, vista previa en vivo y temas listos.
- Más opciones: forma, borde, sombra, tipo de letra, animaciones, alineación, monitor, distancia desde arriba,
  siempre encima, ocultar en pantalla completa, expandir al pasar el ratón, tiempo de expansión, portada,
  barras, tiempos, ignorar música de ciertas apps, personaje (pingüino, cono, fantasma), tamaño del muñequito,
  audífonos, segundos en el reloj, duración y sonido de avisos y cuenta regresiva a una fecha.


## Cambios 1.3
- Corregido el recorte del contenido al abrir la isla con música.
- El muñequito ahora es un pingüino.
- Fondo de la música con olas animadas: negro arriba y el color de la canción abajo.
- En reposo se agrega la fecha corta para que no quede espacio vacío.
- Portada: lectura más robusta con reintentos y registro en isla.log (menú de la bandeja > Abrir carpeta de datos).

Isla flotante siempre encima de tus apps. Arrástrala, clic para expandir, clic derecho para configurar.

## Novedades 1.2
- Portada del álbum en la isla y color de la isla según la canción (detalles, fondo o desactivado).
- Detección de llamadas por uso del micrófono (Discord, WhatsApp, Teams, Zoom, Telegram, Skype, Slack,
  Webex, Signal, Viber y navegadores) con nombre de la app y contador.
- En reposo muestra hora y temperatura (clic para ver fecha, clima y ciudad).
- Muñequito animado: se pone los audífonos solo cuando suena música y baila; sin música está tranquilo.
- Idioma español / inglés en toda la interfaz y en el menú de la bandeja.
- Opciones nuevas: unidad °C/°F, ciudad (o automática), mostrar/ocultar muñequito y llamadas.

## Atajos globales
Ctrl+Alt+1 música · 2 temporizador · 3 notificación de prueba · 0 reposo · S configuración

## Privacidad del clima
Para la temperatura se consulta Open-Meteo. Si no pones una ciudad, la ubicación se estima por tu IP
con ipwho.is. Si prefieres no usarlo, escribe una ciudad en Configuración o desactiva "Mostrar temperatura".

## Avisos desde otros programas
   Invoke-RestMethod "http://127.0.0.1:47821/notify?title=Hola&body=Mensaje de prueba"

## Instalador (.exe)
Sube estos archivos a GitHub y la acción "Crear instalador de Windows" genera `Isla-Dinamica-Setup.exe`.
