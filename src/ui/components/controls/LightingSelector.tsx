import React, { useCallback, useRef } from 'react';
import type { LightingStyle } from '../../../ir/types';

type LightingSelectorProps = {
  value: LightingStyle;
  onChange: (style: LightingStyle) => void;
};

const LIGHTING: { id: LightingStyle; name: string; specs: string; tempPos: number }[] = [
  { id: 'golden_hour', name: 'Golden Hour', specs: '3200K · Warm · Low Angle', tempPos: 0.15 },
  { id: 'direct_flash', name: 'Direct Flash', specs: '5500K · Hard · On-Camera', tempPos: 0.55 },
  { id: 'window_light', name: 'Window Light', specs: '5600K · Soft · Diffused', tempPos: 0.58 },
  { id: 'neon_night', name: 'Neon Night', specs: 'Mixed · Colored · Urban', tempPos: 0.5 },
  { id: 'studio', name: 'Studio', specs: '5500K · Controlled · Beauty Dish', tempPos: 0.55 },
  { id: 'overcast', name: 'Overcast', specs: '6500K · Flat · Even', tempPos: 0.75 },
];

const ICONS: Record<LightingStyle, string> = {
  golden_hour: '🌅',
  direct_flash: '⚡',
  window_light: '🪟',
  neon_night: '🌃',
  studio: '💡',
  overcast: '☁️',
};

export function LightingSelector({ value, onChange }: LightingSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (index + 1) % LIGHTING.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (index - 1 + LIGHTING.length) % LIGHTING.length;
      }
      if (newIndex !== index) {
        onChange(LIGHTING[newIndex].id);
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
      aria-label="Lighting Style"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-2)',
      }}
    >
      {LIGHTING.map((light, i) => {
        const selected = value === light.id;
        return (
          <div
            key={light.id}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(light.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: selected
                ? '1px solid transparent'
                : '1px solid var(--border-glass)',
              background: selected
                ? 'rgba(245,158,11,0.06)'
                : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: `all var(--duration-fast) var(--ease-default)`,
              outline: 'none',
              ...(selected
                ? {
                    boxShadow: '0 0 20px rgba(245,158,11,0.15), inset 0 0 0 1px rgba(245,158,11,0.35)',
                  }
                : {}),
            }}
            onMouseOver={(e) => {
              if (!selected) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
              }
            }}
            onMouseOut={(e) => {
              if (!selected) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-glass)';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-lg)' }}>{ICONS[light.id]}</span>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {light.name}
              </span>
            </div>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                paddingLeft: 'calc(var(--text-lg) + var(--space-2))',
              }}
            >
              {light.specs}
            </span>
            {/* Color temperature bar */}
            <div
              style={{
                height: 3,
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fef3c7, #93c5fd, #60a5fa)',
                marginTop: 'var(--space-1)',
                position: 'relative',
                opacity: selected ? 1 : 0.4,
                transition: `opacity var(--duration-fast) var(--ease-default)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${light.tempPos * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '1.5px solid rgba(0,0,0,0.3)',
                  boxShadow: '0 0 4px rgba(255,255,255,0.5)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
