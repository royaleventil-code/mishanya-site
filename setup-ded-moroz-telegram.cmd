@echo off
setlocal
cd /d "%~dp0"
node "scripts\setup-ded-moroz-telegram.mjs"
set "setup_result=%errorlevel%"
pause
exit /b %setup_result%
