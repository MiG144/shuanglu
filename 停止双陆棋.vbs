' ============================================================================
' Shuanglu Backgammon - Stop background server (double-click to stop)
' Reads server.pid and safely terminates ONLY that exact PID (vite preview).
' NOTE: keep this file pure ASCII to avoid encoding issues with cscript.
' ============================================================================
Option Explicit
Dim ws, fso, pidFile, shellCmd, f, txt, pid
Set ws = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

pidFile = "D:\shuanglu\server.pid"

If fso.FileExists(pidFile) Then
    Set f = fso.OpenTextFile(pidFile, 1)
    txt = Trim(f.ReadLine())
    f.Close
    If IsNumeric(txt) And txt <> "" Then
        pid = CLng(txt)
        ' /F force, /T tree; /PID targets only the recorded preview process
        shellCmd = "taskkill /F /T /PID " & pid
        ws.Run "cmd /c " & shellCmd, 0, True
        fso.DeleteFile pidFile, True
        ws.Popup "Shuanglu server stopped.", 2, "Shuanglu", 64
    Else
        ws.Popup "No valid server PID recorded.", 2, "Shuanglu", 48
    End If
Else
    ws.Popup "Shuanglu server is not running (no pid file).", 2, "Shuanglu", 48
End If