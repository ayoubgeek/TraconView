import React from 'react';
import { useSavedViewStore } from '../../store/savedViewStore';
import { useFlightStore } from '../../store/flightStore';
import { Lock, Edit2, Trash2, Folder, Save, MapPin } from 'lucide-react';

export default function SavedViewPanel() {
  const views = useSavedViewStore(state => state.views);
  const createView = useSavedViewStore(state => state.createView);
  const renameView = useSavedViewStore(state => state.renameView);
  const deleteView = useSavedViewStore(state => state.deleteView);
  const loadView = useSavedViewStore(state => state.loadView);

  const presets = views.filter(v => v.isReadOnly);
  const myViews = views.filter(v => !v.isReadOnly);

  const handleSaveCurrent = () => {
    const name = window.prompt('Enter name for saved view:');
    if (!name || name.trim() === '') return;

    // Capture current state needed for a view
    const state = useFlightStore.getState();
    const viewState = {
      region: state.selectedRegion,
      filters: state.filters,
      airspaceToggles: state.airspaceToggles
    };

    createView(name.trim(), viewState);
  };

  const handleLoad = (id) => {
    const viewState = loadView(id);
    if (!viewState) return;

    // Apply state to flightStore
    useFlightStore.setState((state) => {
      // Create new state object merging current state with loaded viewState
      // Need to run filters again with new filter params
      const newState = { ...state };
      
      if (viewState.region) newState.selectedRegion = viewState.region;
      if (viewState.filters) newState.filters = viewState.filters;
      if (viewState.airspaceToggles) newState.airspaceToggles = viewState.airspaceToggles;

      // Re-apply filters immediately so aircraftArray updates correctly
      // For simplicity, we just set the new filters. The store's setFilters handles the actual application usually, 
      // but since we are replacing the whole block, we'll let the standard setFilters handle it, or we do it manually.
      // Better to call the store's setAction or use setState and rely on components reacting.
      // Actually, useFlightStore setFilters doesn't take region.
      // We can just set the raw state here and rely on the next poll to fully synchronize, 
      // OR we just use `useFlightStore.getState().setFilters`
      
      return newState;
    });

    // explicitly call setFilters to ensure filteredAircraft is regenerated
    if (viewState.filters) {
       useFlightStore.getState().setFilters(viewState.filters);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this view?')) {
      deleteView(id);
    }
  };

  const handleRename = (e, id, currentName) => {
    e.stopPropagation();
    const newName = window.prompt('Enter new name:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
      renameView(id, newName.trim());
    }
  };

  const ViewItem = ({ view }) => (
    <div 
      className="group flex flex-col p-3 border-b border-[#1A2235]/50 hover:bg-[#1A2235]/40 transition-colors cursor-pointer"
      onClick={() => handleLoad(view.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {view.isReadOnly ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <MapPin className="w-3.5 h-3.5 text-atc-green" />}
          <span className="text-sm font-bold text-slate-200 tracking-wide">{view.name}</span>
        </div>
        
        {!view.isReadOnly && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => handleRename(e, view.id, view.name)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Rename View"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => handleDelete(e, view.id)}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Delete View"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-1 flex flex-wrap gap-1">
        {view.state.filters?.categories?.length > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-black/30 px-1 py-0.5 rounded border border-[#1A2235]">Cat Filters</span>
        )}
        {view.state.filters?.squawkCodes?.length > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400/80 bg-orange-400/10 px-1 py-0.5 rounded border border-orange-400/20">Squawk Filters</span>
        )}
        {view.state.filters?.altitudeBand && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400/80 bg-blue-400/10 px-1 py-0.5 rounded border border-blue-400/20">Alt Band</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full font-ui border-b border-[#1A2235] bg-[#0A0F1A]">
      <div className="px-4 py-2 bg-[#050A15]/50 border-b border-[#1A2235] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-3.5 h-3.5 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saved Views</h3>
        </div>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[300px]">
        {presets.length > 0 && (
          <div className="mb-2">
            <div className="px-4 py-1.5 bg-[#1A2235]/30 border-y border-[#1A2235]/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Presets
            </div>
            {presets.map(view => <ViewItem key={view.id} view={view} />)}
          </div>
        )}
        
        {myViews.length > 0 && (
           <div className="mb-2">
             <div className="px-4 py-1.5 bg-[#1A2235]/30 border-y border-[#1A2235]/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
               My Views
             </div>
             {myViews.map(view => <ViewItem key={view.id} view={view} />)}
           </div>
        )}
      </div>

      <div className="p-3 bg-[#0A0F1A] border-t border-[#1A2235] sticky bottom-0">
        <button 
          onClick={handleSaveCurrent}
          className="w-full flex items-center justify-center gap-2 py-2 bg-atc-green/10 hover:bg-atc-green/20 text-atc-green border border-atc-green/30 rounded transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <Save className="w-3.5 h-3.5" />
          Save Current View
        </button>
      </div>
    </div>
  );
}
