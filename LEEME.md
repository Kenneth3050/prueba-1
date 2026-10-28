# Isla dinámica para Windows

Una isla flotante que se queda siempre encima de tus aplicaciones, arriba al centro de la pantalla.

## Probarla (modo desarrollo)
1. Instala Node.js (versión LTS): https://nodejs.org
2. Abre una terminal en esta carpeta y ejecuta:
   npm install
   npm start

## Crear el .exe
   npm run build
El ejecutable portable queda en la carpeta `dist`.

## Cómo se usa
- Haz clic en la isla para expandirla o contraerla (las zonas vacías dejan pasar el clic a tus apps).
- Atajos globales, funcionan aunque estés en otra app:
  Ctrl+Alt+1 Música · 2 Temporizador · 3 Llamada · 4 Mensaje · 5 Carga · 0 Reposo
- Ícono en la bandeja del sistema: mismo menú, "Iniciar con Windows" y "Salir".

## Obtener el instalador (.exe)
Opción A, en tu PC: doble clic en `construir-instalador.bat` (requiere Node.js LTS una sola vez).
El instalador queda en `dist\Isla-Dinamica-Setup.exe`.

Opción B, sin instalar nada: sube esta carpeta a un repositorio de GitHub, ve a la pestaña
Actions, ejecuta "Crear instalador de Windows" y descarga `Isla-Dinamica-Setup` (contiene el .exe).
