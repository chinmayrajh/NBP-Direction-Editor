import React, { useState, useCallback } from 'react';
import type { PromptModules } from '../../../ir/types';

type ModuleInspectorProps = {
  modules: PromptModules | undefined;
};

type ModuleEntry = {
  icon: string;
  name: string;
  key: keyof PromptModules | 'negativePrompt';
  color: string;
};

const MODULE_ENTRIES: ModuleEntry[] = [
  { icon: '🔒', name: 'Identity Lock', key: 'identityLock', color: 'var(--accent-blue)' },
  { icon: '📷', name: 'Camera System', key: 'cameraSystem', color: 'var(--accent-green)' },
  { icon: '💡', name: 'Lighting System', key: 'lightingSystem', color: 'var(--accent-warm)' },
  { icon: '👗', name: 'Wardrobe Physics', key: 'wardrobePhysics', color: 'var(--accent-purple)' },
  { icon: '🎭', name: 'Pose Choreography', key: 'poseChoreography', color: '#ec4899' },
  { icon: '🌅', name: 'Edge Activity', key: 'edgeActivity', color: '#f97316' },
  { icon: '🌫️', name: 'Atmosphere', key: 'atmosphere', color: '#06b6d4' },
  { icon: '🔬', name: 'Realism Tokens', key: 'realismTokens', color: '#8b5cf6' },
  { icon: '📸', name: 'Imperfection Tokens', key: 'imperfectionTokens', color: '#a3e635' },
  { icon: '🚫', name: 'Negative Prompt', key: 'negativePrompt', color: 'var(--accent-red)' },
];

function getModuleContent(modules: PromptModules, key: string): string {
  if (key === 'negativePrompt') {
    return modules.negativePrompt.join(', ');
  }
  const value = modules[key as keyof Omit<PromptModules, 'negativePrompt'>];
  return typeof value === 'string' ? value : '';
}

function countTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function ModuleInspector({ modules }: ModuleInspectorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (!modules) {
    return (
      <div
        style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
        No modules to inspect
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      {MODULE_ENTRIES.map((entry) => {
        const content = getModuleContent(modules, entry.key);
        // Skip empty modules (e.g. identityLock in Create mode)
        if (!content.trim()) return null;
        const tokens = countTokens(content);
        const isOpen = expanded.has(entry.key);

        return (
          <div
            key={entry.key}
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              overflow: 'hidden',
              borderLeft: `3px solid ${entry.color}`,
              transition: `border-color var(--duration-fast) var(--ease-default)`,
            }}
          >
            {/* Header */}
            <button
              onClick={() => toggle(entry.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span>{entry.icon}</span>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                  }}
                >
                  {entry.name}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0 6px',
                    borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {tokens}t
                </span>
              </div>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: `transform var(--duration-fast) var(--ease-default)`,
                }}
              >
                ▼
              </span>
            </button>

            {/* Content */}
            {isOpen && (
              <div
                style={{
                  padding: '0 var(--space-4) var(--space-3)',
                  animation: 'fade-in 150ms ease-out',
                }}
              >
                <pre
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 'var(--leading-relaxed)',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background: 'rgba(0,0,0,0.2)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    margin: 0,
                    maxHeight: 180,
                    overflow: 'auto',
                  }}
                >
                  {content || '(empty)'}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
