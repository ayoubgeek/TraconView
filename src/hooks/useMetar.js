import { useEffect } from 'react';
import { useFlightStore } from '../store/flightStore';
import { fetchMetarData } from '../lib/metarClient';
import { getAirportsForRegion } from '../lib/airportData';

export function useMetar() {
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const setMetarData = useFlightStore(state => state.setMetarData);

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    const pollMetar = async () => {
      if (!selectedRegion) return;
      const airports = getAirportsForRegion(selectedRegion.key);
      const stations = airports.map(a => a.icao);
      if (stations.length === 0) return;

      try {
        const data = await fetchMetarData(stations);
        if (isMounted && data.length > 0) {
          setMetarData(data);
        }
      } catch (err) {
        console.warn("Failed to poll METAR data", err);
      }
    };

    pollMetar(); // Initial fetch
    // Poll every 5 minutes
    timer = setInterval(pollMetar, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [selectedRegion, setMetarData]);
}
