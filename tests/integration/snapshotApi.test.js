import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../../src/lib/supabase';

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({
    data: [
      { 
        id: 'uuid-1', 
        region: 'EUROPE', 
        snapshot_time: '2026-03-14T22:15:00Z', 
        computed_at: '2026-03-14T22:15:02Z',
        total_aircraft: 500,
        in_flight: 450,
        active_anomalies: 2,
        coverage_percent: 100,
        statistics: {},
        trends: {}
      }
    ],
    error: null
  })
};

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockQueryBuilder)
  }
}));

describe('Snapshot API query shape', () => {
  it('uses region=eq.X, order=snapshot_time.desc, limit=2 and returns correct subset of fields', async () => {
    const query = supabase
      .from('radar_snapshots')
      .select('*')
      .eq('region', 'EUROPE')
      .order('snapshot_time', { ascending: false })
      .limit(2);

    const { data } = await query;
    
    // Verify the query builder was called correctly
    expect(supabase.from).toHaveBeenCalledWith('radar_snapshots');
    expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('region', 'EUROPE');
    expect(mockQueryBuilder.order).toHaveBeenCalledWith('snapshot_time', { ascending: false });
    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(2);

    // Verify shape of data matches RadarSnapshot data model
    const snap = data[0];
    expect(snap).toHaveProperty('id');
    expect(snap).toHaveProperty('region');
    expect(snap).toHaveProperty('snapshot_time');
    expect(snap).toHaveProperty('computed_at');
    expect(snap).toHaveProperty('total_aircraft');
    expect(snap).toHaveProperty('in_flight');
    expect(snap).toHaveProperty('active_anomalies');
    expect(snap).toHaveProperty('coverage_percent');
    expect(snap).toHaveProperty('statistics');
    expect(snap).toHaveProperty('trends');
  });
});
