// config-local-vs-server.js
// Optimiert für lokale Tests gegen Remote-Server

const CONFIG = {
    // VOLLE LAST für lokale Maschine gegen Remote-Server
    MAX_USERS_PER_TEST: 100,
    USERS_PER_BATCH: 50,
    VOTE_BATCH_SIZE: 50,
    CONCURRENT_LOGINS: 25,      // Viele gleichzeitige Browser möglich
    
    // Remote-Server URLs (aus Umgebungsvariablen)
    API_URL: process.env.TEST_BASE_URL || 'https://voting.failx.de',
    CLIENT_URL: process.env.TEST_BASE_URL || 'https://voting.failx.de', 
    EVENT_SLUG: process.env.TEST_EVENT_SLUG || 'lasttest-2025',
    
    // Test-Credentials
    ORGANIZER_USERNAME: 'loadtest-admin',  // Verwende den Admin aus SQL
    ORGANIZER_EMAIL: 'admin@loadtest.example.com',
    ORGANIZER_PASSWORD: 'TestAdmin123!',
    USER_PASSWORD: 'test123',
    
    // Optimierte Delays für Remote-Tests
    BATCH_VOTE_DELAY: 1000,     // 1s zwischen Voting-Batches
    VOTING_DELAY: 2000,         // 2s nach Poll-Start
    LOGIN_DELAY: 100,           // 100ms zwischen Logins
    
    // Timeouts für Remote-Verbindungen
    MAX_RETRIES: 5,
    RETRY_DELAY: 2000,
    CHECK_INTERVAL: 500,
    MAX_CHECK_TIME: 60000,
    
    // Längere Wartezeiten wegen Netzwerk-Latenz
    USER_WAIT_AFTER_VOTE: 120000,    // 2 Minuten
    USER_TOTAL_WAIT_TIME: 15 * 60000, // 15 Minuten
    ORGANIZER_TOTAL_WAIT_TIME: 15 * 60000,
    
    // Browser-Optimierung für lokale Hardware
    BROWSER_ARGS: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--js-flags="--max-old-space-size=2048"', // Mehr RAM pro Browser
        '--disable-extensions',
        '--disable-background-networking',
        '--force-color-profile=srgb',
        '--no-first-run'
    ],
    
    // Größerer Viewport für Desktop
    VIEWPORT: { width: 1024, height: 768 },
    
    // Erweiterte Metriken
    RESULTS_DIR: 'voting-results',
    SCREENSHOTS_DIR: 'test-results',
    USER_READY_PERCENTAGE: 100,
    
    // Detailliertes Monitoring
    KEEP_ALIVE_INTERVAL: 2000,
    VOTE_TRACKING_ENABLED: true,
    LOGIN_KEEP_ALIVE_ENABLED: true,
    REDUCED_METRICS: false,       // Volle Metriken sammeln
    
    // Netzwerk-spezifische Einstellungen
    WAIT_FOR_POLL_START_TIME: 300000, // 5 Minuten
    CONNECTION_TIMEOUT: 30000,    // 30s für Remote-Verbindungen
    PAGE_LOAD_TIMEOUT: 60000,     // 1 Minute für Seitenladevorgänge
    
    // Feature-Flags für lokale Tests
    ENABLE_SCREENSHOTS_ON_ERROR: true,
    ENABLE_VIDEO_RECORDING: false,  // Spart Speicher
    ENABLE_TRACING: false,          // Spart Speicher
    VERBOSE_LOGGING: true,          // Detaillierte Logs
};

// Stress-Test Variante
const STRESS_CONFIG = {
    ...CONFIG,
    MAX_USERS_PER_TEST: 200,
    USERS_PER_BATCH: 100,
    CONCURRENT_LOGINS: 50,      // Aggressiver für Stress-Test
    VOTE_BATCH_SIZE: 100,
    
    // Kürzere Delays für maximale Last
    BATCH_VOTE_DELAY: 500,
    LOGIN_DELAY: 50,
    
    // Mehr Browser-Optimierungen für Stress
    BROWSER_ARGS: [
        ...CONFIG.BROWSER_ARGS,
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--memory-pressure-off',
        '--disable-ipc-flooding-protection'
    ]
};

// Monitoring-Konfiguration
const MONITORING_CONFIG = {
    // Server-Monitoring während der Tests
    SERVER_HEALTH_CHECK_INTERVAL: 10000,  // 10s
    MONITOR_SERVER_METRICS: true,
    
    // Response-Time Tracking
    TRACK_RESPONSE_TIMES: true,
    RESPONSE_TIME_THRESHOLDS: {
        login: 5000,        // 5s für Login
        voting: 3000,       // 3s für Voting
        page_load: 10000    // 10s für Page Load
    },
    
    // Fehler-Monitoring
    MAX_ERROR_RATE: 5,      // 5% max. Fehlerrate
    ALERT_ON_HIGH_ERRORS: true,
    
    // Resource-Monitoring (lokal)
    MONITOR_LOCAL_RESOURCES: true,
    MAX_LOCAL_CPU_PERCENT: 90,
    MAX_LOCAL_MEMORY_GB: 8
};

module.exports = {
    CONFIG,
    STRESS_CONFIG,
    MONITORING_CONFIG
};