#!/bin/bash
# run-local-against-server.sh
# Führt Lasttests von lokaler Maschine gegen den Server aus

echo "🚀 Lokaler Lasttest gegen Remote-Server"
echo "======================================="

# Server-URL (anpassen!)
export TEST_BASE_URL="https://voting.failx.de"
export TEST_EVENT_SLUG="lasttest-2025"

# Volle Last-Konfiguration für lokale Ausführung
export MAX_USERS_PER_TEST=100
export CONCURRENT_LOGINS=25
export VOTE_BATCH_SIZE=50

echo "Ziel-Server: $TEST_BASE_URL"
echo "Event: $TEST_EVENT_SLUG"
echo "Geplante Last: $MAX_USERS_PER_TEST Nutzer"

# Ins richtige Verzeichnis wechseln
cd voting-service-client-v2

# Dependencies installieren falls nötig
if [ ! -d "node_modules" ]; then
    echo "Installiere Dependencies..."
    npm install
fi

# Playwright installieren falls nötig
if [ ! -d "node_modules/@playwright" ]; then
    echo "Installiere Playwright..."
    npx playwright install chromium
fi

# Auswahl des Test-Szenarios
echo ""
echo "Wähle Test-Szenario:"
echo "1) Standard Load Test (100 Nutzer)"
echo "2) Stress Test (200 Nutzer)"
echo "3) Weighted Vote Test (50 Nutzer)"
echo "4) Alle Tests nacheinander"
read -p "Auswahl (1-4): " choice

case $choice in
    1)
        echo "Starte Standard Load Test..."
        npx playwright test tests/load-test/load-test.spec.js --reporter=html
        ;;
    2)
        echo "Starte Stress Test..."
        # Erhöhe Limits für Stress-Test
        export MAX_USERS_PER_TEST=200
        export USERS_PER_BATCH=100
        export CONCURRENT_LOGINS=50
        npx playwright test tests/load-test/load-test-stress.spec.js --reporter=html
        ;;
    3)
        echo "Starte Weighted Vote Test..."
        export MAX_USERS_PER_TEST=50
        npx playwright test tests/load-test/load-test-weighted.spec.js --reporter=html
        ;;
    4)
        echo "Starte alle Tests nacheinander..."
        npx playwright test tests/load-test/ --reporter=html
        ;;
    *)
        echo "Ungültige Auswahl!"
        exit 1
        ;;
esac

echo ""
echo "✅ Test abgeschlossen!"
echo ""
echo "Ergebnisse findest du in:"
echo "- voting-results/ (Rohdaten)"
echo "- playwright-report/ (HTML Report)"
echo ""
echo "HTML-Report öffnen mit:"
echo "npx playwright show-report"