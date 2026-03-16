/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import FlightPanel from '../../src/components/FlightPanel/FlightPanel';
import { useSelection } from '../../src/context/SelectionContext';
import { useAircraftById } from '../../src/context/AircraftDataContext';

vi.mock('../../src/context/SelectionContext', () => ({
  useSelection: vi.fn()
}));

vi.mock('../../src/context/AircraftDataContext', () => ({
  useAircraftById: vi.fn()
}));

vi.mock('../../src/hooks/useAircraftEnrichment', () => ({
  useAircraftEnrichment: vi.fn()
}));

import { useAircraftEnrichment } from '../../src/hooks/useAircraftEnrichment';

describe('FlightPanel', () => {
  const mockClearSelection = vi.fn();

  beforeEach(() => {
    mockClearSelection.mockClear();
    useSelection.mockReturnValue({
      selectedAircraftId: 'a1b2c3',
      clearSelection: mockClearSelection
    });
    useAircraftEnrichment.mockReturnValue({
      photo: null,
      route: null,
      isLoadingPhoto: false,
      isLoadingRoute: false
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders nothing when no aircraft is selected', () => {
    useSelection.mockReturnValue({ selectedAircraftId: null, clearSelection: mockClearSelection });
    useAircraftById.mockReturnValue(null);
    const { container } = render(<FlightPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all standard fields and large callsign', () => {
    const mockAc = {
      icao24: 'a1b2c3',
      callsign: 'UAL123',
      altitudeFt: 35000,
      speedKnots: 450,
      heading: 270,
      vertRateFpm: 0,
      squawk: '1234',
      positionSource: 'ADS-B',
      onGround: false,
      originCountry: 'United States',
      lastContact: Math.round(Date.now() / 1000) - 5
    };
    useAircraftById.mockReturnValue(mockAc);

    render(<FlightPanel />);

    // Callsign
    expect(screen.getByText('UAL123')).toBeDefined();
    
    // Formatted fields
    expect(screen.getByText('35,000 ft')).toBeDefined();
    expect(screen.getByText('450 kt')).toBeDefined();
    expect(screen.getByText('270°')).toBeDefined();
    expect(screen.getByText('0 fpm')).toBeDefined();
    expect(screen.getByText('1234')).toBeDefined();
    expect(screen.getByText('ADS-B')).toBeDefined();
    expect(screen.getByText('Airborne')).toBeDefined();
    expect(screen.getByText('United States')).toBeDefined();

    // No route section should be present
    expect(screen.queryByText('Route')).toBeNull();
  });

  it('renders route section when available', () => {
    const mockAc = {
      icao24: 'a1',
      callsign: 'SWA1',
      lastContact: Math.round(Date.now() / 1000)
    };
    useAircraftById.mockReturnValue(mockAc);
    useAircraftEnrichment.mockReturnValue({
      photo: null,
      route: { origin: 'SFO', destination: 'LAX' },
      isLoadingPhoto: false,
      isLoadingRoute: false
    });

    render(<FlightPanel />);
    expect(screen.getByText('SFO')).toBeDefined();
    expect(screen.getByText('LAX')).toBeDefined();
    expect(screen.getByText('Origin')).toBeDefined();
    expect(screen.getByText('Destination')).toBeDefined();
  });

  it('renders null fields as "—"', () => {
    useAircraftById.mockReturnValue({ icao24: 'a1' }); // all other fields undefined

    render(<FlightPanel />);
    
    // There are multiple "—" rendered, let's just assert that it renders
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('calls clearSelection when close button clicked', () => {
    useAircraftById.mockReturnValue({ icao24: 'a1', callsign: 'ABC' });
    render(<FlightPanel />);
    
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(mockClearSelection).toHaveBeenCalled();
  });
});
