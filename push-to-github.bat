@echo off
setlocal EnableDelayedExpansion
set "PATH=%LOCALAPPDATA%\Programs\git\cmd;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
title Workly - GitHub Push

echo ====================================================
echo  Workly: Pushing all code and fixes to GitHub
echo  Target: https://github.com/contacthamzutrader-ship-it/workly.git
echo ====================================================
echo.

:: Check for any uncommitted changes
git status --porcelain > "%TEMP%\workly_git_status.txt" 2>&1
for %%R in ("%TEMP%\workly_git_status.txt") do set SIZE=%%~zR
if %SIZE% GTR 0 (
    echo [INFO] Detected uncommitted changes. Staging and committing now...
    set "cmsg=Update AventriqTalent GUI and platform fixes"
    set /p "user_cmsg=Enter commit message [Press Enter for default]: "
    if defined user_cmsg set "cmsg=!user_cmsg!"
    git add -A
    git commit -m "!cmsg!"
    echo.
)
if exist "%TEMP%\workly_git_status.txt" del "%TEMP%\workly_git_status.txt"

echo Choose push method:
echo  [1] Direct Push (uses saved credentials or browser login)
echo  [2] Push with GitHub Personal Access Token [PAT]
echo  [3] Reset saved credentials (fixes 403 Permission Denied)
echo.
set "opt=1"
set /p opt="Enter 1, 2, or 3 [Default is 1]: "

if "%opt%"=="2" goto with_token
if "%opt%"=="3" goto reset_creds

:direct
echo.
echo [INFO] Pushing to GitHub main branch...
git push -u origin main
if %ERRORLEVEL% EQU 0 goto success
goto fail

:with_token
echo.
echo [INFO] GitHub Personal Access Token generate karein:
echo https://github.com/settings/tokens (Generate classic token with 'repo' scope)
echo.
set /p pat="Paste your GitHub Personal Access Token: "
if "%pat%"=="" (
    echo [ERROR] Token khali tha. Push cancel ho gaya.
    goto end
)
echo.
echo [INFO] Pushing using Personal Access Token...
git push https://%pat%@github.com/contacthamzutrader-ship-it/workly.git main
if %ERRORLEVEL% EQU 0 goto success
goto fail

:reset_creds
echo.
echo [INFO] Clearing old cached GitHub credentials from Windows...
cmdkey /delete:LegacyGeneric:target=git:https://github.com 2>nul
echo [INFO] Old credentials cleared. Ab browser prompt khule ga.
echo [INFO] Please 'contacthamzutrader-ship-it' account se sign in karein.
echo.
git push -u origin main
if %ERRORLEVEL% EQU 0 goto success
goto fail

:success
echo.
echo ====================================================
echo  [SUCCESS] Code successfully pushed to GitHub!
echo  Branch: main is up to date.
echo ====================================================
goto end

:fail
echo.
echo ====================================================
echo  [ERROR] Git push failed.
echo  Agar 403 error hai, to Option 3 chala kar credentials
echo  reset karein ya Option 2 se Personal Access Token lagayein.
echo ====================================================
goto end

:end
echo.
pause
