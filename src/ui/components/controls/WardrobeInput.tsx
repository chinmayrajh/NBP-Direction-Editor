import React from 'react';

type WardrobeInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function WardrobeInput({ value, onChange }: WardrobeInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="e.g., tailored navy blazer, silk blouse"
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        color: 'var(--text-primary)',
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-sans)',
        transition: `border-color var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default)`,
        outline: 'none',
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
  );
}
