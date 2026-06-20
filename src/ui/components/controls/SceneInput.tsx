import React from 'react';

type SceneInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SceneInput({ value, onChange }: SceneInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your scene... e.g., woman standing in a Tokyo café during rain"
        rows={4}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          paddingBottom: 'var(--space-6)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-md)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--leading-relaxed)',
          resize: 'vertical',
          transition: `border-color var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default)`,
          outline: 'none',
          minHeight: 120,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--border-active)';
          e.target.style.boxShadow = '0 0 0 3px rgba(74,125,255,0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-glass)';
          e.target.style.boxShadow = 'none';
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 10,
          right: 14,
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'none',
        }}
      >
        {value.length}
      </span>
    </div>
  );
}
