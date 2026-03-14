import { describe, it, expect } from 'vitest';
import { classifyAircraft } from '../../src/lib/aircraftClassifier';

describe('aircraftClassifier', () => {
  describe('classifyAircraft', () => {
    it('returns high confidence category when dbInfo provides a valid category', () => {
      const dbInfo = { category: 'business_jet' };
      expect(classifyAircraft({ id: '123' }, dbInfo)).toEqual({
        category: 'business_jet',
        categoryConfidence: 'high'
      });
    });

    it('classifies military correctly via heuristics', () => {
      expect(classifyAircraft({ id: 'adf7c8' }, null)).toEqual({
        category: 'military',
        categoryConfidence: 'heuristic'
      });
      expect(classifyAircraft({ id: '111111', callsign: 'RCH123' }, null)).toEqual({
        category: 'military',
        categoryConfidence: 'heuristic'
      });
    });

    it('classifies helicopter correctly via heuristics', () => {
      expect(classifyAircraft({ id: '111', typeCode: 'H47' }, { typeCode: 'H47' })).toEqual({
        category: 'helicopter',
        categoryConfidence: 'heuristic'
      });
      // speed < 120 and altitude < 3000 -> heuristic helicopter (if we choose)
    });

    it('classifies general aviation correctly via heuristics', () => {
      expect(classifyAircraft({ id: '222', callsign: 'N12345' }, null)).toEqual({
        category: 'general_aviation',
        categoryConfidence: 'heuristic'
      });
    });

    it('classifies cargo correctly via heuristics', () => {
      expect(classifyAircraft({ id: '333', callsign: 'UPS99' }, null)).toEqual({
        category: 'cargo',
        categoryConfidence: 'heuristic'
      });
    });

    it('classifies commercial correctly via heuristics', () => {
      expect(classifyAircraft({ id: '444', callsign: 'DAL123' }, null)).toEqual({
        category: 'commercial',
        categoryConfidence: 'heuristic'
      });
      
      expect(classifyAircraft({ id: '555', speed: 350, altitude: 35000 }, null)).toEqual({
        category: 'commercial',
        categoryConfidence: 'heuristic'
      });
    });

    it('falls back to unknown', () => {
      expect(classifyAircraft({ id: 'abcdef', callsign: 'ABC', speed: 150, altitude: 5000 }, null)).toEqual({
        category: 'unknown',
        categoryConfidence: 'heuristic'
      });
    });
  });
});
