@echo off
setlocal
cd /d "%~dp0"
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:4173/"
node server.mjs
endlocal
