import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useSnapshotStore = create((set) => ({
  currentSnapshot: null,
  previousSnapshot: null,
  loading: false,
  error: null,
  lastFetchedAt: null,

  fetchLatestSnapshot: async (region) => {
    if (!region) return;
    
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('radar_snapshots')
        .select('*')
        .eq('region', region)
        .order('snapshot_time', { ascending: false })
        .limit(2);

      if (error) throw error;

      if (data && data.length > 0) {
        set({
          currentSnapshot: data[0] || null,
          previousSnapshot: data[1] || null,
          lastFetchedAt: Date.now(),
          loading: false,
          error: null
        });
      } else {
        set({
          currentSnapshot: null,
          previousSnapshot: null,
          lastFetchedAt: Date.now(),
          loading: false,
          error: null
        });
      }
    } catch (err) {
      console.error('Failed to fetch radar snapshot:', err);
      set({ 
        error: err.message || 'Failed to load snapshot',
        loading: false 
      });
    }
  }
}));
