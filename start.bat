@echo off
echo Starting MarcoLand Revival Server...
echo.

REM Kill any existing Node.js processes
echo Stopping any running Node.js processes...
wmic process where "name='node.exe'" delete >nul 2>&1

REM Wait a moment for processes to fully terminate
timeout /t 2 >nul

echo Starting development server on port 3000...
echo.
npm run dev

pause