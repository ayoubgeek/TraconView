// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnomalyExplanation from '../../src/components/panels/AnomalyExplanation';
import React from 'react';

describe('AnomalyExplanation', () => {
    it('renders all risk factors with label, weight, and timestamp', () => {
        const explanation = {
            factors: [
                { id: 'f1', description: 'Squawk 7700', weight: 100, timestamp: '2026-03-14T10:00:00Z', details: 'General Emergency' },
                { id: 'f2', description: 'Altitude Deviation', weight: 20, timestamp: '2026-03-14T10:05:00Z' }
            ],
            firstDetectedAt: '2026-03-14T10:00:00Z',
            resolvedAt: null,
            resolutionReason: null
        };

        render(<AnomalyExplanation explanation={explanation} threshold="CRITICAL" />);
        
        // Assert labels
        expect(screen.getByText('Squawk 7700')).not.toBeNull();
        expect(screen.getByText('Altitude Deviation')).not.toBeNull();
        
        // Assert details
        expect(screen.getByText('General Emergency')).not.toBeNull();
        
        // Assert weights
        expect(screen.getByText('+100')).not.toBeNull();
        expect(screen.getByText('+20')).not.toBeNull();
        
        // Assert severity badge
        expect(screen.getByText('CRITICAL')).not.toBeNull();
    });

    it('renders resolved state with checkmark and reason', () => {
        const explanation = {
            factors: [],
            resolvedAt: '2026-03-14T10:15:00Z',
            resolutionReason: 'Aircraft landed'
        };

        render(<AnomalyExplanation explanation={explanation} threshold="NORMAL" />);
        
        const resolvedContainer = screen.getByText(/Resolved/i).parentElement;
        expect(resolvedContainer.textContent).toContain('Aircraft landed');
    });
});
