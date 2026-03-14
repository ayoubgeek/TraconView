// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnomalyExplanation from '../../src/components/panels/AnomalyExplanation';
import React from 'react';

describe('AnomalyExplanation', () => {
    it('renders all risk factors with label, weight, and timestamp', () => {
        const factors = [
            { id: 'f1', description: 'Squawk 7700', weight: 100, timestamp: '2026-03-14T10:00:00Z', details: 'General Emergency' },
            { id: 'f2', description: 'Altitude Deviation', weight: 20, timestamp: '2026-03-14T10:05:00Z' }
        ];

        render(<AnomalyExplanation factors={factors} />);
        
        // Assert labels
        expect(screen.getByText('Squawk 7700')).not.toBeNull();
        expect(screen.getByText('Altitude Deviation')).not.toBeNull();
        
        // Assert details
        expect(screen.getByText('General Emergency')).not.toBeNull();
        
        // Assert weights
        expect(screen.getByText('+100')).not.toBeNull();
        expect(screen.getByText('+20')).not.toBeNull();
    });

    it('renders resolved state with checkmark and reason', () => {
        render(<AnomalyExplanation 
            factors={[]} 
            resolvedAt="2026-03-14T10:15:00Z" 
            resolutionReason="Aircraft landed" 
        />);
        
        const resolvedContainer = screen.getByText(/Resolved/i).parentElement;
        expect(resolvedContainer.textContent).toContain('Aircraft landed');
    });
});
