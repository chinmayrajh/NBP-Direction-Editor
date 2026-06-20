import React from 'react';
import { Slider } from '../shared/Slider';

type ImperfectionDialProps = {
  value: number;
  onChange: (level: number) => void;
};

export function ImperfectionDial({ value, onChange }: ImperfectionDialProps) {
  return (
    <Slider
      value={value}
      onChange={onChange}
      min={1}
      max={5}
      label="Imperfection Level"
      labels={['Polished', 'Subtle', 'Natural', 'Gritty', 'Raw']}
    />
  );
}
