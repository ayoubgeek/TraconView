import React, { Suspense, lazy } from 'react';
import AppLayout from './components/layout/AppLayout';
import TraconMap from './components/map/TraconMap';
import ErrorBoundary from './components/ui/ErrorBoundary';

const StatsPanel = lazy(() => import('./components/panels/StatsPanel'));
const SavedViewPanel = lazy(() => import('./components/panels/SavedViewPanel'));
const AircraftDetailDrawer = lazy(() => import('./components/panels/AircraftDetailDrawer'));

const PanelSkeleton = () => (
  <div className="p-4 m-4 rounded animate-pulse bg-slate-800/20 md:bg-[#1A2235]/50 h-32 flex items-center justify-center text-slate-500 text-sm border border-slate-700/50">
    Loading...
  </div>
);

const PinnedFlightsList = lazy(() => import('./components/panels/PinnedFlightsList'));

function App() {
  return (
    <AppLayout
      sidebar={
        <div className="flex flex-col h-full bg-[#0A0F1A]">
          <Suspense fallback={<PanelSkeleton />}>
            <PinnedFlightsList />
          </Suspense>
          <Suspense fallback={<PanelSkeleton />}>
            <SavedViewPanel />
          </Suspense>
          {/* StatsPanel is pinned to the bottom of the sidebar */}
          <div className="mt-auto border-t border-slate-800 bg-[#0A0F1A]">
            <ErrorBoundary fallback={<div className="p-4 text-atc-dim">Stats unavailable</div>}>
              <Suspense fallback={<PanelSkeleton />}>
                 <StatsPanel />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      }
      rightDrawer={
        <Suspense fallback={<div className="h-full flex flex-col"><PanelSkeleton /></div>}>
          <AircraftDetailDrawer />
        </Suspense>
      }
    >
      <TraconMap />
    </AppLayout>
  );
}

export default App;
