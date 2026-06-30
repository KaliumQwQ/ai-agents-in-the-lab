@echo off
REM Serve the talk locally (optional - double-clicking index.html also works).
cd /d "%~dp0"
echo Serving on http://localhost:8000  -  Ctrl+C to stop
python -m http.server 8000
