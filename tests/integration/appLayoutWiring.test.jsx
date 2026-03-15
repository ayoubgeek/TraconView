// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import Page from '../../src/app/page';
import { useFlightStore } from '../../src/store/flightStore';
import React from 'react';

afterEach(cleanup);

// Mock the core hooks that do polling/fetching
vi.mock('../../src/hooks/useOpenSky', () => ({
  useOpenSky: vi.fn()
}));
vi.mock('../../src/hooks/useAnomalyEngine', () => ({
  useAnomalyEngine: vi.fn()
}));

// Mock Header
vi.mock('../../src/components/ui/Header', () => ({
  default: () => <div data-testid="header">Header</div>
}));

// Mock Heavy Panels and Map
vi.mock('../../src/components/map/TraconMap', () => ({ default: () => <div data-testid="map-stub">Map</div> }));
vi.mock('../../src/components/panels/AircraftDetail', () => ({ default: () => <div /> }));
vi.mock('../../src/components/panels/AlertSidebar', () => ({ default: () => <div /> }));
vi.mock('../../src/components/panels/StatsPanel', () => ({ default: () => <div /> }));
vi.mock('../../src/components/panels/SituationReport', () => ({ default: () => <div /> }));
vi.mock('../../src/components/panels/MoroccoPanel', () => ({ default: () => <div /> }));
vi.mock('../../src/components/panels/AircraftDetailDrawer', () => ({ default: () => <div /> }));
vi.mock('../../src/components/panels/SavedViewPanel', () => ({ default: () => <div /> }));
vi.mock('../../src/components/ui/PinnedFlightsList', () => ({ default: () => <div /> }));

// We do NOT mock AppLayout because we want to test if Page actually uses it and wires it correctly
// We just mount Page and assert on the DOM.

describe('appLayoutWiring', () => {
  it('renders Map-first with no left panel visible by default', () => {
    // Reset Zustand store state for test
    useFlightStore.setState({ 
      selectedAircraftId: null,
      aircraftArray: [],
      connectionStatus: 'LIVE'
    });

    render(<Page />);

    // 1. Verify AppLayout handles the rendering by checking for specific elements
    // left-panel should be absent or offscreen
    const leftPanel = screen.queryByTestId('left-panel');
    if (leftPanel) {
      expect(leftPanel.className).toContain('-translate-x-full');
    } else {
      expect(leftPanel).toBeNull();
    }

    // 2. right-drawer should be offscreen (no aircraft selected)
    // Wait, since Page hasn't been refactored yet, AppLayout might not even be in the DOM!
    // We expect this test to fail initially (RED) because Page uses an ad-hoc layout.
    const rightDrawer = screen.queryByTestId('right-drawer');
    if (rightDrawer) {
        expect(rightDrawer.className).toContain('translate-x-full');
    } else {
        // Explicitly assert it fails if AppLayout is missing, but vitest matching usually does:
        expect(rightDrawer).not.toBeNull(); 
    }
  });

  it('verifies right drawer appears when aircraft is selected', () => {
    useFlightStore.setState({ 
      selectedAircraftId: null,
      aircraftArray: [],
      connectionStatus: 'LIVE'
    });

    render(<Page />);

    // Select aircraft
    act(() => {
      useFlightStore.setState({ selectedAircraftId: '123456' });
    });

    const rightDrawer = screen.queryByTestId('right-drawer');
    expect(rightDrawer).not.toBeNull();
    expect(rightDrawer.className).not.toContain('translate-x-full');
  });
});

