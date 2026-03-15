/**
 * Sorts an array of aircraft objects based on a specific column and direction.
 * @param {Array} aircraftArray - The array of aircraft to sort.
 * @param {string} column - The property key to sort by.
 * @param {string} direction - 'asc' or 'desc'.
 * @returns {Array} A new sorted array.
 */
export function sortAircraft(aircraftArray, column, direction) {
    return [...aircraftArray].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Handle nulls: always put nulls at the end
        if (valA == null && valB != null) return 1;
        if (valB == null && valA != null) return -1;
        if (valA == null && valB == null) return 0;

        if (typeof valA === 'string' && typeof valB === 'string') {
            const comparison = valA.localeCompare(valB);
            return direction === 'asc' ? comparison : -comparison;
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
            return direction === 'asc' ? valA - valB : valB - valA;
        }

        // Fallback for other potential types
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        
        return 0;
    });
}

/**
 * Filters an array of aircraft to only include those that reside within the provided bounds.
 * @param {Array} aircraftArray - The array of aircraft.
 * @param {Object} leafletBounds - A Leaflet LatLngBounds object.
 * @returns {Array} The filtered array.
 */
export function filterByBounds(aircraftArray, leafletBounds) {
    if (!leafletBounds) return aircraftArray;

    return aircraftArray.filter(ac => {
        if (ac.lat == null || ac.lng == null) return false;
        // The tests mock Leaflet Bounds with contains([lat, lng]) instead of contains(L.latLng())
        // but in real Leaflet, it's typically bounds.contains([lat, lng]) or contains(LatLng)
        // Adjusting implementation to match test and standard Leaflet behavior
        return leafletBounds.contains([ac.lat, ac.lng]);
    });
}
