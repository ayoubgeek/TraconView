export function getHeadingDelta(h1, h2) {
  return ((h2 - h1 + 540) % 360) - 180;
}

export function detectHolding(positions) {
  if (!positions || positions.length < 8) return { isHolding: false, cumulativeHeading: 0 };
  
  const latestAlt = positions[positions.length - 1].altitude;
  if (latestAlt !== undefined && latestAlt !== null && latestAlt < 1000) return { isHolding: false, cumulativeHeading: 0 };

  let cumulativeHeading = 0;
  for (let i = 1; i < positions.length; i++) {
    const delta = getHeadingDelta(positions[i - 1].heading, positions[i].heading);
    cumulativeHeading += Math.abs(delta);
  }

  return { isHolding: cumulativeHeading > 300, cumulativeHeading };
}

export function hasExitedHolding(positions) {
  if (!positions || positions.length < 5) return false;
  
  const last5 = positions.slice(-5);
  let cumulativeHeading = 0;
  for (let i = 1; i < last5.length; i++) {
    const delta = getHeadingDelta(last5[i - 1].heading, last5[i].heading);
    cumulativeHeading += Math.abs(delta);
  }

  return cumulativeHeading < 30;
}

export function updatePositionHistory(history, aircraftArray, currentTimeSecs = Date.now() / 1000) {
  const newHistory = new Map(history);
  
  for (const ac of aircraftArray) {
    if (!ac.lat || !ac.lng) continue;
    
    let entries = newHistory.get(ac.id) || [];
    entries = [...entries, {
      lat: ac.lat,
      lng: ac.lng,
      heading: ac.heading,
      altitude: ac.altitude,
      timestamp: ac.lastSeen || currentTimeSecs
    }];
    
    if (entries.length > 10) {
      entries = entries.slice(-10);
    }
    newHistory.set(ac.id, entries);
  }
  
  for (const [id, entries] of newHistory.entries()) {
    if (entries.length === 0) continue;
    const lastSeen = entries[entries.length - 1].timestamp;
    if (currentTimeSecs - lastSeen > 30) {
      newHistory.delete(id);
    }
  }
  
  return newHistory;
}
