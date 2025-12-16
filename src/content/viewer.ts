// highlight.js is loaded globally from lib/highlight.js
// XML formatter is loaded globally from lib/xml-formatter.js
// htmx is loaded globally from lib/htmx.min.js
// All utility modules are loaded via script tags

// Get DOM elements
const codeContent = document.getElementById('code-content') as HTMLElement;
const codeContainer = document.getElementById('code-container') as HTMLElement;
const errorMessage = document.getElementById('error-message') as HTMLElement;
const formatType = document.getElementById('format-type') as HTMLElement;
const loading = document.getElementById('loading') as HTMLElement;
const historyList = document.getElementById('history-list') as HTMLElement;
const clearAllBtn = document.getElementById('clear-all-btn') as HTMLButtonElement;

// Current active history item
let currentHistoryId: string | null = null;

// Show first history item, or just hide loading if no history
async function showFirstHistoryItemOrEmpty(): Promise<void> {
  const history = await loadHistory();
  if (history.length === 0) {
    // No history - just hide loading
    loading.classList.add('hidden');
  } else {
    // History exists - show the first item
    await showFirstHistoryItem(history);
  }
}

// Show the first snippet from history, or just hide loading if none
async function showFirstHistoryItem(history: HistoryItem[]): Promise<void> {
  // Find the first snippet item
  const firstSnippet = history.find(item => item.type === 'snippet');

  if (firstSnippet) {
    displayContent(firstSnippet.content, firstSnippet.format, firstSnippet.id);
  } else {
    // Only links exist, just hide loading
    loading.classList.add('hidden');
    codeContainer.classList.add('hidden');
  }
}

// Display error message
function showError(message: string): void {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  loading.classList.add('hidden');
  codeContainer.classList.add('hidden');
}

// Display formatted content
function displayContent(content: string, format: 'json' | 'xml', historyId: string | null = null): void {
  try {
    let formattedContent: string;
    let language: string;

    if (format === 'json') {
      formattedContent = formatJSON(content);
      language = 'json';
      formatType.textContent = 'JSON';
      formatType.className = 'format-badge json-badge';
    } else if (format === 'xml') {
      formattedContent = formatXML(content);
      language = 'xml';
      formatType.textContent = 'XML';
      formatType.className = 'format-badge xml-badge';
    } else {
      throw new Error('Unknown format type');
    }

    // Set content and language class for highlight.js
    codeContent.textContent = formattedContent;
    codeContent.className = `language-${language}`;

    // Remove any existing highlight.js classes before re-highlighting
    delete (codeContent.dataset as any).highlighted;

    // Apply syntax highlighting
    hljs.highlightElement(codeContent);

    // Show the code container and hide loading
    loading.classList.add('hidden');
    codeContainer.classList.remove('hidden');

    // Update active history item
    currentHistoryId = historyId;
    updateHistoryActiveState();

  } catch (error) {
    showError((error as Error).message);
  }
}

// Display history list
async function displayHistoryList(): Promise<void> {
  const history = await loadHistory();

  // Use render function to generate HTML
  const html = renderHistoryList(history, currentHistoryId);
  historyList.innerHTML = html;

  // Process htmx attributes in the new content
  htmx.process(historyList);

  // Add click handlers for links (htmx handles snippets and delete)
  document.querySelectorAll('.history-item-link').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't trigger if clicking delete button
      if ((e.target as HTMLElement).closest('.delete-history-btn')) {
        return;
      }

      const itemElement = item as HTMLElement;
      const url = itemElement.dataset.url;
      if (url) {
        browser.tabs.create({ url: url });
      }
    });
  });
}

// Update active state of history items
function updateHistoryActiveState(): void {
  document.querySelectorAll('.history-item').forEach(item => {
    const itemElement = item as HTMLElement;
    if (itemElement.dataset.id === currentHistoryId) {
      itemElement.classList.add('active');
    } else {
      itemElement.classList.remove('active');
    }
  });
}

// Delete a history item and update UI
async function deleteHistoryItemAndUpdate(id: string): Promise<void> {
  const success = await deleteHistoryItem(id);

  if (success) {
    // If we deleted the currently displayed item, check if we should show welcome
    if (currentHistoryId === id) {
      currentHistoryId = null;
      codeContainer.classList.add('hidden');
      await showFirstHistoryItemOrEmpty();
    }

    displayHistoryList();
  }
}

// Clear all history and update UI
async function clearAllHistoryAndUpdate(): Promise<void> {
  const success = await clearAllHistory();

  if (success) {
    currentHistoryId = null;
    codeContainer.classList.add('hidden');
    loading.classList.add('hidden');
    displayHistoryList();
  }
}

// Load a history item
async function loadHistoryItem(id: string): Promise<void> {
  try {
    const history = await loadHistory();
    const item = history.find(h => h.id === id);

    if (!item) {
      showError('History item not found');
      return;
    }

    if (item.type === 'snippet') {
      displayContent(item.content, item.format, id);
    }
  } catch (error) {
    showError(`Error loading history item: ${(error as Error).message}`);
  }
}

// Main function to load and display content
async function loadContent(): Promise<void> {
  try {
    // Load and display history first
    await displayHistoryList();

    // Check for link to save
    const linkResult = await browser.storage.local.get(['linkToSave']);
    if (linkResult.linkToSave) {
      const linkData = linkResult.linkToSave as {
        url: string;
        title: string;
        favIconUrl: string | null;
      };

      // Save link to history
      await saveLinkToHistory(linkData.url, linkData.title, linkData.favIconUrl);

      // Update history display
      await displayHistoryList();

      // Clear temporary storage
      browser.storage.local.remove('linkToSave');

      // Show first snippet if available, otherwise hide loading
      const history = await loadHistory();
      await showFirstHistoryItem(history);
      return;
    }

    // Retrieve new snippet content from storage (if any)
    const result = await browser.storage.local.get(['formatterContent']);

    if (!result.formatterContent) {
      // No new content, show first history item or empty
      await showFirstHistoryItemOrEmpty();
      return;
    }

    const content = result.formatterContent as string;

    // Detect format
    const format = detectFormat(content);

    // Save to history
    const historyId = await saveToHistory(content, format);

    // Update history display
    await displayHistoryList();

    // Display formatted content
    displayContent(content, format, historyId);

    // Clear temporary storage after loading
    browser.storage.local.remove('formatterContent');

  } catch (error) {
    showError(`Error loading content: ${(error as Error).message}`);
  }
}

// Register htmx route handlers
function setupRoutes(): void {
  // Route: Load history item
  registerRoute('/history/load', async (data: { id: string }) => {
    const history = await loadHistory();
    const item = history.find((h: HistoryItem) => h.id === data.id);

    if (!item || item.type !== 'snippet') {
      return { error: 'Item not found' };
    }

    // Update current history ID
    currentHistoryId = data.id;

    // Update format badge
    formatType.textContent = item.format.toUpperCase();
    formatType.className = `format-badge ${item.format}-badge`;

    // Render code display
    const html = renderCodeDisplay(item.content, item.format);

    // Show code container
    loading.classList.add('hidden');
    codeContainer.classList.remove('hidden');

    // Update active states in history
    await displayHistoryList();

    // Apply syntax highlighting after content is inserted
    setTimeout(() => {
      const codeElement = document.getElementById('code-content');
      if (codeElement) {
        delete (codeElement.dataset as any).highlighted;
        hljs.highlightElement(codeElement);
      }
    }, 0);

    return { html };
  });

  // Route: Delete history item
  registerRoute('/history/delete', async (data: { id: string }) => {
    await deleteHistoryItem(data.id);

    // If we deleted the currently displayed item, show next item or empty
    if (currentHistoryId === data.id) {
      currentHistoryId = null;
      codeContainer.classList.add('hidden');
      await showFirstHistoryItemOrEmpty();
    }

    // Refresh history list
    await displayHistoryList();

    // Return empty string (element will be removed by htmx swap)
    return { html: '' };
  });

  // Route: Get single history item
  registerRoute('/history/item', async (data: { id: string }) => {
    const history = await loadHistory();
    const item = history.find((h: HistoryItem) => h.id === data.id);

    if (!item) {
      return { error: 'Item not found' };
    }

    return { html: renderHistoryItem(item, currentHistoryId) };
  });
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Setup route handlers first
  setupRoutes();

  // Initialize htmx router
  initializeHtmxRouter();

  // Load content and history
  loadContent();

  // Add clear all button event listener
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearAllHistoryAndUpdate();
    }
  });
});
