// config-pipeline.js
// Angepasste Konfiguration für GitLab Runner mit begrenzten Ressourcen

const CONFIG = {
    // REDUZIERTE WERTE FÜR PIPELINE
    MAX_USERS_PER_TEST: 20,         // Nur 20 statt 100 Nutzer
    USERS_PER_BATCH: 10,            // Kleinere Batches
    VOTE_BATCH_SIZE: 5,             // Weniger gleichzeitige Abstimmungen
    CONCURRENT_LOGINS: 3,           // Maximal 3 gleichzeitige Browser
    
    // Längere Delays für Stabilität
    BATCH_VOTE_DELAY: 2000,         // 2s zwischen Batches
    VOTING_DELAY: 3000,             // 3s Wartezeit
    LOGIN_DELAY: 1000,              // 1s zwischen Logins
    
    // Basis-Konfiguration
    API_URL: process.env.TEST_BASE_URL || 'https://voting.failx.de',
    CLIENT_URL: process.env.TEST_BASE_URL || 'https://voting.failx.de',
    EVENT_SLUG: process.env.TEST_EVENT_SLUG || 'lasttest-2025',
    EVENT_ID: 976,
    ORGANIZER_USERNAME: 'loadtest',
    ORGANIZER_EMAIL: 'loadtest@example.org',
    ORGANIZER_PASSWORD: 'TestPassword123!',
    USER_PASSWORD: 'test123',
    
    // Timeouts erhöht für langsamere Umgebung
    MAX_RETRIES: 5,
    RETRY_DELAY: 2000,
    CHECK_INTERVAL: 1000,
    MAX_CHECK_TIME: 60000,
    
    // Reduzierte Wartezeiten
    USER_WAIT_AFTER_VOTE: 30000,    // 30s statt 5min
    USER_TOTAL_WAIT_TIME: 5 * 60000, // 5min statt 45min
    ORGANIZER_TOTAL_WAIT_TIME: 5 * 60000,
    
    // Ressourcen-Optimierung
    BROWSER_ARGS: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--js-flags="--max-old-space-size=512"', // Weniger RAM pro Browser
        '--single-process',  // Wichtig für Container
        '--disable-extensions',
        '--disable-images',  // Keine Bilder laden
        '--disable-javascript-harmony-shipping',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
    ],
    
    // Container-optimierte Viewport-Größe
    VIEWPORT: { width: 640, height: 480 },
    
    // Vereinfachte Ausgabe
    RESULTS_DIR: 'voting-results',
    SCREENSHOTS_DIR: 'test-results',
    USER_READY_PERCENTAGE: 90,      // 90% reicht aus
    
    // Feature-Flags für Pipeline
    KEEP_ALIVE_INTERVAL: 5000,      // Weniger aggressive Keep-Alive
    VOTE_TRACKING_ENABLED: false,    // Reduziert Overhead
    LOGIN_KEEP_ALIVE_ENABLED: false,
    REDUCED_METRICS: true,           // Weniger detaillierte Metriken
};

// Stress-Test Konfiguration für Pipeline
const STRESS_CONFIG = {
    ...CONFIG,
    MAX_USERS_PER_TEST: 30,     // Maximal 30 für Stress-Test
    USERS_PER_BATCH: 15,
    CONCURRENT_LOGINS: 5,       // Etwas mehr, aber immer noch limitiert
    VOTE_BATCH_SIZE: 10,
};

// Export
module.exports = {
    CONFIG,
    STRESS_CONFIG
};