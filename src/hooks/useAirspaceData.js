// src/hooks/useAirspaceData.js
import { useState, useEffect } from 'react';
import { useFlightStore } from '../store/flightStore';

// Map specific regions to their geojson files
const REGION_FILE_MAP = {
  'EUROPE': 'airspaces-eu.geojson',
  'GERMANY': 'airspaces-eu.geojson', // Shares same dataset for MVP
  'MOROCCO': 'airspaces-mena.geojson',
};

export function useAirspaceData() {
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAirspace = async () => {
      const fileName = REGION_FILE_MAP[selectedRegion.key];
      if (!fileName) {
        setGeojsonData(null);
        return;
      }
      
      try {
        setLoading(true);
        const res = await fetch(`/data/${fileName}`);
        if (res.ok) {
          const data = await res.json();
          setGeojsonData(data);
        } else {
          setGeojsonData(null);
        }
      } catch (err) {
        console.warn("Failed to load airspace geojson", err);
        setGeojsonData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAirspace();
  }, [selectedRegion.key]);

  return { geojsonData, loading };
}
