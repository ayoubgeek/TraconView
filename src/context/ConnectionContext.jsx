/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const defaultStatus = {
  mode: 'live', // 'live' | 'stale' | 'offline' | 'rate-limited'
  authMode: 'anonymous', // 'authenticated' | 'anonymous'
  creditsRemaining: -1,
  lastRefreshAt: null,
  retryAfterMs: null
};

export const ConnectionContext = createContext({
  status: defaultStatus,
  updateStatus: () => {}
});

export function ConnectionProvider({ children }) {
  const [status, setStatus] = useState(defaultStatus);

  const updateStatus = useCallback((patch) => {
    setStatus(prev => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(() => ({
    status,
    updateStatus
  }), [status, updateStatus]);

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnectionStatus() {
  return useContext(ConnectionContext);
}
