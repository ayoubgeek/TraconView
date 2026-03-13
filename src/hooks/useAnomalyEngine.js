import { useEffect, useRef } from 'react';
import { useFlightStore } from '../store/flightStore';
import { computeRiskScore } from '../lib/riskScoring';
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
  const addOrUpdateAlert = useFlightStore(state => state.addOrUpdateAlert);
  const resolveAlert = useFlightStore(state => state.resolveAlert);
  const isMuted = useFlightStore(state => state.isMuted);
  const lastRefresh = useFlightStore(state => state.lastRefresh);
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const riskScores = useFlightStore(state => state.riskScores);
  
  const processedTimestamps = useRef(new Set());

  useEffect(() => {
    // Only process if we have a new refresh block
    if (!lastRefresh || processedTimestamps.current.has(lastRefresh)) return;
    
    processedTimestamps.current.add(lastRefresh);
    if (processedTimestamps.current.size > 10) {
      const arr = Array.from(processedTimestamps.current);
      processedTimestamps.current = new Set(arr.slice(arr.length - 5));
    }

    let playedSoundThisTick = false;
    const newRiskScores = new Map(riskScores);
    let storeChanged = false;

    aircraftArray.forEach(aircraft => {
      const prevResult = riskScores.get(aircraft.id);
      const prevScore = prevResult ? prevResult.score : 0;
      
      const riskResult = computeRiskScore(aircraft, prevScore);
      newRiskScores.set(aircraft.id, riskResult);
      storeChanged = true;

      // > 25 means CAUTION, WARNING, or CRITICAL -> Active Anomaly
      if (riskResult.score > 25) {
        // Construct alert record
        const alertRecord = {
          id: `${aircraft.id}-${lastRefresh}`,
          icao24: aircraft.id,
          callsign: aircraft.callsign || aircraft.id,
          riskScore: riskResult.score,
          reasons: riskResult.rules.map(r => ({ type: r.id, label: r.label, severity: riskResult.threshold })),
          lat: aircraft.lat,
          lng: aircraft.lng,
          altitude: aircraft.altitude,
          speed: aircraft.speed,
          squawk: aircraft.squawk,
          region: selectedRegion.key,
          detectedAt: new Date().toISOString(),
          isResolved: false,
          resolvedAt: null
        };
        
        addOrUpdateAlert(alertRecord);

        // Asynchronously log to Supabase
        if (supabase) {
          supabase.from('anomaly_log').insert([{
            icao24: alertRecord.icao24,
            callsign: alertRecord.callsign,
            anomaly_type: alertRecord.reasons.map(r => r.type).join(','),
            severity: riskResult.threshold,
            altitude_ft: Math.round(alertRecord.altitude),
            speed_kts: Math.round(alertRecord.speed),
            vertical_rate_fpm: Math.round(aircraft.verticalRate || 0),
            squawk: alertRecord.squawk,
            latitude: alertRecord.lat,
            longitude: alertRecord.lng,
            region: alertRecord.region,
            risk_score: riskResult.score
          }]).then(({ error }) => {
            if (error) console.error("Supabase anomaly_log insert error:", error.message);
          });
        }
      } else {
        // Score <= 25 (NORMAL or WATCH), resolve active alerts
        resolveAlert(aircraft.id);
      }

      // Play sound if critical, not muted, and we haven't played one this tick yet
      if (riskResult.isNewCritical && !isMuted && !playedSoundThisTick) {
        playCriticalBeep();
        playedSoundThisTick = true;
      }
    });

    if (storeChanged) {
      useFlightStore.setState({ riskScores: newRiskScores });
    }

  }, [aircraftArray, lastRefresh, addOrUpdateAlert, resolveAlert, isMuted, selectedRegion]); // removed setAircraftData completely
}
