import { useEffect } from 'react';
import { useSnapshotStore } from '../store/snapshotStore';
import { useFlightStore } from '../store/flightStore';
import { SNAPSHOT_POLL_INTERVAL_MS } from '../lib/constants';

export function useRadarSnapshot() {
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const currentSnapshot = useSnapshotStore(state => state.currentSnapshot);
  const previousSnapshot = useSnapshotStore(state => state.previousSnapshot);
  const loading = useSnapshotStore(state => state.loading);
  const error = useSnapshotStore(state => state.error);
  const fetchLatestSnapshot = useSnapshotStore(state => state.fetchLatestSnapshot);

  useEffect(() => {
    if (!selectedRegion) return;

    // Initial fetch on mount or region change
    fetchLatestSnapshot(selectedRegion.key);

    // Setup polling interval
    const intervalId = setInterval(() => {
      fetchLatestSnapshot(selectedRegion.key);
    }, SNAPSHOT_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [selectedRegion, fetchLatestSnapshot]);

  return { snapshot: currentSnapshot, previousSnapshot, loading, error };
}
