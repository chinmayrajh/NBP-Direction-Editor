import React, { useCallback, useRef } from 'react';
import type { EditMode } from '../../../ir/types';

type EditModeSelectorProps = {
  value: EditMode;
  onChange: (mode: EditMode) => void;
};

const MODES: { id: EditMode; label: string; icon: string }[] = [
  { id: 'preserve_enhance', label: 'Preserve & Enhance', icon: '✨' },
  { id: 'new_scene', label: 'New Scene', icon: '🎨' },
  { id: 'wardrobe_swap', label: 'Wardrobe Swap', icon: '👗' },
  { id: 'lighting_edit', label: 'Lighting Edit', icon: '💡' },
  { id: 'editorial_upgrade', label: 'Editorial', icon: '📰' },
  { id: 'cinematic_upgrade', label: 'Cinematic', icon: '🎬' },
  { id: 'ugc_realism', label: 'UGC Realism', icon: '📱' },
];

export function EditModeSelector({ value, onChange }: EditModeSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = (index + 1) % MODES.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = (index - 1 + MODES.length) % MODES.length;
      }
      if (newIndex !== index) {
        onChange(MODES[newIndex].id);
        const el = containerRef.current?.children[newIndex] as HTMLElement;
        el?.focus();
      }
    },
    [onChange],
  );

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Edit Mode"
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        overflowX: 'auto',
        paddingBottom: 'var(--space-1)',
        scrollbarWidth: 'none',
      }}
    >
      {MODES.map((mode, i) => {
        const selected = value === mode.id;
        return (
          <button
            key={mode.id}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(mode.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-full)',
              border: selected ? '1px solid var(--border-active)' : '1px solid var(--border-glass)',
              background: selected
                ? 'rgba(74,125,255,0.1)'
                : 'rgba(255,255,255,0.02)',
              color: selected ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: `all var(--duration-fast) var(--ease-default)`,
              outline: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>{mode.icon}</span>
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
