@echo off
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:8765"
  node start.cjs
  pause
  exit /b
)
where py >nul 2>nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:8765"
  py -3 start.py
  pause
  exit /b
)
where python >nul 2>nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:8765"
  python start.py
  pause
  exit /b
)
echo Node.js or Python 3 is needed for a local server.
echo You can also open index.html directly in your browser.
pause
