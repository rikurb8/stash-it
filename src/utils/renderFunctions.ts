/**
 * Render functions for different component types
 * Uses plain JavaScript template literals (CSP-compliant, no eval/Function)
 */

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render a single history snippet item
 */
function renderHistorySnippet(item: SnippetHistoryItem, isActive: boolean = false): string {
  const activeClass = isActive ? 'active' : '';
  const timestamp = formatTimestamp(item.timestamp);
  const formatUpper = item.format.toUpperCase();

  return /*html*/ `<div class="history-item ${activeClass}"
     data-id="${escapeHtml(item.id)}"
     data-type="snippet"
     hx-get="/history/load"
     hx-vals='{"id": "${escapeHtml(item.id)}"}'
     hx-trigger="click"
     hx-target="#code-container"
     hx-swap="innerHTML">
  <div class="history-item-header">
    <span class="history-item-time">${escapeHtml(timestamp)}</span>
    <span class="history-item-format ${escapeHtml(item.format)}">${escapeHtml(formatUpper)}</span>
    <button class="delete-history-btn"
            data-id="${escapeHtml(item.id)}"
            hx-delete="/history/delete"
            hx-vals='{"id": "${escapeHtml(item.id)}"}'
            hx-trigger="click"
            hx-target="closest .history-item"
            hx-swap="outerHTML swap:0.5s"
            title="Delete">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
      </svg>
    </button>
  </div>
</div>`;
}

/**
 * Render a single history link item
 */
function renderHistoryLink(item: LinkHistoryItem): string {
  const timestamp = formatTimestamp(item.timestamp);
  const domain = new URL(item.url).hostname;
  const title = item.title || item.url;

  return /*html*/ `<div class="history-item history-item-link"
     data-id="${escapeHtml(item.id)}"
     data-type="link"
     data-url="${escapeHtml(item.url)}">
  <div class="history-item-header">
    <span class="history-item-time">${escapeHtml(timestamp)}</span>
    <span class="history-item-format link">LINK</span>
    <button class="delete-history-btn"
            data-id="${escapeHtml(item.id)}"
            hx-delete="/history/delete"
            hx-vals='{"id": "${escapeHtml(item.id)}"}'
            hx-trigger="click"
            hx-target="closest .history-item"
            hx-swap="outerHTML swap:0.5s"
            title="Delete">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
      </svg>
    </button>
  </div>
  <div class="history-item-content">
    <div class="link-title">${escapeHtml(title)}</div>
    <div class="link-domain">${escapeHtml(domain)}</div>
  </div>
</div>`;
}

/**
 * Render a single history item (dispatches to correct renderer)
 */
function renderHistoryItem(item: HistoryItem, currentHistoryId: string | null): string {
  if (item.type === 'link') {
    return renderHistoryLink(item);
  } else {
    return renderHistorySnippet(item, item.id === currentHistoryId);
  }
}

/**
 * Render the complete history list
 */
function renderHistoryList(items: HistoryItem[], currentHistoryId: string | null = null): string {
  if (items.length === 0) {
    return '<div class="history-empty">No history yet</div>';
  }

  return items.map(item => renderHistoryItem(item, currentHistoryId)).join('');
}

/**
 * Render code display with syntax highlighting
 */
function renderCodeDisplay(content: string, format: 'json' | 'xml'): string {
  let formattedContent: string;
  let language: string;

  if (format === 'json') {
    formattedContent = formatJSON(content);
    language = 'json';
  } else if (format === 'xml') {
    formattedContent = formatXML(content);
    language = 'xml';
  } else {
    throw new Error('Unknown format type');
  }

  return `<pre><code id="code-content" class="language-${escapeHtml(language)}">${escapeHtml(formattedContent)}</code></pre>`;
}
