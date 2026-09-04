' ============================================================================
' Shuanglu Backgammon - One-click Launcher (double-click to play)
' Runs scripts\launch.mjs in a hidden window (build -> serve -> open browser).
' Copy this file to Desktop for a one-click shortcut.
' NOTE: keep this file pure ASCII to avoid encoding issues with cscript.
' ============================================================================
Option Explicit
Dim ws, shellCmd, projDir
Set ws = CreateObject("WScript.Shell")

' Project root (update this line if you move the folder)
projDir = "D:\shuanglu"

' 0 = hidden window; False = do not wait
shellCmd = "cmd /c cd /d """ & projDir & """ && node scripts\launch.mjs"
ws.Run shellCmd, 0, False