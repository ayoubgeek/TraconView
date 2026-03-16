/**
 * @file SettingsDrawer.jsx
 * @description Dropdown to configure OpenSky API credentials.
 */

import React, { useState, useEffect } from 'react';
import { useCredentials } from '../../hooks/useCredentials';
import { Settings, X, Save, Trash2 } from 'lucide-react';
import './SettingsDrawer.css';

export default function SettingsDrawer({ isOpen, onClose }) {
  const { credentials, saveCredentials, clearCredentials } = useCredentials();
  
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClientId(credentials?.clientId || '');
      setClientSecret(credentials?.clientSecret || '');
    }
  }, [isOpen, credentials]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (clientId && clientSecret) {
      saveCredentials({ clientId, clientSecret });
      onClose();
    }
  };

  const handleClear = () => {
    clearCredentials();
    setClientId('');
    setClientSecret('');
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-drawer animate-slide-down" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">
            <Settings size={20} />
            <h2>Settings</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          <p className="settings-desc">
            Provide your OpenSky Network credentials to access live data with higher rate limits.
            Credentials are saved locally in your browser.
          </p>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="clientId">Client ID (Username)</label>
              <input
                id="clientId"
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="e.g. your_username"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="clientSecret">Client Secret (Password)</label>
              <input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="settings-actions">
              <button type="submit" className="btn btn-primary" disabled={!clientId || !clientSecret}>
                <Save size={16} /> Save
              </button>
              <button type="button" className="btn btn-danger" onClick={handleClear} disabled={!credentials}>
                <Trash2 size={16} /> Clear Setup
              </button>
            </div>
          </form>

          <div className="settings-footer">
            <a href="https://opensky-network.org/profile" target="_blank" rel="noreferrer">
              Create an OpenSky Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
