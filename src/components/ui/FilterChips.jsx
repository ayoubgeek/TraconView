import React from 'react';
import { useFlightStore } from '../../store/flightStore';
import { AIRCRAFT_CATEGORY_COLORS } from '../../lib/constants';
import { Settings2, X } from 'lucide-react';

const CATEGORIES = [
  'commercial', 'military', 'emergency/anomaly', 'cargo',
  'business_jet', 'helicopter', 'general_aviation', 'unknown'
];

export default function FilterChips({ onToggleAdvanced, isAdvancedOpen }) {
  const filters = useFlightStore(state => state.filters);
  const setFilters = useFlightStore(state => state.setFilters);
  const clearFilters = useFlightStore(state => state.clearFilters);
  
  const activeCategories = filters.categories || [];
  
  const toggleCategory = (cat) => {
    let newCats;
    if (activeCategories.includes(cat)) {
      newCats = activeCategories.filter(c => c !== cat);
    } else {
      newCats = [...activeCategories, cat];
    }
    setFilters({ categories: newCats });
  };
  
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden pointer-events-auto w-full max-w-[800px]">
      {CATEGORIES.map(cat => {
        const isActive = activeCategories.includes(cat);
        const color = AIRCRAFT_CATEGORY_COLORS[cat] || '#808080';
        
        // Format label nicely
        let label = cat.replace(/_/g, ' ').toUpperCase();
        if (cat === 'emergency/anomaly') label = 'EXCEPTION';
        
        return (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border shadow-sm ${
              isActive 
                ? 'bg-opacity-20 border-opacity-50 text-white shadow-inner' 
                : 'bg-[#1A2235]/90 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-[#1f2940]'
            }`}
            style={isActive ? { backgroundColor: `${color}33`, borderColor: color } : {}}
            title={`Toggle ${label}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </button>
        );
      })}
      
      <div className="w-px h-6 bg-slate-700 mx-1 flex-shrink-0" />
      
      <button 
        onClick={clearFilters}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1A2235]/90 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors whitespace-nowrap flex-shrink-0 shadow-sm"
        title="Clear all filters"
      >
        <X className="w-3 h-3" /> CLEAR ALL
      </button>
      
      <button 
        onClick={onToggleAdvanced}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 shadow-sm border ${
          isAdvancedOpen 
             ? 'bg-atc-green/20 border-atc-green text-white'
             : 'bg-atc-green/10 border-atc-green/30 text-atc-green hover:bg-atc-green/20'
        }`}
      >
        <Settings2 className="w-3 h-3" /> ADVANCED {isAdvancedOpen ? '▲' : '▼'}
      </button>
    </div>
  );
}
