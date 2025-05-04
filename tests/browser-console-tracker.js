// In der Browser-Konsole des Organisators einfügen
// (Diese Datei in die Zwischenablage kopieren und in die Browserkonsole einfügen)

// Array für die PubSub-Events
let pubsubEvents = [];

// Zählervariablen
let batchProcessingEvents = 0;
let finalEvents = 0;

// Überschreibe die console.log-Funktion, um PubSub-Events zu erfassen
const originalConsoleLog = console.log;
console.log = function(...args) {
  originalConsoleLog.apply(console, args);
  
  // Überprüfe, ob es ein PubSub-Event ist
  if (args.length > 0 && typeof args[0] === 'string') {
    let text = args[0];
    
    // PubSub-Event-Tracking
    if (text.includes('POLL ANSWER LIFECYCLE SUBSCRIPTION UPDATE RECEIVED')) {
      pubsubEvents.push({
        type: 'subscription_received',
        timestamp: new Date().toISOString()
      });
    } 
    // Erfasst die tatsächlichen Daten
    else if (text.includes('DATA:') && text.includes('pollAnswerLifeCycle')) {
      try {
        // Extrahieren der JSON-Daten
        const startIndex = text.indexOf('{');
        if (startIndex >= 0) {
          const jsonText = text.substring(startIndex);
          const data = JSON.parse(jsonText);
          
          // Speichern der relevanten Daten
          const event = {
            type: 'poll_data',
            timestamp: new Date().toISOString(),
            data: data.pollAnswerLifeCycle,
            isBatchProcessing: data.pollAnswerLifeCycle.batchProcessing === true
          };
          
          // Zählen der verschiedenen Event-Typen
          if (event.isBatchProcessing) {
            batchProcessingEvents++;
          } else {
            finalEvents++;
          }
          
          pubsubEvents.push(event);
        }
      } catch (error) {
        console.error('Fehler beim Parsen der PubSub-Daten:', error);
      }
    }
    // Tracking der UI-Updates
    else if (text.includes('Updating poll answer data:') || 
             text.includes('Current UI values after update:') ||
             text.includes('- Answers:') || 
             text.includes('- Users:')) {
      pubsubEvents.push({
        type: 'ui_update',
        timestamp: new Date().toISOString(),
        message: text
      });
    }
  }
};

// Funktion zum Anzeigen aller gesammelten Events
function showPubsubEvents() {
  console.log(`${pubsubEvents.length} PubSub-Events erfasst:`);
  console.log(`- ${batchProcessingEvents} Events mit batchProcessing=true`);
  console.log(`- ${finalEvents} Events mit batchProcessing=false`);
  
  // Formatierte Übersicht der Events
  console.table(pubsubEvents.map(e => ({
    type: e.type,
    timestamp: e.timestamp,
    batchProcessing: e.type === 'poll_data' ? e.isBatchProcessing : '-',
    pollAnswersCount: e.type === 'poll_data' ? e.data.pollAnswersCount : '-',
    pollUserCount: e.type === 'poll_data' ? e.data.pollUserCount : '-',
    pollUserVotedCount: e.type === 'poll_data' ? e.data.pollUserVotedCount : '-'
  })));
  
  return pubsubEvents;
}

// Funktion zum Anzeigen des letzten Events
function showLastEvent() {
  if (pubsubEvents.length === 0) {
    console.log('Keine Events erfasst');
    return;
  }
  
  const lastEvent = pubsubEvents[pubsubEvents.length - 1];
  console.log('Letztes PubSub-Event:');
  console.log(lastEvent);
  
  if (lastEvent.type === 'poll_data') {
    console.log('Zählerstand:');
    console.log(`- Stimmen: ${lastEvent.data.pollAnswersCount}/${lastEvent.data.maxVotes}`);
    console.log(`- Benutzer: ${lastEvent.data.pollUserVotedCount}/${lastEvent.data.pollUserCount}`);
    console.log(`- Batch-Verarbeitung: ${lastEvent.data.batchProcessing ? 'Ja' : 'Nein'}`);
  }
  
  return lastEvent;
}

// Funktion zum Exportieren aller Events als JSON
function exportPubsubEvents() {
  const json = JSON.stringify(pubsubEvents, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pubsub-events.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
  console.log(`${pubsubEvents.length} Events exportiert`);
}

// Hilfe-Funktion zur Anzeige der verfügbaren Befehle
function pubsubHelp() {
  console.log('Verfügbare Befehle:');
  console.log('- showPubsubEvents(): Zeigt alle erfassten PubSub-Events an');
  console.log('- showLastEvent(): Zeigt das letzte PubSub-Event an');
  console.log('- exportPubsubEvents(): Exportiert alle Events als JSON-Datei');
  console.log('- pubsubHelp(): Zeigt diese Hilfe an');
}

console.log('%cPubSub Event Tracker aktiviert!', 'color: green; font-weight: bold; font-size: 14px');
console.log('Verwenden Sie eine der folgenden Funktionen:');
pubsubHelp();