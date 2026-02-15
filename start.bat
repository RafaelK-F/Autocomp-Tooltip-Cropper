@echo off
echo ════════════════════════════════════════════════════════════
echo  AUTOCOMP RUNNER - Starter
echo ════════════════════════════════════════════════════════════
echo.

REM Setze TLS-Umgebungsvariable für OCR-Download
set NODE_TLS_REJECT_UNAUTHORIZED=0

echo ✓ Netzwerk-Einstellungen konfiguriert
echo ✓ Starte Runner...
echo.

node runner.js

pause
