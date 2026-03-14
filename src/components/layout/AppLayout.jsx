import React from 'react';

export default function AppLayout({ header, sidebar, rightDrawer, children, isRightDrawerOpen }) {
  // Placeholder structure, full logic applied in Phase 7 (T038)
  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Bar Slot */}
      <header className="h-14 border-b border-slate-700 bg-slate-800 z-50 flex-none relative">
        {header}
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Sidebar Slot */}
        <aside className="w-80 flex-none bg-slate-800 border-r border-slate-700 z-40 relative">
          {sidebar}
        </aside>

        {/* Center Area Slot (Map or Table) */}
        <main className="flex-1 relative z-10 w-full h-full">
          {children}
        </main>

        {/* Right Drawer Slot */}
        <aside 
          className={`absolute right-0 top-0 bottom-0 bg-slate-800 border-l border-slate-700 shadow-2xl z-40 w-96 transform transition-transform duration-300 ${
            isRightDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {rightDrawer}
        </aside>
      </div>
    </div>
  );
}
