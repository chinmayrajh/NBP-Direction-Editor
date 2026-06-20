import React, { useEffect } from 'react';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OutputPanel } from './components/layout/OutputPanel';
import { useDirectorState } from './hooks/useDirectorState';
import { useCompiler } from './hooks/useCompiler';
import { isApiKeyConfigured } from '../ai/shot-planner';

export function App() {
  const { state, dispatch } = useDirectorState();
  const { compile } = useCompiler(state, dispatch);

  // Check for API key on mount
  useEffect(() => {
    dispatch({ type: 'SET_API_KEY_CONFIGURED', payload: isApiKeyConfigured() });
  }, [dispatch]);

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
        <Header
          isCompiling={state.isCompiling}
          isCompleted={isCompleted ?? false}
          compileProgress={state.compileProgress}
        />
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
            compileMode={state.compileMode}
            onCompileModeChange={(mode) => dispatch({ type: 'SET_COMPILE_MODE', payload: mode })}
            compileProgress={state.compileProgress}
            apiKeyConfigured={state.apiKeyConfigured}
          />
          <OutputPanel
            project={state.project}
            isCompiling={state.isCompiling}
            error={state.error}
            aiError={state.aiError}
            compileMode={state.compileMode}
            onRetryAi={compile}
          />
        </div>

        {/* Aria-live region for screen readers — announces async compilation status */}
        <div
          aria-live="polite"
          role="status"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            border: 0,
          }}
        >
          {state.isCompiling
            ? state.compileProgress?.message ?? 'Compiling prompt…'
            : state.project
              ? 'Compilation complete'
              : ''}
        </div>
      </div>
    </ErrorBoundary>
  );
}
