@echo off
set "PATH=%LOCALAPPDATA%\Programs\git\cmd;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
title Workly - GitHub Push
echo ====================================================
echo  Workly: Pushing all code and fixes to GitHub...
echo  Target: https://github.com/contacthamzutrader-ship-it/workly.git
echo ====================================================
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
) else (
    echo [INFO] If a browser or login prompt opened, please complete GitHub sign-in.
)
echo.
pause
