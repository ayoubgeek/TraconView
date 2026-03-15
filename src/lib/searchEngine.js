// @ts-check
/** @import { Aircraft, SearchResult } from '../types/index.js' */

/**
 * searchEngine.js
 * 
 * Provides global search capability across the loaded aircraft map.
 * Ranks results based on exact/partial matches on various fields.
 */

/**
 * Searches the aircraft map for the given query.
 * 
 * @param {string} query 
 * @param {Map<string, Aircraft>} aircraftMap 
 * @returns {SearchResult[]}
 */
export function search(query, aircraftMap) {
    if (!query || query.trim().length < 2) return [];
    
    const q = query.trim().toUpperCase();
    /** @type {SearchResult[]} */
    const results = [];
    
    for (const [, ac] of aircraftMap.entries()) {
        let score = 0;
        /** @type {string|null} */
        let matchedField = null;
        /** @type {string|null} */
        let matchedValue = null;
        
        // Weighting: callsign=4, icao24=3, registration=2, operator=1, aircraftType=1
        // Bonus for exact match vs partial match
        /**
         * @param {any} fieldValue 
         * @param {string} fieldName 
         * @param {number} weight 
         */
        const checkField = (fieldValue, fieldName, weight) => {
            if (!fieldValue) return;
            const val = String(fieldValue).toUpperCase();
            if (val === q) {
                // Exact match gets weight * 2
                if (score < weight * 2) {
                    score = weight * 2;
                    matchedField = fieldName;
                    matchedValue = fieldValue;
                }
            } else if (val.includes(q)) {
                // Partial match gets normal weight
                if (score < weight) {
                    score = weight;
                    matchedField = fieldName;
                    matchedValue = fieldValue;
                }
            }
        };

        checkField(ac.aircraftType, 'aircraftType', 1);
        checkField(ac.operator, 'operator', 1);
        checkField(ac.registration, 'registration', 2);
        checkField(ac.icao24, 'icao24', 3);
        checkField(ac.callsign, 'callsign', 4);
        
        if (score > 0 && matchedField && matchedValue) {
            results.push({
                aircraft: ac,
                matchedField,
                matchedValue,
                relevanceScore: score
            });
        }
    }
    
    // Sort by relevance descending. For ties, sort by callsign alphabetically.
    results.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
        }
        return (a.aircraft.callsign || '').localeCompare(b.aircraft.callsign || '');
    });
    
    return results.slice(0, 10);
}
