/**
 * @module extension/service-worker
 * @description Chrome Extension background service worker.
 *
 * Responsibilities:
 * 1. Open side panel when extension icon is clicked
 * 2. Relay INSERT_PROMPT messages from side panel → content script
 * 3. Report whether the active tab is a Gemini page
 */

// ── Open side panel on icon click ──────────────────────────────────────────
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ── Message handling ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; prompt?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (message.type === 'INSERT_PROMPT' && message.prompt) {
      // Relay prompt to the content script on the active Gemini tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, message, (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({
                success: false,
                error: 'Content script not available. Is Gemini open?',
              });
            } else {
              sendResponse(response);
            }
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found.' });
        }
      });
      return true; // Keep channel open for async response
    }

    if (message.type === 'IS_GEMINI_TAB') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url ?? '';
        const isGemini =
          url.includes('gemini.google.com') ||
          url.includes('aistudio.google.com');
        sendResponse({ isGemini });
      });
      return true; // Keep channel open for async response
    }

    return false;
  },
);
