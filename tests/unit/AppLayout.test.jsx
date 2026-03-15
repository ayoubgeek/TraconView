// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import AppLayout from '../../src/components/layout/AppLayout';
import { useFlightStore } from '../../src/store/flightStore';
import React from 'react';

afterEach(cleanup);

// Mock flightStore to avoid full Zustand initialization in component
vi.mock('../../src/store/flightStore', () => ({
  useFlightStore: vi.fn()
}));

// Mock child components
vi.mock('../../src/components/ui/Header', () => ({
  default: () => <div data-testid="header">Header</div>
}));

describe('AppLayout', () => {
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

    it('leftPanelMode logic renders the appropriate panels', () => {
        useFlightStore.mockReturnValue(null);
        let externalSetMode = null;

        const MockHeader = (props) => {
            React.useEffect(() => {
                externalSetMode = props.onSetPanelMode;
            }, [props.onSetPanelMode]);
            return <div data-testid="header">Header</div>;
        };

        render(
            <AppLayout 
                header={<MockHeader />} 
                sidebar={<div data-testid="nav-content">Nav</div>} 
                analyticsPanel={<div data-testid="analytics-content">Analytics</div>}
            >
                <div data-testid="main-content">Map</div>
            </AppLayout>
        );

        // 1. Initial state (leftPanelMode = null)
        const leftPanelInitial = screen.queryByTestId('left-panel');
        if (leftPanelInitial) {
            expect(leftPanelInitial.className).toContain('-translate-x-full');
        } else {
            expect(leftPanelInitial).toBeNull();
        }

        // 2. leftPanelMode = 'analytics'
        act(() => {
            externalSetMode('analytics');
        });
        const leftPanelAnalytics = screen.getByTestId('left-panel');
        expect(leftPanelAnalytics.className).not.toContain('-translate-x-full');
        expect(screen.getByTestId('analytics-content')).toBeTruthy();
        expect(screen.queryByTestId('nav-content')).toBeNull();

        // 3. leftPanelMode = 'navigation'
        act(() => {
            externalSetMode('navigation');
        });
        const leftPanelNavigation = screen.getByTestId('left-panel');
        expect(leftPanelNavigation.className).not.toContain('-translate-x-full');
        expect(screen.getByTestId('nav-content')).toBeTruthy();
        expect(screen.queryByTestId('analytics-content')).toBeNull();

        // 4. toggling back to null -> panel disappears
        act(() => {
            externalSetMode(null);
        });
        const leftPanelClosed = screen.queryByTestId('left-panel');
        if (leftPanelClosed) {
            expect(leftPanelClosed.className).toContain('-translate-x-full');
        }
    });
});

