import React, { useState, useEffect } from 'react';
import { getApiKey, saveApiKey, clearApiKey, isApiKeyConfigured } from '../../../ai/shot-planner';

type ApiKeySettingsProps = {
  onKeyChange: (configured: boolean) => void;
};

export function ApiKeySettings({ onKeyChange }: ApiKeySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyValue, setKeyValue] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const configured = isApiKeyConfigured();
    setHasKey(configured);
    if (configured) {
      const key = getApiKey();
      if (key) setKeyValue('•'.repeat(Math.min(key.length, 30)));
    }
  }, []);

  const handleSave = () => {
    if (keyValue && !keyValue.startsWith('•')) {
      saveApiKey(keyValue);
      setHasKey(true);
      setKeyValue('•'.repeat(Math.min(keyValue.length, 30)));
      onKeyChange(true);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setKeyValue('');
    setHasKey(false);
    onKeyChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)',
          background: hasKey
            ? 'rgba(16, 185, 129, 0.1)'
            : 'rgba(245, 158, 11, 0.1)',
          color: hasKey
            ? 'var(--accent-green)'
            : 'var(--accent-warm)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s ease',
        }}
      >
        {hasKey ? '🔑' : '⚙️'}
        <span>{hasKey ? 'API Key Configured' : 'Add Gemini API Key'}</span>
      </button>
    );
  }

  return (
    <div
      style={{
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--glass-border)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-2)',
          fontWeight: 'var(--weight-semibold)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        🔑 Gemini API Key
      </div>

      <input
        type="password"
        value={keyValue.startsWith('•') ? '' : keyValue}
        onChange={(e) => setKeyValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={hasKey ? 'Key saved • paste new to replace' : 'Paste your API key here'}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--glass-border)',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'monospace',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        autoFocus
      />

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-2)',
        }}
      >
        <button
          onClick={handleSave}
          disabled={!keyValue || keyValue.startsWith('•')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: keyValue && !keyValue.startsWith('•')
              ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
              : 'var(--glass-border)',
            color: 'white',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            cursor: keyValue && !keyValue.startsWith('•') ? 'pointer' : 'not-allowed',
            opacity: keyValue && !keyValue.startsWith('•') ? 1 : 0.5,
          }}
        >
          Save
        </button>

        {hasKey && (
          <button
            onClick={handleClear}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.1)',
              color: 'var(--accent-red)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}

        <button
          onClick={() => setIsOpen(false)}
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--glass-border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      <a
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          marginTop: 'var(--space-2)',
          fontSize: 'var(--text-xs)',
          color: 'var(--accent-blue)',
          textDecoration: 'none',
          opacity: 0.8,
        }}
      >
        Get a free key →
      </a>
    </div>
  );
}
