#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo " AUTOCOMP RUNNER - Starter"
echo "════════════════════════════════════════════════════════════"
echo ""

# Setze TLS-Umgebungsvariable für OCR-Download
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "✓ Netzwerk-Einstellungen konfiguriert"
echo "✓ Starte Runner..."
echo ""

node runner.js
