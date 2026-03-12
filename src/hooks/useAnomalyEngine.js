// src/hooks/useAnomalyEngine.js
import { useEffect, useRef } from 'react';
import { useFlightStore } from '../store/flightStore';
import { checkAnomalies } from '../lib/anomalyRules';
import { ANOMALY_SEVERITY } from '../lib/constants';
import { supabase } from '../lib/supabase';

// Web Audio API beep for critical alerts
const playCriticalBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio play failed", e);
  }
};

export function useAnomalyEngine() {
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const addAnomaly = useFlightStore(state => state.addAnomaly);
  const isMuted = useFlightStore(state => state.isMuted);
  const lastRefresh = useFlightStore(state => state.lastRefresh);
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const setAircraftData = useFlightStore(state => state.setAircraftData);
  
  const processedTimestamps = useRef(new Set());

  useEffect(() => {
    // Only process if we have a new refresh block
    if (!lastRefresh || processedTimestamps.current.has(lastRefresh)) return;
    
    // Add to processed to prevent duplicate engine runs for the same data
    processedTimestamps.current.add(lastRefresh);
    // Keep set small
    if (processedTimestamps.current.size > 10) {
      const arr = Array.from(processedTimestamps.current);
      processedTimestamps.current = new Set(arr.slice(arr.length - 5));
    }

    let playedSoundThisTick = false;

    // Scan all aircraft for anomalies
    aircraftArray.forEach(aircraft => {
      const anomalyResult = checkAnomalies(aircraft);
      
      if (anomalyResult) {
        // We found an anomaly!
        const anomalyRecord = {
          id: `${aircraft.id}-${anomalyResult.type}-${lastRefresh}`,
          icao24: aircraft.id,
          callsign: aircraft.callsign,
          type: anomalyResult.type,
          severity: anomalyResult.severity,
          altitude: aircraft.altitude,
          speed: aircraft.speed,
          verticalRate: aircraft.verticalRate,
          squawk: aircraft.squawk,
          lat: aircraft.lat,
          lng: aircraft.lng,
          region: selectedRegion.key,
          detectedAt: new Date().toISOString()
        };
        
        addAnomaly(anomalyRecord);
        
        // Asynchronously log to Supabase
        if (supabase) {
          supabase.from('anomaly_log').insert([{
            icao24: anomalyRecord.icao24,
            callsign: anomalyRecord.callsign,
            anomaly_type: anomalyRecord.type,
            severity: anomalyRecord.severity,
            altitude_ft: Math.round(anomalyRecord.altitude),
            speed_kts: Math.round(anomalyRecord.speed),
            vertical_rate_fpm: Math.round(anomalyRecord.verticalRate),
            squawk: anomalyRecord.squawk,
            latitude: anomalyRecord.lat,
            longitude: anomalyRecord.lng,
            region: anomalyRecord.region
          }]).then(({ error }) => {
            if (error) console.error("Supabase anomaly_log insert error:", error.message);
          });
        }

        // Play sound if critical, not muted, and we haven't played one this tick yet to avoid ear rape
        if (anomalyResult.severity === ANOMALY_SEVERITY.CRITICAL && !isMuted && !playedSoundThisTick) {
          playCriticalBeep();
          playedSoundThisTick = true;
        }
      }
    });

    // Enrich aircraft with anomaly data for rendering
    const enriched = aircraftArray.map(ac => {
      const result = checkAnomalies(ac);
      return result 
        ? { ...ac, anomaly: result.type, anomalySeverity: result.severity }
        : { ...ac, anomaly: null, anomalySeverity: null };
    });
    // Only update if something changed
    if (enriched.some((ac, i) => ac.anomaly !== aircraftArray[i]?.anomaly)) {
      setAircraftData(enriched, lastRefresh);
    }

  }, [aircraftArray, lastRefresh, addAnomaly, isMuted, selectedRegion, setAircraftData]);
}
