import React from 'react';
import { createRoot } from 'react-dom/client';
import { ExtensionApp } from './components/layout/ExtensionApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ExtensionApp />
  </React.StrictMode>,
);
