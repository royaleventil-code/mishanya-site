@echo off
setlocal
cd /d "%~dp0"
if not exist "out\ru\holiday\new-year\video-greeting.html" (
  call npm.cmd run build -- --webpack
  if errorlevel 1 goto failed
)
node "scripts\ded-moroz-preview.mjs" --open
if errorlevel 1 goto failed
exit /b 0
:failed
pause
exit /b 1
