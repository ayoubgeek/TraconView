import React from 'react';
import AppLayout from './components/layout/AppLayout';
import TraconMap from './components/map/TraconMap';
import StatsPanel from './components/panels/StatsPanel';

// Placeholders for panels that will be built in later phases
const SavedViewPanelPlaceholder = () => (
  <div className="p-4 border border-dashed border-slate-700 m-4 rounded text-center text-slate-500 text-sm">
    Saved Views (Phase 11)
  </div>
);

const DetailDrawerPlaceholder = () => (
  <div className="p-4 border border-dashed border-slate-700 m-4 h-[calc(100%-2rem)] rounded text-center text-slate-500 text-sm flex items-center justify-center">
    Detail Panel (Phase 9)
  </div>
);

function App() {
  return (
    <AppLayout
      sidebar={
        <div className="flex flex-col h-full bg-[#0A0F1A]">
          <SavedViewPanelPlaceholder />
          {/* StatsPanel is pinned to the bottom of the sidebar */}
          <div className="mt-auto border-t border-slate-800 bg-[#0A0F1A]">
             <StatsPanel />
          </div>
        </div>
      }
      rightDrawer={<DetailDrawerPlaceholder />}
    >
      <TraconMap />
    </AppLayout>
  );
}

export default App;
