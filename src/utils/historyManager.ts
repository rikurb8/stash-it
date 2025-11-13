interface SnippetHistoryItem {
  id: string;
  type: 'snippet';
  content: string;
  format: 'json' | 'xml';
  timestamp: number;
}

interface LinkHistoryItem {
  id: string;
  type: 'link';
  url: string;
  title: string;
  favIconUrl: string | null;
  timestamp: number;
}

type HistoryItem = SnippetHistoryItem | LinkHistoryItem;

// Load history from storage
async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const result = await browser.storage.local.get(['formatHistory']);
    return (result.formatHistory as HistoryItem[]) || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

// Save snippet to history
async function saveToHistory(content: string, format: 'json' | 'xml'): Promise<string | null> {
  try {
    const history = await loadHistory();

    const historyItem: SnippetHistoryItem = {
      id: Date.now().toString(),
      type: 'snippet',
      content: content,
      format: format,
      timestamp: Date.now()
    };

    // Add to beginning of array (most recent first)
    history.unshift(historyItem);

    // Save back to storage
    await browser.storage.local.set({ formatHistory: history });

    // Return the new item's ID
    return historyItem.id;
  } catch (error) {
    console.error('Error saving to history:', error);
    return null;
  }
}

// Save link to history
async function saveLinkToHistory(url: string, title: string, favIconUrl: string | null = null): Promise<string | null> {
  try {
    const history = await loadHistory();

    const historyItem: LinkHistoryItem = {
      id: Date.now().toString(),
      type: 'link',
      url: url,
      title: title || url,
      favIconUrl: favIconUrl,
      timestamp: Date.now()
    };

    // Add to beginning of array (most recent first)
    history.unshift(historyItem);

    // Save back to storage
    await browser.storage.local.set({ formatHistory: history });

    // Return the new item's ID
    return historyItem.id;
  } catch (error) {
    console.error('Error saving link to history:', error);
    return null;
  }
}

// Delete a history item
async function deleteHistoryItem(id: string): Promise<boolean> {
  try {
    const history = await loadHistory();
    const filtered = history.filter(item => item.id !== id);

    await browser.storage.local.set({ formatHistory: filtered });
    return true;
  } catch (error) {
    console.error('Error deleting history item:', error);
    return false;
  }
}

// Clear all history
async function clearAllHistory(): Promise<boolean> {
  try {
    await browser.storage.local.set({ formatHistory: [] });
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}

// Format timestamp for display
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Format as date
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
