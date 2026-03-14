import { describe, it, expect } from 'vitest';
import { isMilitaryByCallsign } from '../../src/lib/militaryCallsigns';
import { isMilitaryByHex } from '../../src/lib/militaryHexRanges';

describe('militaryDetection', () => {
  describe('isMilitaryByCallsign', () => {
    it('detects US military callsigns', () => {
      const usPrefixes = ['RCH123', 'CNV456', 'EVAC7', 'SPAR99', 'JAKE1', 'VALOR2', 'PAT3', 'NAVY4', 'COAST6'];
      usPrefixes.forEach(callsign => {
        expect(isMilitaryByCallsign(callsign)).toBe(true);
      });
    });

    it('detects NATO and international military callsigns', () => {
      const natoPrefixes = ['GAF01', 'RRR99', 'CTM11', 'IAM2', 'AME33', 'LION44', 'BAF5', 'NATO66'];
      natoPrefixes.forEach(callsign => {
        expect(isMilitaryByCallsign(callsign)).toBe(true);
      });
    });

    it('rejects commercial and generic callsigns', () => {
      const nonMilitary = ['DAL123', 'UAL456', 'AFR789', 'N12345', ''];
      nonMilitary.forEach(callsign => {
        expect(isMilitaryByCallsign(callsign)).toBe(false);
      });
    });
  });

  describe('isMilitaryByHex', () => {
    it('detects US military hex ranges (ADF7C8 - AFFFFF)', () => {
      expect(isMilitaryByHex('adf7c8')).toBe(true);
      expect(isMilitaryByHex('adfcba')).toBe(true);
      expect(isMilitaryByHex('afffff')).toBe(true);
    });

    it('detects UK military hex ranges (43C000 - 43CFFF)', () => {
      expect(isMilitaryByHex('43c000')).toBe(true);
      expect(isMilitaryByHex('43c8aa')).toBe(true);
      expect(isMilitaryByHex('43cfff')).toBe(true);
    });

    it('detects DE military hex ranges (3E8000 - 3EFFFF)', () => {
      expect(isMilitaryByHex('3e8000')).toBe(true);
      expect(isMilitaryByHex('3e9xyz')).toBe(false); // Invalid hex but conceptually out of range or NaN
      expect(isMilitaryByHex('3eab12')).toBe(true);
      expect(isMilitaryByHex('3effff')).toBe(true);
    });

    it('detects FR military hex ranges (3A0000 - 3A7FFF)', () => {
      expect(isMilitaryByHex('3a0000')).toBe(true);
      expect(isMilitaryByHex('3a4b21')).toBe(true);
      expect(isMilitaryByHex('3a7fff')).toBe(true);
      expect(isMilitaryByHex('3a8000')).toBe(false); // Out of range
    });

    it('detects CH military hex ranges (4B7000 - 4B7FFF)', () => {
      expect(isMilitaryByHex('4b7000')).toBe(true);
      expect(isMilitaryByHex('4b75a1')).toBe(true);
      expect(isMilitaryByHex('4b7fff')).toBe(true);
    });

    it('detects DK military hex ranges (477000 - 477FFF)', () => {
      expect(isMilitaryByHex('477000')).toBe(true);
      expect(isMilitaryByHex('4775a1')).toBe(true);
      expect(isMilitaryByHex('477fff')).toBe(true);
    });

    it('rejects general non-military hexes', () => {
      expect(isMilitaryByHex('a1234b')).toBe(false);
      expect(isMilitaryByHex('c0ffee')).toBe(false);
      expect(isMilitaryByHex('000000')).toBe(false);
      expect(isMilitaryByHex('')).toBe(false);
    });
  });
});
