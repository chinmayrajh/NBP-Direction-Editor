import React from 'react';
import type { LockedElements as LockedElementsType } from '../../../ir/types';
import { ToggleSwitch } from '../shared/ToggleSwitch';

type LockedElementsProps = {
  value: LockedElementsType;
  onChange: (key: keyof LockedElementsType) => void;
};

const ELEMENTS: { key: keyof LockedElementsType; label: string }[] = [
  { key: 'face', label: 'Face' },
  { key: 'hair', label: 'Hair' },
  { key: 'pose', label: 'Pose' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'outfit', label: 'Outfit' },
  { key: 'environment', label: 'Environment' },
];

export function LockedElementsPanel({ value, onChange }: LockedElementsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-1) var(--space-4)',
      }}
    >
      {ELEMENTS.map((el) => (
        <ToggleSwitch
          key={el.key}
          checked={value[el.key]}
          onChange={() => onChange(el.key)}
          label={el.label}
        />
      ))}
    </div>
  );
}
