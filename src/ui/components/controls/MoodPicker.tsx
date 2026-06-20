import React, { useCallback, useRef } from 'react';
import type { Mood } from '../../../ir/types';

type MoodPickerProps = {
  value: Mood;
  onChange: (mood: Mood) => void;
};

const MOODS: { id: Mood; icon: string; label: string }[] = [
  { id: 'detached', icon: '😐', label: 'Detached' },
  { id: 'confident', icon: '💪', label: 'Confident' },
  { id: 'romantic', icon: '💕', label: 'Romantic' },
  { id: 'calm', icon: '🧘', label: 'Calm' },
  { id: 'playful', icon: '🎉', label: 'Playful' },
];

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = (index + 1) % MOODS.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = (index - 1 + MOODS.length) % MOODS.length;
      }
      if (newIndex !== index) {
        onChange(MOODS[newIndex].id);
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
      aria-label="Mood"
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
      }}
    >
      {MOODS.map((mood, i) => {
        const selected = value === mood.id;
        return (
          <button
            key={mood.id}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(mood.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-full)',
              border: selected ? 'none' : '1px solid var(--border-glass)',
              background: selected
                ? 'var(--accent-gradient)'
                : 'rgba(255,255,255,0.03)',
              color: selected ? '#fff' : 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: `all var(--duration-fast) var(--ease-default)`,
              outline: 'none',
              boxShadow: selected ? 'var(--shadow-glow-purple)' : 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>{mood.icon}</span>
            {mood.label}
          </button>
        );
      })}
    </div>
  );
}
