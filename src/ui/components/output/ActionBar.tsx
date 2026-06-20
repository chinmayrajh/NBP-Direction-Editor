import React, { useState, useCallback, useEffect } from 'react';

type ActionBarProps = {
  prompt: string;
  onRetryCompile?: () => void;
};

export function ActionBar({ prompt }: ActionBarProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [insertStatus, setInsertStatus] = useState<'idle' | 'inserted' | 'error'>('idle');
  const [isGeminiTab, setIsGeminiTab] = useState<boolean | null>(null);

  const isExtension = typeof chrome !== 'undefined' && !!chrome?.runtime?.sendMessage;

  // Check if on Gemini tab
  useEffect(() => {
    if (!isExtension) return;
    try {
      chrome.runtime.sendMessage({ type: 'IS_GEMINI_TAB' }, (response) => {
        setIsGeminiTab(response?.isGemini ?? false);
      });
    } catch {
      setIsGeminiTab(false);
    }
  }, [isExtension]);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [prompt]);

  const handleInsert = useCallback(() => {
    if (!prompt || !isExtension) return;
    try {
      chrome.runtime.sendMessage({ type: 'INSERT_PROMPT', prompt }, (response) => {
        if (response?.success) {
          setInsertStatus('inserted');
          setTimeout(() => setInsertStatus('idle'), 2000);
        } else {
          setInsertStatus('error');
          setTimeout(() => setInsertStatus('idle'), 3000);
        }
      });
    } catch {
      setInsertStatus('error');
      setTimeout(() => setInsertStatus('idle'), 3000);
    }
  }, [prompt, isExtension]);

  const insertDisabled = isGeminiTab === false;

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        padding: 'var(--space-3)',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Copy button */}
      <button
        onClick={handleCopy}
        disabled={!prompt}
        style={{
          flex: isExtension ? 2 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${copyStatus === 'copied' ? 'rgba(16,185,129,0.3)' : 'var(--border-glass)'}`,
          background: copyStatus === 'copied' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
          color: copyStatus === 'copied' ? 'var(--accent-green)' : 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-semibold)',
          fontFamily: 'var(--font-sans)',
          cursor: prompt ? 'pointer' : 'not-allowed',
          transition: 'all var(--duration-fast) var(--ease-default)',
          opacity: prompt ? 1 : 0.5,
        }}
        onMouseOver={(e) => {
          if (prompt && copyStatus !== 'copied') {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)';
          }
        }}
        onMouseOut={(e) => {
          if (copyStatus !== 'copied') {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-glass)';
          }
        }}
      >
        {copyStatus === 'copied' ? '✓ Copied' : '📋 Copy'}
      </button>

      {/* Insert button — only in extension context */}
      {isExtension && (
        <button
          onClick={handleInsert}
          disabled={!prompt || insertDisabled}
          title={insertDisabled ? 'Navigate to Gemini first' : undefined}
          style={{
            flex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-1)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${
              insertStatus === 'inserted'
                ? 'rgba(16,185,129,0.3)'
                : insertStatus === 'error'
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(74,125,255,0.3)'
            }`,
            background:
              insertStatus === 'inserted'
                ? 'rgba(16,185,129,0.15)'
                : insertStatus === 'error'
                  ? 'rgba(239,68,68,0.1)'
                  : 'rgba(74,125,255,0.1)',
            color:
              insertStatus === 'inserted'
                ? 'var(--accent-green)'
                : insertStatus === 'error'
                  ? 'var(--accent-red)'
                  : 'var(--accent-blue)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)',
            fontFamily: 'var(--font-sans)',
            cursor: prompt && !insertDisabled ? 'pointer' : 'not-allowed',
            transition: 'all var(--duration-fast) var(--ease-default)',
            opacity: prompt && !insertDisabled ? 1 : 0.5,
          }}
          onMouseOver={(e) => {
            if (prompt && !insertDisabled && insertStatus === 'idle') {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,125,255,0.18)';
            }
          }}
          onMouseOut={(e) => {
            if (insertStatus === 'idle') {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,125,255,0.1)';
            }
          }}
        >
          {insertStatus === 'inserted'
            ? '✓ Inserted'
            : insertStatus === 'error'
              ? '❌ Couldn\'t insert — try Copy'
              : insertDisabled
                ? 'Open Gemini first'
                : '📥 Insert into Gemini'}
        </button>
      )}
    </div>
  );
}
