import { create } from 'zustand';
import { BUILT_IN_PRESETS } from '../lib/constants';

const getStorage = () => {
    try {
        if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
            return window.localStorage;
        }
    } catch {
        // Ignore
    }
    return null;
};

export const useSavedViewStore = create((set, get) => {
    // Merge localStorage views with presets on init
    const storage = getStorage();
    const storedViews = storage ? storage.getItem('traconview:savedViews') : null;
    let initialViews = BUILT_IN_PRESETS;
    
    if (storedViews) {
        try {
            const parsedViews = JSON.parse(storedViews);
            // Append user views after presets
            initialViews = [...BUILT_IN_PRESETS, ...parsedViews];
        } catch (e) {
            console.error('Failed to parse saved views from localStorage', e);
        }
    }

    const persistViews = (newViews) => {
        const storage = getStorage();
        if (storage) {
            // Only persist user-created views to localStorage
            const userViews = newViews.filter(v => !v.isReadOnly);
            storage.setItem('traconview:savedViews', JSON.stringify(userViews));
        }
    };

    return {
        views: initialViews,

        createView: (name, currentState) => {
            const id = crypto.randomUUID();
            const newView = {
                id,
                name,
                isReadOnly: false,
                state: JSON.parse(JSON.stringify(currentState)), // Deep copy state
                createdAt: new Date().toISOString()
            };

            set((state) => {
                const newViews = [...state.views, newView];
                persistViews(newViews);
                return { views: newViews };
            });

            return id;
        },

        renameView: (id, newName) => {
            set((state) => {
                const newViews = state.views.map(view => {
                    if (view.id === id && !view.isReadOnly) {
                        return { ...view, name: newName };
                    }
                    return view;
                });
                persistViews(newViews);
                return { views: newViews };
            });
        },

        deleteView: (id) => {
            set((state) => {
                const viewToDelete = state.views.find(v => v.id === id);
                if (viewToDelete && viewToDelete.isReadOnly) {
                    return state; // No-op for read-only
                }

                const newViews = state.views.filter(v => v.id !== id);
                persistViews(newViews);
                return { views: newViews };
            });
        },

        loadView: (id) => {
            const view = get().views.find(v => v.id === id);
            return view ? view.state : null;
        },

        getPresets: () => {
            return BUILT_IN_PRESETS;
        }
    };
});
