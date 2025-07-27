// config.js
const path = require('path');
const fs = require('fs');

// Globale Konfiguration für den Lasttest
const CONFIG = {
    MAX_USERS_PER_TEST: parseInt(process.env.MAX_USERS_PER_TEST) || 200,       // 200 User für Load Test
    USERS_PER_BATCH: parseInt(process.env.USERS_PER_BATCH) || 50,           // 50 Benutzer pro Batch
    ORGANIZER: 1,                   // Anzahl der Organisatoren
    VOTE_BATCH_SIZE: parseInt(process.env.VOTE_BATCH_SIZE) || 5,            // Kleine Batches für schnelle Tests
    BATCH_VOTE_DELAY: 500,          // Verzögerung zwischen Abstimmungsbatches (500ms)
    API_URL: process.env.TEST_BASE_URL || 'http://localhost:4000',
    CLIENT_URL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    EVENT_SLUG: process.env.TEST_EVENT_SLUG || 'loadtest-event',
    EVENT_ID: parseInt(process.env.TEST_EVENT_ID) || 5, // Aus GitLab Pipeline oder Fallback
    ORGANIZER_USERNAME: 'loadtest-admin',  // Aus der DB
    ORGANIZER_EMAIL: 'loadtest-admin@test.local',
    ORGANIZER_PASSWORD: 'loadtest123',     // Aus der DB (load-test-scenario.sql)
    USER_PASSWORD: 'test123',
    VOTING_DELAY: 1000,             // Reduziert: Wartezeit nach Öffnen der Abstimmung
    MAX_RETRIES: 3,                 // Reduziert: Anzahl der Abstimmungsversuche pro Teilnehmer
    RETRY_DELAY: 500,               // Reduziert: Wartezeit zwischen Abstimmungsversuchen
    CHECK_INTERVAL: 300,            // Reduziert: Polling-Interval für Modal-Prüfung in ms
    MAX_CHECK_TIME: 30000,          // Reduziert: Maximale Zeit für Polling in ms
    RESULTS_DIR: 'voting-results',  // Verzeichnis für Ergebnisse
    SCREENSHOTS_DIR: 'test-results', // Verzeichnis für Screenshots
    USER_READY_PERCENTAGE: 100,     // Prozentsatz der Benutzer, die eingeloggt sein müssen
    CONCURRENT_LOGINS: 50,          // Anzahl gleichzeitiger Logins pro Batch
    REDUCED_WAIT_AFTER_ALL_VOTES: true, // Neue Option: Reduziere Wartezeit nach vollständiger Abstimmung
    REDUCED_WAIT_TIME: 10000,       // Reduzierte Wartezeit in ms (10 Sekunden nach vollständiger Abstimmung)
    GLOBAL_STATUS_FILE: 'global-vote-status.json', // Dateiname für den globalen Status

    // Verbesserte Konfigurationswerte für längere Wartezeiten und Browser-Stabilität
    USER_WAIT_AFTER_VOTE: 300000,    // 5 Minuten Wartezeit nach Abstimmung pro Benutzer
    USER_TOTAL_WAIT_TIME: 45 * 60000, // 45 Minuten Gesamtwartezeit für Benutzer
    ORGANIZER_TOTAL_WAIT_TIME: 45 * 60000, // 45 Minuten Gesamtwartezeit für Organizer
    
    // Verbesserte Konfiguration für Keep-Alive Mechanismus
    KEEP_ALIVE_INTERVAL: 500,        // 500ms Intervall für Keep-Alive Aktionen (sehr schnelle Aktualisierung)
    CONNECTION_POLLING_INTERVAL: 3000, // 3 Sekunden Intervall zur Überprüfung des Verbindungsstatus
    VOTE_TRACKING_ENABLED: true,     // Aktiviert das Tracking von Stimmen auch nach Browser-Schließung
    LOGIN_KEEP_ALIVE_ENABLED: true,  // Aktiviert den Keep-Alive-Mechanismus bereits während des Logins
    WAIT_FOR_POLL_START_TIME: 600000, // 10 Minuten maximale Wartezeit auf den Abstimmungsstart
};

// Globaler Status zur Erfassung aller Abstimmungen
let GLOBAL_STATUS = {
    totalParticipants: CONFIG.MAX_USERS_PER_TEST,
    successfulVotes: 0,
    allVoted: false,
    lastUpdateTime: null
};

// Helper-Funktionen für Pfade und Dateizugriff
const getResultsDir = () => path.join(process.cwd(), CONFIG.RESULTS_DIR);
const getScreenshotsDir = () => path.join(process.cwd(), CONFIG.SCREENSHOTS_DIR);

// Funktion zum Laden des globalen Status aus der Datei (falls vorhanden)
function loadGlobalStatus() {
    try {
        const statusFile = path.join(getResultsDir(), CONFIG.GLOBAL_STATUS_FILE);
        if (fs.existsSync(statusFile)) {
            const data = fs.readFileSync(statusFile, 'utf8');
            GLOBAL_STATUS = JSON.parse(data);
            console.log(`Globaler Status geladen: ${GLOBAL_STATUS.successfulVotes}/${GLOBAL_STATUS.totalParticipants} erfolgreiche Abstimmungen`);
        }
    } catch (error) {
        console.error('Fehler beim Laden des globalen Status:', error);
    }
}

// Funktion zum Speichern des globalen Status in eine Datei
function saveGlobalStatus() {
    try {
        const resultsDir = getResultsDir();
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        GLOBAL_STATUS.lastUpdateTime = new Date().toISOString();
        const statusFile = path.join(resultsDir, CONFIG.GLOBAL_STATUS_FILE);
        fs.writeFileSync(statusFile, JSON.stringify(GLOBAL_STATUS, null, 2));
    } catch (error) {
        console.error('Fehler beim Speichern des globalen Status:', error);
    }
}

// Funktion zum Aktualisieren der erfolgreichen Abstimmungen
function updateSuccessfulVotes(newVotes) {
    GLOBAL_STATUS.successfulVotes += newVotes;

    // Prüfen, ob alle Teilnehmer abgestimmt haben
    if (GLOBAL_STATUS.successfulVotes >= GLOBAL_STATUS.totalParticipants) {
        GLOBAL_STATUS.allVoted = true;
        console.log(`ALLE TEILNEHMER HABEN ERFOLGREICH ABGESTIMMT: ${GLOBAL_STATUS.successfulVotes}/${GLOBAL_STATUS.totalParticipants}`);
    }

    saveGlobalStatus();
    return GLOBAL_STATUS.allVoted;
}

// Funktion zum Zurücksetzen des globalen Status
function resetGlobalStatus() {
    GLOBAL_STATUS = {
        totalParticipants: CONFIG.MAX_USERS_PER_TEST,
        successfulVotes: 0,
        allVoted: false,
        lastUpdateTime: new Date().toISOString()
    };
    saveGlobalStatus();
}

// Lade den globalen Status beim Import dieses Moduls
loadGlobalStatus();

module.exports = {
    CONFIG,
    getResultsDir,
    getScreenshotsDir,
    GLOBAL_STATUS,
    updateSuccessfulVotes,
    resetGlobalStatus,
    loadGlobalStatus
};