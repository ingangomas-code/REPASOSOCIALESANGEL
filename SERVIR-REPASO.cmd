@echo off
cd /d "%~dp0"
start "" "http://127.0.0.1:9011/"
"%~dp0..\..\.venv\Scripts\python.exe" -m http.server 9011 --bind 127.0.0.1 --directory dist
