import L from 'leaflet';

export function updateMarkersImperatively(markerMap, newAircraftArray, clusterGroup, createIcon, options = {}) {
    const { 
        selectedAircraftId = null, 
        onClick = null,
        casablancaFirFocus = false,
        firFeature = null,
        firBbox = null,
        pointInPolygon = () => false,
        STALE_AIRCRAFT_TTL_MS = 60000,
        riskScores = new Map(),
        anomalyIcons = null
    } = options;

    const newKeys = new Set();
    const toAdd = [];
    const toRemove = [];
    const now = Date.now();
    
    for (let i = 0; i < newAircraftArray.length; i++) {
        const ac = newAircraftArray[i];
        if (ac.lat == null || ac.lng == null) continue;
        
        newKeys.add(ac.id);
        
        const isSelected = selectedAircraftId === ac.id;
        const riskResult = riskScores ? riskScores.get(ac.id) : null;
        const threshold = riskResult ? riskResult.threshold : 'NORMAL';
        
        const isCriticalOrWarning = threshold === 'CRITICAL' || threshold === 'WARNING';
        
        let isStale = false;
        if (ac.lastSeen) {
             isStale = (now - Math.floor(ac.lastSeen * 1000)) > STALE_AIRCRAFT_TTL_MS;
        }

        let isDimmed = false;
        if (casablancaFirFocus && firFeature && firBbox && !isSelected) {
             const inside = pointInPolygon(ac.lng, ac.lat, firFeature.geometry, firBbox);
             if (!inside) {
               isDimmed = true;
             }
        }
        
        const computeIsStale = isStale || isDimmed;
        const showAnomaly = isCriticalOrWarning && !isSelected && !isDimmed && anomalyIcons;
        
        let markerRecord = markerMap.get(ac.id);
        
        const acData = {
           lat: ac.lat, 
           lng: ac.lng, 
           heading: ac.heading,
           category: ac.category,
           isStale: computeIsStale,
           isSelected: isSelected,
           showAnomaly: showAnomaly,
           threshold: threshold
        };
        
        if (!markerRecord) {
            // Create new main marker
            const icon = createIcon({ ...ac }, isSelected, computeIsStale);
            const marker = L.marker([ac.lat, ac.lng], { 
                icon, 
                zIndexOffset: isSelected ? 1000 : 0 
            });
            
            // Add tooltip
            marker.bindTooltip(ac.callsign || ac.id, {
                permanent: true,
                direction: "top",
                offset: L.point(0, -10),
                className: "bg-radar-bg text-atc-green border-radar-grid font-data text-xs callsign-tooltip",
                opacity: 0.9
            });
            
            if (onClick) {
                marker.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    onClick(ac.id);
                });
            }
            
            toAdd.push(marker);
            
            // Create anomaly marker if needed
            let anomalyMarker = null;
            if (showAnomaly) {
                anomalyMarker = L.marker([ac.lat, ac.lng], {
                    icon: anomalyIcons[threshold] || anomalyIcons['MEDIUM'],
                    interactive: false,
                    zIndexOffset: 1000
                });
                toAdd.push(anomalyMarker);
            }
            
            markerRecord = { main: marker, anomaly: anomalyMarker, acData };
            markerMap.set(ac.id, markerRecord);
        } else {
            // Update existing
            const { main, anomaly: oldAnomaly } = markerRecord;
            const prev = markerRecord.acData;
            let moved = false;
            let iconChanged = false;
            
            if (prev.lat !== ac.lat || prev.lng !== ac.lng) moved = true;
            if (prev.heading !== ac.heading || prev.category !== ac.category || prev.isStale !== computeIsStale || prev.isSelected !== isSelected) {
                iconChanged = true;
            }
            
            if (moved) {
                main.setLatLng([ac.lat, ac.lng]);
            }
            if (iconChanged) {
                main.setIcon(createIcon({ ...ac }, isSelected, computeIsStale));
                if (isSelected !== prev.isSelected) {
                    main.setZIndexOffset(isSelected ? 1000 : 0);
                }
            }
            
            // Handle Anomaly Marker Updates
            let newAnomalyMarker = oldAnomaly;
            if (showAnomaly && !prev.showAnomaly) {
                // Anomaly appeared
                newAnomalyMarker = L.marker([ac.lat, ac.lng], {
                    icon: anomalyIcons[threshold] || anomalyIcons['MEDIUM'],
                    interactive: false,
                    zIndexOffset: 1000
                });
                toAdd.push(newAnomalyMarker);
            } else if (!showAnomaly && prev.showAnomaly) {
                // Anomaly removed
                if (oldAnomaly) toRemove.push(oldAnomaly);
                newAnomalyMarker = null;
            } else if (showAnomaly && prev.showAnomaly) {
                // Anomaly persists, maybe moved or severity changed
                if (moved && oldAnomaly) {
                    oldAnomaly.setLatLng([ac.lat, ac.lng]);
                }
                if (prev.threshold !== threshold && oldAnomaly) {
                    oldAnomaly.setIcon(anomalyIcons[threshold] || anomalyIcons['MEDIUM']);
                }
            }
            
            markerRecord.anomaly = newAnomalyMarker;
            markerRecord.acData = acData;
        }
    }
    
    // Remove old markers
    for (const [id, record] of markerMap.entries()) {
        if (!newKeys.has(id)) {
            toRemove.push(record.main);
            if (record.anomaly) toRemove.push(record.anomaly);
            markerMap.delete(id);
        }
    }
    
    // In test environment or generic Leaflet layer group we might not have removeLayers
    if (toRemove.length > 0) {
        if (clusterGroup.removeLayers) clusterGroup.removeLayers(toRemove);
        else toRemove.forEach(m => {
            if (clusterGroup.removeLayer) clusterGroup.removeLayer(m);
        });
    }
    if (toAdd.length > 0) {
        if (clusterGroup.addLayers) clusterGroup.addLayers(toAdd);
        else toAdd.forEach(m => {
             if (clusterGroup.addLayer) clusterGroup.addLayer(m);
        });
    }
}
