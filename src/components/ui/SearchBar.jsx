import React, { useRef, useEffect, useState } from 'react';
import { useSearchStore } from '../../store/searchStore';
import { Search, X } from 'lucide-react';

export default function SearchBar() {
  const { query, results, isOpen, setQuery, selectResult, clearSearch, setIsOpen } = useSearchStore();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  // Reset selection when query changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(-1);
  }, [query]);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        selectResult(results[selectedIndex]);
      } else if (results.length > 0) {
        selectResult(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-atc-dim">
          <Search className="w-4 h-4" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.trim().length >= 2) setIsOpen(true) }}
          placeholder="Search callsign, ICAO, registry..."
          className="w-full bg-[#1A2235] border border-radar-grid rounded py-1.5 pl-9 pr-8 text-sm text-gray-200 placeholder-slate-500 focus:outline-none focus:border-atc-green transition-colors font-ui"
        />
        {query && (
          <button 
            onClick={clearSearch}
            className="absolute right-3 text-slate-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-10 left-0 w-full bg-[#0A0F1A]/95 backdrop-blur-md border border-radar-grid rounded shadow-xl z-[2000] overflow-hidden flex flex-col max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {results.map((r, index) => (
            <div 
              key={r.aircraft.id} 
              onClick={() => selectResult(r)}
              className={`px-3 py-2 cursor-pointer flex flex-col border-b border-radar-grid last:border-0 ${index === selectedIndex ? 'bg-[#1e2f4a]' : 'hover:bg-[#161F2E]'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-200 font-data text-sm">{r.aircraft.callsign || 'UNKNOWN'}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-atc-dim uppercase tracking-wider">
                  {r.matchedField}
                </span>
              </div>
              <div className="text-xs text-atc-value font-data">
                {r.matchedField === 'callsign' ? r.aircraft.icao24 : r.matchedValue}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute top-10 left-0 w-full bg-[#0A0F1A]/95 backdrop-blur-md border border-radar-grid rounded shadow-xl z-[2000] p-3 text-sm text-atc-dim text-center">
          No matches found
        </div>
      )}
    </div>
  );
}
