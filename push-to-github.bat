@echo off
set "PATH=%LOCALAPPDATA%\Programs\git\cmd;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
title Workly - GitHub Push
echo ====================================================
echo  Workly: Pushing all code and fixes to GitHub...
echo  Target: https://github.com/contacthamzutrader-ship-it/workly.git
echo ====================================================
echo.
echo [1] Push with Browser Login (GitHub popup window)
echo [2] Push with GitHub Personal Access Token (PAT)
echo.
set /p opt="Enter 1 or 2 [Press Enter for 1]: "

if "%opt%"=="2" goto with_token

:browser
echo.
echo [INFO] Pushing to GitHub...
echo [INFO] Browser prompt open ho ga, please repo owner account (contacthamzutrader-ship-it) se login karein.
git push -u origin main
goto done

:with_token
echo.
echo [INFO] GitHub Personal Access Token generate karein:
echo https://github.com/settings/tokens (Tokens classic - repo scope checked)
echo.
set /p pat="Paste your GitHub Personal Access Token: "
if "%pat%"=="" (
    echo [ERROR] No token entered.
    goto done
)
echo [INFO] Pushing using token...
git push https://%pat%@github.com/contacthamzutrader-ship-it/workly.git main
goto done

:done
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
) else (
    echo [NOTICE] Agar error 403 aye, to check karein ke aap 'contacthamzutrader-ship-it' account se login hain, ya Option 2 (Token) use karein.
)
echo.
pause
