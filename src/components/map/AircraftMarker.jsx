// LEGACY — AircraftMarker is no longer rendered in production.
// AircraftLayer (T043) manages markers imperatively via useRef(new Map()).
// This file is kept for reference only. Do not add new features here.
import React, { memo, useEffect, useState } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CALLSIGN_LABEL_MIN_ZOOM, SELECTED_Z_INDEX_OFFSET } from '../../lib/constants';
import { getCategorizedIcon } from '../../lib/iconUtils';

const AircraftMarker = memo(({ aircraft, isSelected, onClick, isStale }) => {
  const map = useMap();
  const [showLabel, setShowLabel] = useState(map.getZoom() >= CALLSIGN_LABEL_MIN_ZOOM);

  useEffect(() => {
    const handleZoom = () => {
      setShowLabel(map.getZoom() >= CALLSIGN_LABEL_MIN_ZOOM);
    };
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  const icon = getCategorizedIcon(aircraft.category, aircraft.heading, isSelected, isStale);
  const zIndexOffset = isSelected ? SELECTED_Z_INDEX_OFFSET : 0;

  return (
    <Marker
      position={[aircraft.lat, aircraft.lng]}
      icon={icon}
      zIndexOffset={zIndexOffset}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          if (onClick) onClick(aircraft.id);
        }
      }}
    >
      {showLabel && (
        <Tooltip direction="top" offset={[0, -10]} className="bg-radar-bg text-atc-green border-radar-grid font-data text-xs" opacity={0.9} permanent>
          {aircraft.callsign || aircraft.id}
        </Tooltip>
      )}
    </Marker>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.aircraft.lat === nextProps.aircraft.lat &&
    prevProps.aircraft.lng === nextProps.aircraft.lng &&
    prevProps.aircraft.heading === nextProps.aircraft.heading &&
    prevProps.aircraft.category === nextProps.aircraft.category &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isStale === nextProps.isStale
  );
});

export default AircraftMarker;
