import React from 'react';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OutputPanel } from './components/layout/OutputPanel';
import { useDirectorState } from './hooks/useDirectorState';
import { useCompiler } from './hooks/useCompiler';

export function App() {
  const { state, dispatch } = useDirectorState();
  const { compile } = useCompiler(state, dispatch);

  const isCompleted = state.project?.generationState?.status === 'completed';

  return (
    <ErrorBoundary>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
        }}
      >
        <Header isCompiling={state.isCompiling} isCompleted={isCompleted ?? false} />
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <Sidebar
            state={state}
            dispatch={dispatch}
            onCompile={compile}
            isCompiling={state.isCompiling}
          />
          <OutputPanel
            project={state.project}
            isCompiling={state.isCompiling}
            error={state.error}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
