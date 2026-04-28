@echo off
title AirPak - מערכת ניהול
echo.
echo  ===================================
echo   AirPak - מערכת ניהול הזמנות
echo   http://localhost:3001
echo  ===================================
echo.
start "" "http://localhost:3001"
"C:\Users\tomer\node22\node.exe" "C:\Users\tomer\AppData\Local\node\corepack\v1\pnpm\10.33.0\bin\pnpm.cjs" --dir "C:\Users\tomer\Projects\airpak" dev -- -p 3001
