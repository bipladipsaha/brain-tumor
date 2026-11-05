@echo off
title NeuroVision Clinical Suite - Launch System
echo ========================================================
echo   NeuroVision Clinical Suite - Dual Persona 3D System
echo ========================================================
echo Checking and clearing port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

set "PY_CMD=python"
if exist "C:\Users\bipla\AppData\Local\Programs\Python\Python312\python.exe" (
    set "PY_CMD=C:\Users\bipla\AppData\Local\Programs\Python\Python312\python.exe"
)

echo Starting Backend Server on http://127.0.0.1:8001 ...
start "NeuroVision Backend" cmd /k "cd /d %~dp0backend && set PYTHONPATH=%~dp0backend && %PY_CMD% run_server.py"

echo Starting Frontend Server on http://localhost:3000 ...
start "NeuroVision Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers have been launched in separate terminal windows!
echo   * Frontend (Clinical UI): http://localhost:3000
echo   * Backend (Diagnostic API): http://127.0.0.1:8001/docs
echo.
