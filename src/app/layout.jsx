import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-radar-bg text-atc-green font-ui overflow-hidden flex flex-col relative content-box p-4" >
      {children}
      <footer className="absolute bottom-2 right-4 text-[11px] text-atc-dim font-ui z-[1000] pointer-events-none opacity-50">
        For informational purposes only. Not for operational use.
      </footer>
    </div>
  );
}
