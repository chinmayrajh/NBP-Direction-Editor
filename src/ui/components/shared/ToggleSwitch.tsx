import React, { useCallback } from 'react';

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export function ToggleSwitch({ checked, onChange, label, disabled = false }: ToggleSwitchProps) {
  const handleClick = useCallback(() => {
    if (!disabled) onChange(!checked);
  }, [checked, disabled, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onChange(!checked);
      }
    },
    [checked, disabled, onChange],
  );

  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        userSelect: 'none',
        padding: 'var(--space-2) 0',
      }}
    >
      {/* Track */}
      <div
        style={{
          position: 'relative',
          width: 40,
          height: 22,
          borderRadius: 'var(--radius-full)',
          background: checked
            ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
            : 'rgba(255,255,255,0.1)',
          transition: `background var(--duration-fast) var(--ease-default)`,
          boxShadow: checked ? 'var(--shadow-glow-blue)' : 'none',
          flexShrink: 0,
        }}
      >
        {/* Thumb */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: `left var(--duration-fast) var(--ease-default)`,
          }}
        />
      </div>

      {/* Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          fontSize: 'var(--text-sm)',
          color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: 'var(--weight-medium)',
          transition: `color var(--duration-fast) var(--ease-default)`,
        }}
      >
        <span style={{ fontSize: '0.75rem' }}>{checked ? '🔒' : '🔓'}</span>
        {label}
      </div>
    </div>
  );
}
