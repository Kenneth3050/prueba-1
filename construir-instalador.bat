@echo off
chcp 65001 >nul
title Creando instalador de Isla Dinamica
where node >nul 2>nul
if errorlevel 1 (
  echo Falta instalar Node.js LTS desde https://nodejs.org y volver a abrir este archivo.
  pause
  exit /b 1
)
call npm install
call npm run build
if exist dist\Cubo-Setup.exe (explorer dist) else (echo Algo fallo al crear el instalador.)
pause
