@echo off
setlocal enabledelayedexpansion

echo ===================================
echo Data Migration Tool
echo ===================================
echo.

:menu
echo Choose an option:
echo 1. Export data from local database
echo 2. Import data to VPS database
echo 3. Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Exporting data from local database...
    echo.
    node migrate-data.js export
    echo.
    echo Press any key to return to menu...
    pause > nul
    cls
    goto menu
)

if "%choice%"=="2" (
    echo.
    set /p vpsUrl="Enter VPS database URL (mysql://username:password@host:port/database): "
    echo.
    echo Importing data to VPS database...
    echo.
    node migrate-data.js import "!vpsUrl!"
    echo.
    echo Press any key to return to menu...
    pause > nul
    cls
    goto menu
)

if "%choice%"=="3" (
    echo.
    echo Exiting...
    goto :eof
)

echo.
echo Invalid choice. Please try again.
echo.
goto menu