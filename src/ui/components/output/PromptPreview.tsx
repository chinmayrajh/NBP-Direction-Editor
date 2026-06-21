import React, { useState, useCallback } from 'react';
import type { DirectorProject } from '../../../ir/project';

type PromptPreviewProps = {
  project: DirectorProject | null;
};

function highlightPrompt(text: string): React.ReactNode[] {
  // Regex patterns for color groups
  const patterns: { regex: RegExp; color: string }[] = [
    { regex: /\b(preserve|maintain|face_geometry|eye_spacing|jawline|inter-pupillary|nose bridge|lip proportions|facial symmetry|identity|anchor)\b/gi, color: 'var(--accent-blue)' },
    { regex: /\b(shot on|lens|aperture|sensor|f\/[\d.]+|\d+mm|ISO|focal|shutter|bokeh|depth of field|full frame|medium format|CCD|anamorphic)\b/gi, color: 'var(--accent-green)' },
    { regex: /\b(light|shadow|color temperature|sun|flash|golden|warm|rim|fill|ambient|diffused|3200K|5500K|5600K|6500K|highlights?|backlight)\b/gi, color: 'var(--accent-warm)' },
    { regex: /\b(pores?|grain|micro|vellus|sebaceous|imperfection|texture|wrinkle|asymmetry|blemish|dust|noise|bloom)\b/gi, color: 'var(--accent-purple)' },
  ];

  // Simple token-based highlighting
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliest: { index: number; length: number; color: string } | null = null;

    for (const { regex, color } of patterns) {
      regex.lastIndex = 0;
      const match = regex.exec(remaining);
      if (match && (!earliest || match.index < earliest.index)) {
        earliest = { index: match.index, length: match[0].length, color };
      }
    }

    if (!earliest) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (earliest.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>);
    }

    parts.push(
      <span key={key++} style={{ color: earliest.color, fontWeight: 500 }}>
        {remaining.slice(earliest.index, earliest.index + earliest.length)}
      </span>,
    );

    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return parts;
}

function countTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function PromptPreview({ project }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);

  const prompt =
    project?.output?.editablePrompt ??
    project?.aiPipeline?.finalPromptIR?.mergedPrompt ??
    null;

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [prompt]);

  if (!prompt) {
    return (
      <div
        style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
          border: '1px dashed var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)', opacity: 0.4 }}>📝</div>
        <div>Describe a scene to generate a prompt</div>
        <div style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
          The compiled prompt will appear here
        </div>
      </div>
    );
  }

  const tokens = countTokens(prompt);

  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(140,160,255,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
            Compiled Prompt
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-blue)',
              background: 'rgba(74,125,255,0.1)',
              padding: '1px 8px',
              borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {tokens} tokens
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: 'var(--space-1) var(--space-3)',
            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border-glass)'}`,
            borderRadius: 'var(--radius-sm)',
            color: copied ? 'var(--accent-green)' : 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            transition: `all var(--duration-fast) var(--ease-default)`,
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      {/* Prompt body */}
      <div style={{ position: 'relative' }}>
        <pre
          style={{
            padding: 'var(--space-4)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            lineHeight: 'var(--leading-relaxed)',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            maxHeight: 280,
            overflow: 'auto',
          }}
        >
          {highlightPrompt(prompt)}
        </pre>
        {/* Fade-out gradient overlay at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 32,
            background: 'linear-gradient(to bottom, transparent, rgba(10,10,15,0.8))',
            pointerEvents: 'none',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          }}
        />
      </div>
    </div>
  );
}
