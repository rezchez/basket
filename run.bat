@echo off
title Basketball Project
cd /d "%~dp0"

:: Add common Bun installation paths
set "PATH=%USERPROFILE%\.bun\bin;%LOCALAPPDATA%\bun\bin;%ProgramFiles%\bun;%PATH%"

:: Check if bun is available
where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Bun is not found in PATH or standard install folders.
    echo Please install Bun from https://bun.sh or add it to PATH.
    echo.
    pause
    exit /b 1
)

:: Run the cross-platform runner script
bun run.ts
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Process finished with exit code %errorlevel%.
    pause
)
