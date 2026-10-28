# Isla dinámica para Windows (v1.1)

Isla flotante siempre encima de tus apps.

## Qué hace
- **Música real**: cuando suena algo (Spotify, YouTube en el navegador, reproductor de Windows, etc.)
  la isla se expande unos segundos con el título y el artista, y queda en modo compacto mientras suena.
  Clic para expandir: pausa, anterior y siguiente.
- **Mover**: arrastra la isla con el ratón a cualquier parte de la pantalla; recuerda su posición.
- **Configuración** (clic derecho en la isla, Ctrl+Alt+S o menú de la bandeja):
  tamaño, opacidad, colores de fondo/acento/texto, música automática, ocultar en reposo,
  reloj 24 h, bloquear posición, minutos del temporizador, iniciar con Windows.
- **Temporizador** real (Ctrl+Alt+2) y **batería** real (aviso al conectar el cargador y batería baja).

## Atajos globales
Ctrl+Alt+1 música · 2 temporizador · 3 notificación de prueba · 0 reposo · S configuración

## Enviar avisos a la isla desde otros programas
Con la isla abierta, desde PowerShell:
   Invoke-RestMethod "http://127.0.0.1:47821/notify?title=Hola&body=Mensaje de prueba"

## Nota sobre notificaciones de Windows
Windows no permite que una app de escritorio como esta lea las notificaciones de otros programas
(WhatsApp, Discord, etc.) sin un permiso especial de apps empaquetadas, por eso no se muestran solas.

## Instalador (.exe)
Sube estos archivos a GitHub y la acción "Crear instalador de Windows" genera `Isla-Dinamica-Setup.exe`.
