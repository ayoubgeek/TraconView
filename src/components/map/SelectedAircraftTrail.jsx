/**
 * @file SelectedAircraftTrail.jsx
 * @description Renders the historical path of the selected aircraft.
 */

import React from 'react';
import { Polyline } from 'react-leaflet';
import { useSelection } from '../../context/SelectionContext';
import { useAircraftTrack } from '../../hooks/useAircraftTrack';

export default function SelectedAircraftTrail() {
  const { selectedAircraftId } = useSelection();
  const { track } = useAircraftTrack(selectedAircraftId);

  if (!selectedAircraftId || !track || track.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={track}
      className="selected-aircraft-trail"
      pathOptions={{
        color: 'var(--color-accent)',
        weight: 3,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      }}
    />
  );
}
