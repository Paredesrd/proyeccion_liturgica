@echo off
title Servidor de Proyeccion Liturgica - Produccion
color 0A

:: Se posiciona automáticamente en la carpeta actual del proyecto (evita errores con tildes o caracteres especiales)
cd /d "%~dp0"

echo Iniciando sistema...
echo.

echo =========================================================
echo 📡 DIRECCION DE ACCESO PARA EL EQUIPO TECNICO (CELULARES):
echo =========================================================
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do echo http://%%a:8000
echo =========================================================
echo.

:: Activar entorno virtual y arrancar
call .venv\Scripts\activate
python main.py

pause