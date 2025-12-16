/**
 * Render functions for different component types
 * These functions load templates and render them with data
 */

/**
 * Render a single history snippet item
 */
async function renderHistorySnippet(item: SnippetHistoryItem, isActive: boolean = false): Promise<string> {
  const template = await loadTemplate('history-snippet');

  return template({
    id: item.id,
    timestamp: formatTimestamp(item.timestamp),
    format: item.format,
    formatUpper: item.format.toUpperCase(),
    active: isActive
  });
}

/**
 * Render a single history link item
 */
async function renderHistoryLink(item: LinkHistoryItem): Promise<string> {
  const template = await loadTemplate('history-link');

  const domain = new URL(item.url).hostname;

  return template({
    id: item.id,
    url: item.url,
    title: item.title || item.url,
    domain: domain,
    timestamp: formatTimestamp(item.timestamp)
  });
}

/**
 * Render a single history item (dispatches to correct renderer)
 */
async function renderHistoryItem(item: HistoryItem, currentHistoryId: string | null): Promise<string> {
  if (item.type === 'link') {
    return renderHistoryLink(item);
  } else {
    return renderHistorySnippet(item, item.id === currentHistoryId);
  }
}

/**
 * Render the complete history list
 */
async function renderHistoryList(items: HistoryItem[], currentHistoryId: string | null = null): Promise<string> {
  if (items.length === 0) {
    return '<div class="history-empty">No history yet</div>';
  }

  // Render all items in parallel
  const renderedItems = await Promise.all(
    items.map(item => renderHistoryItem(item, currentHistoryId))
  );

  return renderedItems.join('');
}

/**
 * Render code display with syntax highlighting
 */
async function renderCodeDisplay(content: string, format: 'json' | 'xml'): Promise<string> {
  const template = await loadTemplate('code-display');

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

  return template({
    code: formattedContent,
    language: language
  });
}
