@echo off
title NeuroVision 3D - AI Brain Tumour System
echo ========================================================
echo   NeuroVision 3D - AI Brain Tumour 3D System
echo ========================================================
echo Checking and clearing port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
echo Starting Backend and Frontend servers...
start "NeuroVision Backend" cmd /k "cd /d %~dp0backend && set PYTHONPATH=%~dp0backend && python run_server.py"
start "NeuroVision Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Both servers launched!
echo   Frontend: http://localhost:3000
echo   Backend:  http://127.0.0.1:8001
echo.
echo Open http://localhost:3000 in your browser.
pause
