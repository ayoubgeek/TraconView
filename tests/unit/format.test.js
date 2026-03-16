import { describe, it, expect } from 'vitest';
import {
  formatAltitude,
  formatSpeed,
  formatHeading,
  formatVertRate,
  formatSquawk,
  formatLastContact,
  formatPositionSource
} from '../../src/utils/format';

describe('Data Formatting', () => {
  it('formatAltitude', () => {
    expect(formatAltitude(null)).toBe('—');
    expect(formatAltitude(35000)).toBe('35,000 ft');
  });

  it('formatSpeed', () => {
    expect(formatSpeed(null)).toBe('—');
    expect(formatSpeed(450)).toBe('450 kt');
  });

  it('formatHeading', () => {
    expect(formatHeading(null)).toBe('—');
    expect(formatHeading(270)).toBe('270°');
  });

  it('formatVertRate', () => {
    expect(formatVertRate(500)).toBe('+500 fpm');
    expect(formatVertRate(-800)).toBe('-800 fpm');
    expect(formatVertRate(0)).toBe('0 fpm');
    expect(formatVertRate(null)).toBe('—');
  });

  it('formatSquawk', () => {
    expect(formatSquawk(null)).toBe('—');
    expect(formatSquawk('7700')).toBe('7700');
  });

  it('formatLastContact', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatLastContact(null)).toBe('—');
    expect(formatLastContact(now)).toMatch(/second/);
  });

  it('formatPositionSource', () => {
    expect(formatPositionSource('ADS-B')).toBe('ADS-B');
    expect(formatPositionSource(null)).toBe('—');
  });
});
