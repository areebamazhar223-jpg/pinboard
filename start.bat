@echo off
start "Backend" cmd /k "cd /d %~dp0backend && python app.py"
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 5 >nul
start http://localhost:5173