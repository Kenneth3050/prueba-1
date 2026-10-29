# Isla dinámica para Windows (v1.5)

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
