@echo off
rem ===========================================================================
rem Shuanglu Backgammon - one-click launcher (Windows)
rem Double-click this file, or right-click -> Send to -> Desktop shortcut.
rem Uses %~dp0 so it works wherever the project folder is located.
rem ===========================================================================
cd /d "%~dp0"

rem Launch detached (hidden-ish via minimized window), then this file exits.
start "" /min cmd /c "node scripts\launch.mjs"
exit /b