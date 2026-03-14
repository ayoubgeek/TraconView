// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { updateMarkersImperatively } from '../../src/lib/aircraftDiff';

// Mock Leaflet Marker
class MockMarker {
  constructor(latlng, options) {
    this.latlng = latlng;
    this.options = options;
    this.setLatLng = vi.fn();
    this.setIcon = vi.fn();
    this.setZIndexOffset = vi.fn();
    this.bindTooltip = vi.fn();
    this.on = vi.fn();
  }
}

describe('aircraftDiff', () => {
    it('handles adding, updating, and removing markers', () => {
        const markerMap = new Map();
        const clusterGroup = { addLayer: vi.fn(), removeLayer: vi.fn(), addLayers: vi.fn(), removeLayers: vi.fn() };
        const createIcon = vi.fn((ac) => `icon-${ac.category}-${ac.heading}`);
        
        // Initial state
        const markerA = new MockMarker([10, 10], { icon: 'icon-military-45' });
        const acDataA = { lat: 10, lng: 10, heading: 45, category: 'military', isStale: false, isSelected: false };
        
        const markerB = new MockMarker([20, 20], { icon: 'icon-commercial-90' });
        const acDataB = { lat: 20, lng: 20, heading: 90, category: 'commercial', isStale: false, isSelected: false };
        
        markerMap.set('A', { main: markerA, anomaly: null, acData: acDataA });
        markerMap.set('B', { main: markerB, anomaly: null, acData: acDataB });
        
        // New state: Aircraft A (moved), Aircraft C (new), Aircraft B (gone)
        const newAircraft = [
            { id: 'A', lat: 15, lng: 15, heading: 45, category: 'military' },
            { id: 'C', lat: 30, lng: 30, heading: 180, category: 'cargo' }
        ];
        
        updateMarkersImperatively(markerMap, newAircraft, clusterGroup, createIcon, {});
        
        // B should be removed
        expect(markerMap.has('B')).toBe(false);
        expect(clusterGroup.removeLayers).toHaveBeenCalled();
        
        // C should be added
        expect(markerMap.has('C')).toBe(true);
        expect(clusterGroup.addLayers).toHaveBeenCalled();
        
        // A should be updated
        expect(markerMap.has('A')).toBe(true);
        expect(markerMap.get('A').main.setLatLng).toHaveBeenCalledWith([15, 15]);
        // A didn't change icon properties, so setIcon shouldn't be called
        expect(markerMap.get('A').main.setIcon).not.toHaveBeenCalled();
    });

    it('does not call setLatLng for unchanged aircraft', () => {
        const markerMap = new Map();
        const clusterGroup = { addLayer: vi.fn(), removeLayer: vi.fn(), addLayers: vi.fn(), removeLayers: vi.fn() };
        const createIcon = vi.fn(() => `icon`);
        
        const markerA = new MockMarker([10, 10], { icon: 'icon' });
        const acDataA = { lat: 10, lng: 10, heading: 90, category: 'military', isStale: false, isSelected: false };
        markerMap.set('A', { main: markerA, anomaly: null, acData: acDataA });
        
        const newAircraft = [
            { id: 'A', lat: 10, lng: 10, heading: 90, category: 'military', isStale: false }
        ];
        
        updateMarkersImperatively(markerMap, newAircraft, clusterGroup, createIcon, {});
        
        expect(markerA.setLatLng).not.toHaveBeenCalled();
    });
});
