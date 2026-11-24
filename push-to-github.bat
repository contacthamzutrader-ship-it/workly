@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

:: Ensure git is in PATH
set "PATH=%LOCALAPPDATA%\Programs\git\cmd;C:\Program Files\Git\cmd;C:\Program Files (x86)\Git\cmd;%PATH%"

title Workly - GitHub Push
color 0A

echo ====================================================
echo   Workly: One-Click GitHub Sync
echo   Target: https://github.com/contacthamzutrader-ship-it/workly
echo   Branch: main
echo ====================================================
echo.

:: Ensure origin is locked to owner account
git remote set-url origin https://contacthamzutrader-ship-it@github.com/contacthamzutrader-ship-it/workly.git

:: Check if git repository exists
if not exist ".git" (
    color 0C
    echo [ERROR] .git directory not found.
    goto end
)

:: Automatically add all changes
echo [1/3] Checking for local changes...
git add -A

:: Check if there is anything to commit
git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [2/3] Committing updates...
    git commit -m "Auto-update: GUI refinements, tests, and platform improvements"
) else (
    echo [2/3] No new local changes to commit. Proceeding to push...
)

:: Push to remote main
echo.
echo [3/3] Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo   [SUCCESS] Code is successfully pushed to GitHub!
    echo   View live repo:
    echo   https://github.com/contacthamzutrader-ship-it/workly
    echo ====================================================
) else (
    color 0C
    echo.
    echo ====================================================
    echo   [ERROR] Push failed.
    echo   If prompted by GitHub in browser, make sure to
    echo   sign in as: 'contacthamzutrader-ship-it'
    echo ====================================================
)

:end
echo.
pause
