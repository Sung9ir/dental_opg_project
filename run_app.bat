@echo off
title DentalAI Studio Launcher
color 0b

echo ======================================================================
echo    Starting DentalAI Studio (AI Backend + Web App)
echo ======================================================================
echo.

echo 1. Stopping any existing DentalAI server on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 2. Locating Python and Starting AI Backend Server on http://localhost:8000 ...
set "PY_CMD="
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PY_CMD=%~dp0.venv\Scripts\python.exe"
) else if exist "%~dp0venv\Scripts\python.exe" (
    set "PY_CMD=%~dp0venv\Scripts\python.exe"
) else (
    set "PY_CMD=python"
)

start "DentalAI Backend" cmd /k "cd /d "%~dp0" && "%PY_CMD%" server.py"

echo.
echo 3. Waiting for server to initialize...
ping 127.0.0.1 -n 4 > nul

echo.
echo 4. Opening DentalAI Studio in Browser...
start http://localhost:8000

echo.
echo ======================================================================
echo    Application is now running!
echo    URL: http://localhost:8000
echo ======================================================================
echo.
pause
