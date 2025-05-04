// config.js
const path = require('path');

// Globale Konfiguration für den Lasttest
const CONFIG = {
    MAX_USERS_PER_TEST: 150,        // Gesamtanzahl der Teilnehmer (3 Tests mit je 50 Benutzern)
    USERS_PER_BATCH: 50,            // Anzahl der Benutzer pro Test-Batch (3 Batches zu je 50)
    ORGANIZER: 1,                   // Anzahl der Organisatoren
    VOTE_BATCH_SIZE: 25,            // Anzahl der gleichzeitigen Abstimmungen pro Batch (reduziert auf 25)
    BATCH_VOTE_DELAY: 5000,         // Verzögerung zwischen Abstimmungsbatches (5 Sekunden)
    API_URL: 'http://localhost:4000',
    CLIENT_URL: 'http://localhost:5173',
    EVENT_SLUG: 'loadtest-event',
    EVENT_ID: 976,
    ORGANIZER_USERNAME: 'loadtest',
    ORGANIZER_EMAIL: 'loadtest@example.org',
    ORGANIZER_PASSWORD: 'TestPassword123!',
    USER_PASSWORD: 'test123',
    VOTING_DELAY: 2000,             // Wartezeit nach Öffnen der Abstimmung
    MAX_RETRIES: 3,                 // Anzahl der Abstimmungsversuche pro Teilnehmer
    RETRY_DELAY: 1000,              // Wartezeit zwischen Abstimmungsversuchen
    CHECK_INTERVAL: 500,            // Polling-Interval für Modal-Prüfung in ms
    MAX_CHECK_TIME: 60000,          // Maximale Zeit für Polling in ms
    RESULTS_DIR: 'voting-results',  // Verzeichnis für Ergebnisse
    SCREENSHOTS_DIR: 'test-results', // Verzeichnis für Screenshots
    USER_READY_PERCENTAGE: 100,     // Prozentsatz der Benutzer, die eingeloggt sein müssen
    CONCURRENT_LOGINS: 25,          // Anzahl gleichzeitiger Logins pro Batch
};

// Helper-Funktionen für Pfade und Dateizugriff
const getResultsDir = () => path.join(process.cwd(), CONFIG.RESULTS_DIR);
const getScreenshotsDir = () => path.join(process.cwd(), CONFIG.SCREENSHOTS_DIR);

module.exports = {
    CONFIG,
    getResultsDir,
    getScreenshotsDir
};