# Isla dinámica para Windows (v1.2)

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
