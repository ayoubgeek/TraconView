import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSnapshotStore } from '../../src/store/snapshotStore';

// We need to mock Supabase client if snapshotStore uses it directly.
// But usually, state actions handle the fetching, or we mock the global fetch/supabase depending on implementation.
// Assuming snapshotStore has a fetchLatestSnapshot(region) which calls some API.

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({
    data: [
      { id: '1', snapshot_time: '2026-03-14T22:15:00Z', statistics: { total: 100 } },
      { id: '2', snapshot_time: '2026-03-14T22:05:00Z', statistics: { total: 90 } }
    ],
    error: null
  })
};

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockQueryBuilder)
  }
}));

describe('snapshotStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useSnapshotStore.setState({
      currentSnapshot: null,
      previousSnapshot: null,
      loading: false,
      error: null,
      lastFetchedAt: null
    });
  });

  it('fetchLatestSnapshot sets currentSnapshot and previousSnapshot correctly', async () => {
    const store = useSnapshotStore.getState();
    await store.fetchLatestSnapshot('EUROPE');
    
    const updatedStore = useSnapshotStore.getState();
    expect(updatedStore.currentSnapshot).toBeDefined();
    expect(updatedStore.currentSnapshot.id).toBe('1');
    expect(updatedStore.previousSnapshot).toBeDefined();
    expect(updatedStore.previousSnapshot.id).toBe('2');
    expect(updatedStore.error).toBeNull();
    expect(updatedStore.loading).toBe(false);
  });

  it('empty-array response leaves snapshot null with no error thrown', async () => {
    // Override the mock for this specific test
    mockQueryBuilder.limit.mockResolvedValueOnce({ data: [], error: null });

    const store = useSnapshotStore.getState();
    await store.fetchLatestSnapshot('EUROPE');

    const updatedStore = useSnapshotStore.getState();
    expect(updatedStore.currentSnapshot).toBeNull();
    expect(updatedStore.previousSnapshot).toBeNull();
    expect(updatedStore.error).toBeNull();
  });
});
