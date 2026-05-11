@echo off
title AFK Bot Pro v2.0 — Local
color 0A
cls

echo.
echo  =========================================================
echo   MINECRAFT AFK BOT PRO v2.0
echo   Node.js Powered  --  Anti-Kick Engine  --  Dashboard
echo  =========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found.
    echo  Download from: https://nodejs.org/en/download ^(LTS^)
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NVER=%%v
echo  [OK] Node.js %NVER% detected.

if not exist "node_modules\" (
    echo  [*] Installing dependencies...
    npm install --silent
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
) else (
    echo  [OK] Dependencies already present.
)

echo.
echo  ---------------------------------------------------------
echo   Dashboard  ^>  http://localhost:3000
echo   Commands   ^>  !status  !ping  !pos
echo  ---------------------------------------------------------
echo.

node index.js

echo.
echo  [!] Process exited.
pause
