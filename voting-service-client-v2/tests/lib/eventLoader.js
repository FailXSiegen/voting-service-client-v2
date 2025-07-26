// eventLoader.js
// Lädt Event-Informationen dynamisch aus der API

async function loadEventInfo(baseUrl, eventSlug) {
    try {
        const response = await fetch(`${baseUrl}/api/event/${eventSlug}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const eventData = await response.json();
        
        console.log(`Event geladen: ID ${eventData.id}, Slug: ${eventData.slug}`);
        return {
            id: eventData.id,
            slug: eventData.slug,
            title: eventData.title,
            polls: eventData.polls || []
        };
    } catch (error) {
        console.error(`Fehler beim Laden des Events ${eventSlug}:`, error.message);
        throw error;
    }
}

module.exports = { loadEventInfo };