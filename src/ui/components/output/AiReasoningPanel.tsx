import React, { useState } from 'react';

type AiReasoningPanelProps = {
  reasoning: string | undefined;
  source: 'ai' | 'deterministic' | undefined;
  validationIssues?: { module: string; message: string; autoFixed: boolean }[];
};

export function AiReasoningPanel({ reasoning, source, validationIssues }: AiReasoningPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (source !== 'ai' || reasoning === undefined) return null;

  const summary = reasoning.length > 100
    ? reasoning.slice(0, 100).trimEnd() + '…'
    : reasoning;

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(139,92,246,0.2)',
        background: 'rgba(139,92,246,0.06)',
        overflow: 'hidden',
        transition: 'all var(--duration-fast) var(--ease-default)',
      }}
    >
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="ai-reasoning-content"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          textAlign: 'left',
          outline: 'none',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-purple)',
            transition: 'transform var(--duration-fast) var(--ease-default)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▶
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--accent-purple)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          AI Reasoning
        </span>
        {!expanded && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            — {summary}
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          id="ai-reasoning-content"
          style={{
            padding: '0 var(--space-4) var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            animation: 'fade-in var(--duration-fast) var(--ease-default)',
          }}
        >
          {/* Reasoning text */}
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {reasoning}
          </p>

          {/* Validation issues */}
          {validationIssues && validationIssues.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
                borderTop: '1px solid rgba(139,92,246,0.15)',
                paddingTop: 'var(--space-3)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Validation Issues
              </span>
              {validationIssues.map((issue, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    background: issue.autoFixed
                      ? 'rgba(16,185,129,0.06)'
                      : 'rgba(245,158,11,0.06)',
                  }}
                >
                  <span style={{ fontSize: '0.625rem' }}>
                    {issue.autoFixed ? '✓' : '⚠'}
                  </span>
                  <span
                    style={{
                      fontWeight: 'var(--weight-medium)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {issue.module}
                  </span>
                  <span>{issue.message}</span>
                  {issue.autoFixed && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--accent-green)',
                        fontWeight: 'var(--weight-medium)',
                      }}
                    >
                      auto-fixed
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
