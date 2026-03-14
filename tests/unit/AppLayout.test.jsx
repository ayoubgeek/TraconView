// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppLayout from '../../src/components/layout/AppLayout';
import { useFlightStore } from '../../src/store/flightStore';
import React from 'react';

// Mock flightStore to avoid full Zustand initialization in component
vi.mock('../../src/store/flightStore', () => ({
  useFlightStore: vi.fn()
}));

// Mock child components
vi.mock('../../src/components/ui/Header', () => ({
  default: () => <div data-testid="header">Header</div>
}));

describe('AppLayout', () => {
    it('sidebar collapse state toggles correctly', () => {
        // Return null for selectedAircraftId to prevent drawer opening
        useFlightStore.mockReturnValue(null);

        render(<AppLayout>
            <div data-testid="main-content">Map</div>
        </AppLayout>);
        
        // Find hamburger toggle button by aria-label
        const toggleBtn = screen.getAllByRole('button', { name: /toggle sidebar/i })[0];
        
        // Initial state should be open based on specs (or test logic)
        const sidebar = screen.getByTestId('left-sidebar');
        expect(sidebar.className).not.toContain('-translate-x-full'); // Assuming standard Tailwind class for hiding
        
        // Toggle once to close
        fireEvent.click(toggleBtn);
        expect(sidebar.className).toContain('-translate-x-full'); // Or appropriate closed state class
        
        // Toggle again to open
        fireEvent.click(toggleBtn);
        expect(sidebar.className).not.toContain('-translate-x-full');
    });

    it('right drawer evaluates selectedAircraftId visibility', () => {
        const { rerender } = render(<AppLayout>
            <div data-testid="main-content">Map</div>
        </AppLayout>);
        
        // With selectedAircraftId = null, drawer is hidden
        useFlightStore.mockReturnValue(null);
        rerender(<AppLayout><div data-testid="main-content">Map</div></AppLayout>);
        const drawerNull = screen.getAllByTestId('right-drawer')[0];
        expect(drawerNull.className).toContain('translate-x-full'); // Hidden off-screen right
        
        // With selectedAircraftId = '123', drawer is visible
        useFlightStore.mockReturnValue('123');
        rerender(<AppLayout><div data-testid="main-content">Map</div></AppLayout>);
        // Since rerender appends in this vitest setup, we get the last one
        const drawers = screen.getAllByTestId('right-drawer');
        const drawerActive = drawers[drawers.length - 1];
        expect(drawerActive.className).not.toContain('translate-x-full');
    });
});
