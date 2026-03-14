import React, { useState, useEffect } from 'react';

// Isolated component that ticks every second and formats the elapsed time,
// preventing its parent from re-rendering every second.
export default function LiveClock({ lastRefresh, label = 'REF', className = '' }) {
  // eslint-disable-next-line react-hooks/purity
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!lastRefresh) {
    return <span className={className}>No signal</span>;
  }

  const ms = now - lastRefresh;
  const secs = Math.floor(ms / 1000);
  
  if (label === 'relative') {
    return <span className={className}>{secs}s ago</span>;
  }

  return <span className={className}>{label}: {secs}s</span>;
}
