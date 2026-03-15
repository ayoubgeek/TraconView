// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

const mockStorage = new Map();
global.localStorage = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, val),
    clear: () => mockStorage.clear()
};

import { useSavedViewStore } from '../../src/store/savedViewStore';

describe('useSavedViewStore', () => {
    beforeEach(() => {
        // Reset localStorage and store state before each test
        localStorage.clear();
        useSavedViewStore.setState({ views: [] });
    });

    it('createView returns view with correct fields', () => {
        const mockState = {
            region: { key: 'TEST', bounds: { south: 10, west: 20, north: 30, east: 40 }, zoom: 5 },
            filters: { category: ['military'] },
            airspaceToggles: { CTR: true }
        };

        const viewId = useSavedViewStore.getState().createView('Test View', mockState);
        const { views } = useSavedViewStore.getState();
        
        expect(views.length).toBe(1);
        const newView = views[0];
        
        expect(newView.id).toBe(viewId);
        expect(newView.name).toBe('Test View');
        expect(newView.isReadOnly).toBe(false);
        expect(newView.state.region).toEqual(mockState.region);
        expect(newView.state.filters).toEqual(mockState.filters);
        expect(newView.state.airspaceToggles).toEqual(mockState.airspaceToggles);
        expect(newView.createdAt).toBeDefined();
    });

    it('renameView updates the name of a user-created view', () => {
        const viewId = useSavedViewStore.getState().createView('Old Name', {});
        useSavedViewStore.getState().renameView(viewId, 'New Name');
        
        const { views } = useSavedViewStore.getState();
        expect(views[0].name).toBe('New Name');
    });

    it('deleteView removes a user-created view', () => {
        const viewId = useSavedViewStore.getState().createView('Delete Me', {});
        expect(useSavedViewStore.getState().views.length).toBe(1);
        
        useSavedViewStore.getState().deleteView(viewId);
        expect(useSavedViewStore.getState().views.length).toBe(0);
    });

    it('does not allow renaming read-only preset views', () => {
        // Inject a read-only preset manually for testing
        useSavedViewStore.setState({
            views: [{ id: 'preset-1', name: 'Preset', isReadOnly: true, state: {} }]
        });

        useSavedViewStore.getState().renameView('preset-1', 'Hacked');
        const { views } = useSavedViewStore.getState();
        expect(views[0].name).toBe('Preset'); // Unchanged
    });

    it('does not allow deleting read-only preset views', () => {
        useSavedViewStore.setState({
            views: [{ id: 'preset-1', name: 'Preset', isReadOnly: true, state: {} }]
        });

        useSavedViewStore.getState().deleteView('preset-1');
        const { views } = useSavedViewStore.getState();
        expect(views.length).toBe(1); // Not deleted
    });

    it('loadView returns the correct state payload', () => {
        const mockState = { filters: { test: true } };
        useSavedViewStore.setState({
            views: [{ id: 'target-view', name: 'Target', isReadOnly: true, state: mockState }]
        });

        const loadedState = useSavedViewStore.getState().loadView('target-view');
        expect(loadedState).toEqual(mockState);
    });
});
