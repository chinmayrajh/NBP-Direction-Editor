import React, { useCallback, useRef } from 'react';
import type { CameraStyle } from '../../../ir/types';

type CameraSelectorProps = {
  value: CameraStyle;
  onChange: (style: CameraStyle) => void;
};

const CAMERAS: { id: CameraStyle; name: string; specs: string }[] = [
  { id: 'iphone', name: 'iPhone', specs: '26mm · f/1.8 · Computational' },
  { id: '35mm_street', name: '35mm Street', specs: '35mm · f/2.0 · Kodak Tri-X' },
  { id: '85mm_portrait', name: '85mm Portrait', specs: '85mm · f/1.4 · Shallow DOF' },
  { id: 'retro_ccd', name: 'Retro CCD', specs: '38mm · f/2.8 · CCD Bloom' },
  { id: 'cinema_lens', name: 'Cinema Lens', specs: '50mm · f/1.2 · Anamorphic' },
  { id: 'luxury_editorial', name: 'Luxury Editorial', specs: '105mm · f/2.0 · Medium Format' },
];

const ICONS: Record<CameraStyle, string> = {
  iphone: '📱',
  '35mm_street': '🎞️',
  '85mm_portrait': '📸',
  retro_ccd: '📼',
  cinema_lens: '🎬',
  luxury_editorial: '💎',
};

export function CameraSelector({ value, onChange }: CameraSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (index + 1) % CAMERAS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (index - 1 + CAMERAS.length) % CAMERAS.length;
      }
      if (newIndex !== index) {
        onChange(CAMERAS[newIndex].id);
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
      aria-label="Camera Style"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-2)',
      }}
    >
      {CAMERAS.map((cam, i) => {
        const selected = value === cam.id;
        return (
          <div
            key={cam.id}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(cam.id)}
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
                ? 'rgba(74,125,255,0.08)'
                : 'rgba(255,255,255,0.02)',
              backgroundClip: 'padding-box',
              cursor: 'pointer',
              transition: `all var(--duration-fast) var(--ease-default)`,
              outline: 'none',
              position: 'relative',
              overflow: 'hidden',
              ...(selected
                ? {
                    boxShadow: 'var(--shadow-glow-blue), inset 0 0 0 1px rgba(74,125,255,0.4)',
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
              <span style={{ fontSize: 'var(--text-lg)' }}>{ICONS[cam.id]}</span>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {cam.name}
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
              {cam.specs}
            </span>
          </div>
        );
      })}
    </div>
  );
}
