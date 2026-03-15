// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import AppLayout from '../../src/components/layout/AppLayout';
import { useFlightStore } from '../../src/store/flightStore';
import React from 'react';

afterEach(cleanup);

// Mock flightStore
vi.mock('../../src/store/flightStore', () => ({
  useFlightStore: vi.fn()
}));

describe('Panel Coexistence', () => {
  it('allows left panel and right drawer to render simultaneously', () => {
    // Setup store to have an aircraft selected (Drawer open)
    useFlightStore.mockImplementation((selector) => {
      // Return '123' for selectedAircraftId to trigger right drawer
      return selector({ selectedAircraftId: '123' });
    });

    // We pass a dummy header that will toggle leftPanelMode to 'analytics'
    const DummyHeader = ({ onSetPanelMode }) => (
      <button 
        data-testid="toggle-analytics" 
        onClick={() => onSetPanelMode('analytics')}
      >
        Toggle
      </button>
    );

    render(
      <AppLayout 
        header={<DummyHeader />}
        analyticsPanel={<div data-testid="analytics-content">Analytics</div>}
        rightDrawer={<div data-testid="detail-drawer">Detail</div>}
      >
        <div data-testid="main-content">Map</div>
      </AppLayout>
    );

    // Click toggle to open analytics
    act(() => {
      screen.getByTestId('toggle-analytics').click();
    });

    // Verify left panel is open
    const leftPanel = screen.getByTestId('left-panel');
    expect(leftPanel.className).toContain('translate-x-0');

    // Verify right drawer is open
    const rightDrawer = screen.getByTestId('right-drawer');
    expect(rightDrawer.className).not.toContain('translate-x-full');

    // Both panel contents should be visible
    expect(screen.getByTestId('analytics-content')).toBeDefined();
    expect(screen.getByTestId('detail-drawer')).toBeDefined();
  });
});
