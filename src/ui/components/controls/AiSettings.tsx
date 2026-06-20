import React, { useState } from 'react';
import { ApiKeySettings } from './ApiKeySettings';

type AiAvailability = {
  builtinAi: boolean;
  geminiApi: boolean;
  anyAvailable: boolean;
};

type AiSettingsProps = {
  aiAvailable: AiAvailability;
  onKeyChange?: (configured: boolean) => void;
};

export function AiSettings({ aiAvailable, onKeyChange }: AiSettingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Built-in AI is available — best case
  if (aiAvailable.builtinAi) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16,185,129,0.25)',
            background: 'rgba(16,185,129,0.1)',
            color: 'var(--accent-green)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          ✅ Built-in AI ready
        </div>

        {/* Optional: expand to configure API key for cloud model */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span
            style={{
              fontSize: '0.5rem',
              display: 'inline-block',
              transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform var(--duration-fast) var(--ease-default)',
            }}
          >
            ▶
          </span>
          Use Gemini API for higher quality
        </button>

        {showAdvanced && (
          <div style={{ animation: 'fade-in var(--duration-fast) var(--ease-default)' }}>
            <ApiKeySettings onKeyChange={onKeyChange ?? (() => {})} />
          </div>
        )}
      </div>
    );
  }

  // API key is configured but no built-in AI
  if (aiAvailable.geminiApi) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(16,185,129,0.25)',
          background: 'rgba(16,185,129,0.1)',
          color: 'var(--accent-green)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
        }}
      >
        🔑 API Key configured
      </div>
    );
  }

  // Neither available — show expandable API key input
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)',
          background: 'rgba(255,255,255,0.03)',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
        }}
      >
        ⚡ Using fast compile
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: 0,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-xs)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span
          style={{
            fontSize: '0.5rem',
            display: 'inline-block',
            transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform var(--duration-fast) var(--ease-default)',
          }}
        >
          ▶
        </span>
        Add API key for AI mode
      </button>

      {showAdvanced && (
        <div style={{ animation: 'fade-in var(--duration-fast) var(--ease-default)' }}>
          <ApiKeySettings onKeyChange={onKeyChange ?? (() => {})} />
        </div>
      )}
    </div>
  );
}
