import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFlightStore } from '../../src/store/flightStore';
import { fetchMetarData } from '../../src/lib/metarClient';

global.fetch = vi.fn();

describe('METAR Pipeline Integration', () => {
  beforeEach(() => {
    useFlightStore.setState({ metarData: new Map(), selectedRegion: { key: 'MOROCCO' } });
    vi.clearAllMocks();
  });

  const mockMetarJson = [
    {
      icaoId: 'GMMN',
      rawOb: 'GMMN 131430Z 27015KT 10SM SCT035 22/15 Q1012',
      obsTime: '2024-05-13T14:30:00Z',
      fltcat: 'VFR',
      wdir: 270,
      wspd: 15,
      visib: 10.0,
      clouds: [{ cover: 'SCT', base: 3500 }]
    },
    {
      icaoId: 'GMME',
      rawOb: 'GMME 131430Z 00000KT 1SM BR OVC005 18/18 Q1010',
      obsTime: '2024-05-13T14:30:00Z',
      fltcat: 'IFR',
      wdir: 0,
      wspd: 0,
      visib: 1.0,
      clouds: [{ cover: 'OVC', base: 500 }]
    }
  ];

  it('end-to-end METAR fetch and store update', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetarJson
    });

    const stationList = ['GMMN', 'GMME'];
    const newData = await fetchMetarData(stationList);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/metar-proxy?ids=' + stationList.join(',') + '&format=json');
    
    expect(newData.length).toBe(2);
    expect(newData[0].fltCat).toBe('VFR');
    expect(newData[1].fltCat).toBe('IFR');
    
    const setMetarData = useFlightStore.getState().setMetarData;
    setMetarData(newData);
    
    const currentStoreData = useFlightStore.getState().metarData;
    expect(currentStoreData.get('GMMN').rawOb).toContain('27015KT');
    expect(currentStoreData.get('GMME').wspd).toBe(0);
  });

  it('handles partial failures gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    const newData = await fetchMetarData(['GMMX']);
    expect(newData.length).toBe(0);
    
    const setMetarData = useFlightStore.getState().setMetarData;
    setMetarData(newData);
    expect(useFlightStore.getState().metarData.size).toBe(0);
  });
});
