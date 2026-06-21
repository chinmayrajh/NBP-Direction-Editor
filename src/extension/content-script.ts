/**
 * @module extension/content-script
 * @description Content script injected into Gemini and AI Studio pages.
 *
 * Multi-strategy prompt injection:
 * 1. ARIA selectors (most resilient against DOM changes)
 * 2. Generic contenteditable (ProseMirror editors)
 * 3. Textarea fallback (AI Studio)
 *
 * Uses `execCommand('insertText')` for ProseMirror-like editors
 * which maintains framework state (React/Angular/Lit event dispatch).
 */

// ─── Editor Detection ──────────────────────────────────────────────────────

function findEditor(): HTMLElement | null {
  // Strategy 1: ARIA-based (most resilient against obfuscated class names)
  const ariaEditor = document.querySelector<HTMLElement>(
    '[role="textbox"][contenteditable="true"]',
  );
  if (ariaEditor) return ariaEditor;

  // Strategy 2: Generic contenteditable with reasonable size
  const editables = document.querySelectorAll<HTMLElement>(
    '[contenteditable="true"]',
  );
  for (const el of editables) {
    // Skip tiny elements (icons, buttons with contenteditable)
    const rect = el.getBoundingClientRect();
    if (rect.width > 100 && rect.height > 30) {
      return el;
    }
  }

  // Strategy 3: Textarea fallback (AI Studio uses standard textareas)
  const textarea = document.querySelector<HTMLTextAreaElement>('textarea');
  if (textarea) return textarea;

  return null;
}

// ─── Text Injection ────────────────────────────────────────────────────────

function injectText(element: HTMLElement, text: string): Promise<boolean> {
  element.focus();

  // Wait a frame for focus to settle (ProseMirror needs this)
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve(injectTextSync(element, text));
    });
  });
}

function injectTextSync(element: HTMLElement, text: string): boolean {
  // ── Path A: Standard textarea (AI Studio) ────────────────────────────
  if (element instanceof HTMLTextAreaElement) {
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // ── Path B: Contenteditable (Gemini — ProseMirror-like) ──────────────
  // Select all existing content, then replace with insertText.
  // This triggers proper framework event listeners.
  try {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // execCommand('insertText') triggers input events that
    // ProseMirror/React/Angular/Lit frameworks listen to
    const success = document.execCommand('insertText', false, text);

    if (success) return true;
  } catch {
    // execCommand failed, try fallback
  }

  // ── Path C: Fallback — direct DOM + synthetic events ─────────────────
  try {
    element.textContent = text;
    element.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

// ─── Message Listener ──────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; prompt?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; error?: string }) => void,
  ) => {
    if (message.type === 'INSERT_PROMPT' && message.prompt) {
      // Small delay to ensure the page is ready
      setTimeout(async () => {
        const editor = findEditor();
        if (!editor) {
          sendResponse({
            success: false,
            error: 'Could not find the text editor on this page.',
          });
          return;
        }

        const ok = await injectText(editor, message.prompt!);
        if (ok) {
          sendResponse({ success: true });
        } else {
          sendResponse({
            success: false,
            error: 'Failed to inject text into the editor.',
          });
        }
      }, 100);

      return true; // Keep channel open for async response
    }

    return false;
  },
);
