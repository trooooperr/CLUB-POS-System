@echo off
set SCRIPT="%TEMP%\CreateShortcut.vbs"
echo Set oWS = CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Startup") ^& "\HumTumPrintAgent.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0print-agent.exe" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

echo =======================================================
echo Auto-Start Enabled Successfully!
echo HumTum Print Agent will now start automatically in the background
echo whenever your Windows PC boots up.
echo.
echo Press any key to close this window.
echo =======================================================
pause > nul
