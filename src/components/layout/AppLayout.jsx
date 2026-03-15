import React, { useState } from 'react';
import Header from '../ui/Header';
import { useFlightStore } from '../../store/flightStore';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import ErrorBoundary from '../ui/ErrorBoundary';
import { ViewModeContext } from '../../context/ViewModeContext';

export default function AppLayout({ header, sidebar, rightDrawer, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);

  const topBar = header || <Header />;

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      <div className="flex flex-col h-screen w-full bg-[#050A15] text-slate-100 overflow-hidden font-ui">
      {/* Top Bar Slot */}
      <header className="h-16 border-b border-slate-800 bg-[#0A0F1A] z-[100] flex-none relative">
        {topBar}
        
        {/* Mobile Sidebar Toggle - visible only on small screens */}
        <button 
          aria-label="Toggle Sidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden absolute top-3 left-4 z-[1001] bg-[#1A2235]/90 border border-slate-700 p-2 rounded text-slate-300"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Sidebar Slot */}
        <aside 
          data-testid="left-sidebar"
          className={`
            absolute md:relative h-full flex-none bg-[#0A0F1A]/95 md:bg-[#0A0F1A] backdrop-blur-md md:backdrop-blur-none 
            border-r border-slate-800 z-40 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80 md:w-0'}
          `}
        >
          <div className="w-80 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {/* Wrap sidebar contents in ErrorBoundary per T067 */}
            <ErrorBoundary fallback={<div className="p-2 text-atc-dim">Sidebar unavailable</div>}>
              {sidebar}
            </ErrorBoundary>
          </div>
        </aside>

        {/* Desktop Sidebar Toggle Button */}
        <button
          aria-label="Toggle Sidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`
            hidden md:flex absolute z-50 top-1/2 -translate-y-1/2 
            bg-[#1A2235] border border-slate-700 border-l-0 rounded-r-md 
            w-5 h-12 items-center justify-center 
            text-slate-400 hover:text-white transition-all duration-300
            ${isSidebarOpen ? 'left-80' : 'left-0'}
          `}
        >
          {isSidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Center Area Slot (Map or Table) */}
        {/* Map intentionally NOT wrapped in ErrorBoundary per T068 */}
        <main className="flex-1 relative z-10 w-full h-full bg-slate-900 overflow-hidden" data-testid="main-content">
          {children}
        </main>

        {/* Right Drawer Slot */}
        <aside 
          data-testid="right-drawer"
          className={`
            absolute right-0 top-0 bottom-0 bg-[#0A0F1A]/95 backdrop-blur-md border-l border-slate-800 shadow-2xl z-50 
            w-full sm:w-96 transform transition-transform duration-300 ease-in-out
            ${selectedAircraftId ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {/* Wrap Detail Drawer in ErrorBoundary per T066 */}
          <ErrorBoundary fallback={<div className="p-4 text-atc-dim">Detail panel unavailable</div>}>
            {rightDrawer}
          </ErrorBoundary>
        </aside>
      </div>
    </div>
    </ViewModeContext.Provider>
  );
}
