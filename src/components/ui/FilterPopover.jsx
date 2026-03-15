import React, { useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';

export default function FilterPopover({ isOpen, onToggle, onClose, activeCount, children }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    const handleClickOutside = (e) => {
      // Ignore clicks on the trigger button since the onClick handler will fire onToggle
      if (popoverRef.current && !popoverRef.current.contains(e.target) && isOpen) {
        // slight hack: check if the click target is a toggle button somewhere else, 
        // normally we just check ref containment
        onClose();
      }
    };

    // Use capturing phase for mousedown to avoid issues with elements removing themselves from DOM
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative pointer-events-auto" ref={popoverRef}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm font-bold border ${
          isOpen || activeCount > 0
            ? 'bg-atc-green/20 border-atc-green text-white shadow-[0_0_10px_rgba(0,255,204,0.2)]' 
            : 'bg-radar-bg/80 border-radar-grid text-slate-400 hover:text-white hover:bg-[#1A2235]'
        }`}
      >
        <Filter className={`w-4 h-4 ${activeCount > 0 ? 'text-atc-green' : ''}`} />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 bg-atc-green text-[#050A15] px-1.5 py-0.5 rounded-full text-[10px] min-w-[18px] text-center font-data">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          data-testid="filter-popover-body"
          className="absolute top-full left-0 mt-2 p-3 bg-[#0A0F1A]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-[150] min-w-max transform transition-transform duration-300 ease-in-out"
        >
          {children}
        </div>
      )}
    </div>
  );
}
