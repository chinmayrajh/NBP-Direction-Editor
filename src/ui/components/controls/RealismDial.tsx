import React from 'react';
import { Slider } from '../shared/Slider';

type RealismDialProps = {
  value: number;
  onChange: (level: number) => void;
};

export function RealismDial({ value, onChange }: RealismDialProps) {
  return (
    <Slider
      value={value}
      onChange={onChange}
      min={1}
      max={5}
      label="Realism Level"
      labels={['Stylized', 'Clean', 'Realistic', 'Documentary', 'Forensic']}
    />
  );
}
