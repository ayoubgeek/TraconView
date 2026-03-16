/**
 * @file StatusBadge.jsx
 * @description Floating badge displaying connection mode and API limits.
 */

import React from 'react';
import { useConnectionStatus } from '../../context/ConnectionContext';
import { Wifi, WifiOff, AlertTriangle, User, UserX } from 'lucide-react';
import './StatusBadge.css';

export default function StatusBadge({ onSettingsClick }) {
  const { status } = useConnectionStatus();
  
  const isAnonymous = status.authMode === 'anonymous';
  const isErrorOrRateLimited = status.mode === 'offline' || status.mode === 'rate-limited';

  const formatCredits = () => {
    if (status.creditsRemaining === -1) return '';
    return ` / ${status.creditsRemaining} credits`;
  };

  const getStatusText = () => {
    switch (status.mode) {
      case 'live': return 'Live';
      case 'stale': return 'Stale';
      case 'offline': return 'Offline';
      case 'rate-limited': return 'Rate Limited';
      default: return 'Waiting...';
    }
  };

  return (
    <div className={`status-badge-container mode-${status.mode}`} onClick={onSettingsClick} tabIndex={0} role="button">
      <div className="status-indicator">
        {status.mode === 'live' && <Wifi size={14} />}
        {status.mode === 'stale' && <AlertTriangle size={14} />}
        {isErrorOrRateLimited && <WifiOff size={14} />}
      </div>
      
      <div className="status-text">
        <span className="status-primary">{getStatusText()}</span>
        <span className="status-secondary">
          {isAnonymous ? <UserX size={10} /> : <User size={10} />}
          {isAnonymous ? ' Anon' : ' Auth'}
          {formatCredits()}
        </span>
      </div>
    </div>
  );
}
