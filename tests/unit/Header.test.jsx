// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Header from '../../src/components/ui/Header';
import { useFlightStore } from '../../src/store/flightStore';
import { ViewModeContext } from '../../src/context/ViewModeContext';
import React from 'react';

afterEach(cleanup);

vi.mock('../../src/store/flightStore', () => ({
  useFlightStore: vi.fn(),
}));

// Mock child components that might complain about deep dependencies
vi.mock('../../src/components/ui/StatusIndicator', () => ({ default: () => <div>Status</div> }));
vi.mock('../../src/components/panels/RegionSelector', () => ({ default: () => <div>Region</div> }));
vi.mock('../../src/components/ui/AirspaceToggle', () => ({ default: () => <div>Airspace</div> }));
vi.mock('../../src/components/ui/ExportButton', () => ({ default: () => <button>Export</button> }));
vi.mock('../../src/components/ui/SearchBar', () => ({ default: () => <div>Search</div> }));
vi.mock('../../src/components/ui/FilterChips', () => ({ default: () => <div>FilterChips</div> }));
vi.mock('../../src/components/panels/AdvancedFilterDrawer', () => ({ default: () => <div>Filters</div> }));

beforeEach(() => {
  useFlightStore.mockImplementation((selector) => {
    return selector({
      aircraftArray: [],
      isMuted: false,
      toggleMute: vi.fn(),
      toggleSidebar: vi.fn(),
      toggleScreenshotMode: vi.fn(),
    });
  });
});

const renderWithContext = (ui) => {
  return render(
    <ViewModeContext.Provider value={{ viewMode: 'map', setViewMode: vi.fn() }}>
      {ui}
    </ViewModeContext.Provider>
  );
};

describe('Header Analytics Button', () => {
  it('toggles Analytics panel via onSetPanelMode prop', () => {
    const onSetPanelMode = vi.fn();
    
    // 1. Initial render with panelMode = null
    const { rerender } = renderWithContext(
      <Header panelMode={null} onSetPanelMode={onSetPanelMode} />
    );
    
    // Find button
    const analyticsBtn = screen.getByRole('button', { name: /toggle analytics/i });
    expect(analyticsBtn).toBeDefined();

    // Not active class initially
    expect(analyticsBtn.className).not.toContain('text-atc-green');

    // Click it -> should call onSetPanelMode('analytics')
    fireEvent.click(analyticsBtn);
    expect(onSetPanelMode).toHaveBeenCalledWith('analytics');

    // 2. Rerender with panelMode = 'analytics'
    rerender(
      <ViewModeContext.Provider value={{ viewMode: 'map', setViewMode: vi.fn() }}>
        <Header panelMode="analytics" onSetPanelMode={onSetPanelMode} />
      </ViewModeContext.Provider>
    );

    // Should have active visual state
    expect(analyticsBtn.className).toContain('text-atc-green');

    // Click again -> should call onSetPanelMode(null)
    fireEvent.click(analyticsBtn);
    expect(onSetPanelMode).toHaveBeenCalledWith(null);
  });
});
