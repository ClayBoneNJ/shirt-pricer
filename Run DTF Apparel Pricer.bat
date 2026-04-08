@echo off
cd /d "%~dp0"
set "APP_PORT=4173"
start "DTF Apparel Pricer Dev Server" cmd /k "npm.cmd run dev -- --host 127.0.0.1 --port %APP_PORT% --strictPort"
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:%APP_PORT%
