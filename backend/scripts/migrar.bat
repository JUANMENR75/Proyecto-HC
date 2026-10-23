@echo off
setlocal enabledelayedexpansion

echo ===================================
echo Herramienta de Migración de Datos
echo ===================================
echo.

:menu
echo Elige una opción:
echo 1. Exportar datos de la base de datos local
echo 2. Importar datos a la base de datos VPS
echo 3. Salir
echo.

set /p choice="Ingresa tu elección (1-3): "

if "%choice%"=="1" (
    echo.
    echo Exportando datos de la base de datos local...
    echo.
    node migrate-data.js export
    echo.
    echo Presiona cualquier tecla para volver al menú...
    pause > nul
    cls
    goto menu
)

if "%choice%"=="2" (
    echo.
    set /p vpsUrl="Ingresa la URL de la base de datos VPS (mysql://usuario:contraseña@host:puerto/basededatos): "
    echo.
    echo Importando datos a la base de datos VPS...
    echo.
    node migrate-data.js import "!vpsUrl!"
    echo.
    echo Presiona cualquier tecla para volver al menú...
    pause > nul
    cls
    goto menu
)

if "%choice%"=="3" (
    echo.
    echo Saliendo...
    goto :eof
)

echo.
echo Opción inválida. Por favor intenta de nuevo.
echo.
goto menu