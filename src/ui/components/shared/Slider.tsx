import React, { useRef, useCallback } from 'react';

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  labels?: string[];
  label?: string;
};

export function Slider({ value, onChange, min, max, labels, label }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const steps = max - min;
  const fraction = (value - min) / steps;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (value < max) onChange(value + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (value > min) onChange(value - 1);
      }
    },
    [value, min, max, onChange],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const newValue = Math.round(x * steps + min);
      onChange(Math.max(min, Math.min(max, newValue)));
    },
    [min, max, steps, onChange],
  );

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-2)',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          {label}
        </div>
      )}

      {/* Value badge */}
      <div
        style={{
          position: 'relative',
          height: 24,
          marginBottom: 'var(--space-1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${fraction * 100}%`,
            transform: 'translateX(-50%)',
            background: 'var(--accent-gradient)',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-bold)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label ?? 'Slider'}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          height: 6,
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.08)',
          cursor: 'pointer',
        }}
      >
        {/* Fill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${fraction * 100}%`,
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-gradient)',
            transition: `width var(--duration-fast) var(--ease-default)`,
          }}
        />
        {/* Thumb */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${fraction * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: 'var(--shadow-glow-blue), 0 2px 6px rgba(0,0,0,0.4)',
            transition: `left var(--duration-fast) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default)`,
            border: '2px solid var(--accent-blue)',
          }}
        />
        {/* Stop dots */}
        {Array.from({ length: steps + 1 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: `${(i / steps) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: i <= value - min ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      {/* Labels */}
      {labels && labels.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'var(--space-2)',
          }}
        >
          {labels.map((l, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.625rem',
                color: i === value - min ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: i === value - min ? 'var(--weight-medium)' : 'var(--weight-normal)',
                textAlign: 'center',
                flex: 1,
                transition: `color var(--duration-fast) var(--ease-default)`,
                userSelect: 'none',
              }}
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
