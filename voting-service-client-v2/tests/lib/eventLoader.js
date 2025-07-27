// eventLoader.js
// Lädt Event-Informationen dynamisch aus der API

/**
 * Lädt Event-Informationen über GraphQL API
 * @param {string} baseUrl - Base URL der API  
 * @param {string} eventSlug - Event Slug (z.B. 'lasttest-2025')
 * @returns {Promise<Object>} Event-Daten mit ID, slug, title
 */
async function loadEventInfo(baseUrl, eventSlug) {
    try {
        console.log(`[EVENT_LOADER] Lade Event für Slug: ${eventSlug}`);
        
        // GraphQL Query um Event by Slug zu laden (ohne Auth für öffentliche Events)
        const query = `
            query GetPublicEventBySlug($slug: String!) {
                publicEventBySlug(slug: $slug) {
                    id
                    title
                    slug
                    active
                    lobbyOpen
                    multivoteType
                }
            }
        `;
        
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { slug: eventSlug }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.errors) {
            console.error(`[EVENT_LOADER] GraphQL Fehler:`, data.errors);
            throw new Error(`GraphQL Error: ${data.errors.map(e => e.message).join(', ')}`);
        }
        
        const eventData = data.data?.publicEventBySlug;
        if (!eventData) {
            throw new Error(`Kein Event mit Slug '${eventSlug}' gefunden`);
        }
        
        console.log(`[EVENT_LOADER] ✅ Event geladen: ID ${eventData.id}, Title: "${eventData.title}"`);
        return {
            id: parseInt(eventData.id),
            slug: eventData.slug,
            title: eventData.title,
            active: eventData.active,
            lobbyOpen: eventData.lobbyOpen,
            multivoteType: eventData.multivoteType
        };
        
    } catch (error) {
        console.error(`[EVENT_LOADER] ❌ Fehler beim Laden des Events ${eventSlug}:`, error.message);
        throw error;
    }
}

/**
 * Aktualisiert CONFIG mit dynamisch geladener Event-ID
 * @param {Object} config - CONFIG Objekt
 * @returns {Promise<Object>} Aktualisiertes CONFIG Objekt
 */
async function loadEventIdIntoConfig(config) {
    if (config.EVENT_ID && config.EVENT_ID > 0) {
        console.log(`[EVENT_LOADER] Verwende bestehende EVENT_ID: ${config.EVENT_ID}`);
        return config;
    }
    
    try {
        const eventData = await loadEventInfo(config.API_URL, config.EVENT_SLUG);
        config.EVENT_ID = eventData.id;
        console.log(`[EVENT_LOADER] ✅ CONFIG.EVENT_ID aktualisiert auf: ${eventData.id}`);
        return config;
    } catch (error) {
        console.error(`[EVENT_LOADER] ❌ Fallback auf Standard EVENT_ID`);
        config.EVENT_ID = 6; // Fallback auf aktuelle Event-ID
        return config;
    }
}

module.exports = { 
    loadEventInfo,
    loadEventIdIntoConfig 
};