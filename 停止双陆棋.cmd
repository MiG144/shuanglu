@echo off
rem ===========================================================================
rem Shuanglu Backgammon - stop background server (Windows)
rem ===========================================================================
cd /d "%~dp0"
node scripts\stop.mjs
pause