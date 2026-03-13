import React from 'react';
import { Polyline } from 'react-leaflet';
import { useFlightStore } from '../../store/flightStore';

export default function HoldingTrails() {
  const positionHistory = useFlightStore(state => state.positionHistory);
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  
  const holdingPlanes = aircraftArray.filter(a => a.isHolding);
  
  if (holdingPlanes.length === 0) return null;

  return (
    <>
      {holdingPlanes.map(ac => {
        const positions = positionHistory.get(ac.id);
        if (!positions || positions.length < 2) return null;
        
        const latLngs = positions.map(p => [p.lat, p.lng]);
        
        return (
          <Polyline 
            key={`trail-${ac.id}`}
            positions={latLngs}
            color="#a78bfa"
            weight={2}
            dashArray="4, 4"
            opacity={0.6}
            interactive={false}
          />
        );
      })}
    </>
  );
}
