/**
 * Utility für Browser-Kompatibilitätsprüfungen
 * Prüft Funktionen, die für kritische App-Funktionalitäten nötig sind
 */

/**
 * Prüft, ob localStorage verfügbar und beschreibbar ist
 * @returns {boolean} true wenn localStorage funktioniert, sonst false
 */
export function isLocalStorageAvailable() {
  try {
    const testKey = 'voting-app-storage-test';
    localStorage.setItem(testKey, 'test');
    const testValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    // Prüfe, ob der Wert korrekt gespeichert und abgerufen wurde
    return testValue === 'test';
  } catch(e) {
    console.error('localStorage ist nicht verfügbar:', e);
    return false;
  }
}

/**
 * Zeigt eine Warnung an, wenn kritische Browser-Funktionen nicht verfügbar sind
 * @param {Object} options Konfigurationsoptionen
 * @param {boolean} options.showAlert Wenn true, wird ein Browser-Alert angezeigt
 * @param {Function} options.onIncompatible Callback, der bei Inkompatibilität aufgerufen wird
 * @returns {Object} Objekt mit Kompatibilitätsstatus
 */
export function checkBrowserCompatibility(options = {}) {
  const { showAlert = true, onIncompatible = null } = options;
  
  const compatibility = {
    localStorage: isLocalStorageAvailable(),
    compatible: true
  };
  
  // Wenn irgendeine Komponente nicht kompatibel ist, ist der Browser nicht kompatibel
  if (!compatibility.localStorage) {
    compatibility.compatible = false;
  }
  
  if (!compatibility.compatible) {
    const message = `Ihr Browser unterstützt einige benötigte Funktionen nicht, was zu Problemen bei der Abstimmung führen kann:
${!compatibility.localStorage ? '- Abstimmungsdaten können nicht gespeichert werden\n' : ''}

Wir empfehlen, einen anderen Browser wie Chrome, Firefox oder Microsoft Edge zu verwenden, oder die Einstellungen in Ihrem Browser anzupassen:
- Deaktivieren Sie den "Privaten Modus" oder "Inkognito-Modus"
- Erlauben Sie Cookies und Website-Daten für diese Seite
- Deaktivieren Sie temporär Tracking-Schutz und Content-Blocker`;
    
    if (showAlert) {
      alert(message);
    }
    
    if (typeof onIncompatible === 'function') {
      onIncompatible(compatibility, message);
    }
    
    console.warn('Browser-Kompatibilitätsprobleme erkannt:', compatibility);
  }
  
  return compatibility;
}

/**
 * Erkennt den verwendeten Browser
 * @returns {Object} Browser-Informationen
 */
export function detectBrowser() {
  const userAgent = navigator.userAgent;
  let browserName = "Unbekannt";
  let browserVersion = "Unbekannt";
  
  // Safari
  if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
    browserName = "Safari";
    const match = userAgent.match(/Version\/([0-9._]+)/);
    if (match) browserVersion = match[1];
  } 
  // Chrome
  else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome";
    const match = userAgent.match(/Chrome\/([0-9._]+)/);
    if (match) browserVersion = match[1];
  } 
  // Firefox
  else if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    const match = userAgent.match(/Firefox\/([0-9._]+)/);
    if (match) browserVersion = match[1];
  } 
  // Edge
  else if (userAgent.indexOf("Edg") > -1) {
    browserName = "Edge";
    const match = userAgent.match(/Edg\/([0-9._]+)/);
    if (match) browserVersion = match[1];
  }
  
  return {
    name: browserName,
    version: browserVersion,
    userAgent: userAgent,
    isMobile: /iPhone|iPad|iPod|Android/i.test(userAgent),
    isSafari: browserName === "Safari"
  };
}