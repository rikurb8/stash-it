// highlight.js is loaded globally from lib/highlight.js
// XML formatter is loaded globally from lib/xml-formatter.js

// Get DOM elements
const codeContent = document.getElementById('code-content');
const codeContainer = document.getElementById('code-container');
const errorMessage = document.getElementById('error-message');
const formatType = document.getElementById('format-type');
const loading = document.getElementById('loading');
const historyList = document.getElementById('history-list');
const clearAllBtn = document.getElementById('clear-all-btn');

// Current active history item
let currentHistoryId = null;

// Detect if content is JSON or XML
function detectFormat(text) {
  const trimmed = text.trim();

  // Check if it starts with JSON characters
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json';
  }

  // Check if it starts with XML declaration or tags
  if (trimmed.startsWith('<?xml') ||
      (trimmed.startsWith('<') && trimmed.includes('>'))) {
    return 'xml';
  }

  // Try to parse as JSON as fallback
  try {
    JSON.parse(trimmed);
    return 'json';
  } catch (e) {
    // If JSON parse fails, assume XML
    return 'xml';
  }
}

// Format JSON content
function formatJSON(text) {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

// Format XML content
function formatXML(text) {
  try {
    // xml-formatter is available as global `xmlFormatter`
    const formatted = xmlFormatter(text, {
      indentation: '  ',
      collapseContent: true,
      lineSeparator: '\n'
    });
    return formatted;
  } catch (error) {
    throw new Error(`Invalid XML: ${error.message}`);
  }
}

// Display error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  loading.classList.add('hidden');
  codeContainer.classList.add('hidden');
}

// Display formatted content
function displayContent(content, format, historyId = null) {
  try {
    let formattedContent;
    let language;

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
    }

    // Set content and language class for highlight.js
    codeContent.textContent = formattedContent;
    codeContent.className = `language-${language}`;

    // Remove any existing highlight.js classes before re-highlighting
    delete codeContent.dataset.highlighted;

    // Apply syntax highlighting
    hljs.highlightElement(codeContent);

    // Show the code container and hide loading
    loading.classList.add('hidden');
    codeContainer.classList.remove('hidden');

    // Update active history item
    currentHistoryId = historyId;
    updateHistoryActiveState();

  } catch (error) {
    showError(error.message);
  }
}

// Load history from storage
async function loadHistory() {
  try {
    const result = await browser.storage.local.get(['formatHistory']);
    return result.formatHistory || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

// Save to history
async function saveToHistory(content, format) {
  try {
    const history = await loadHistory();

    const historyItem = {
      id: Date.now().toString(),
      content: content,
      format: format,
      timestamp: Date.now()
    };

    // Add to beginning of array (most recent first)
    history.unshift(historyItem);

    // Save back to storage
    await browser.storage.local.set({ formatHistory: history });

    // Update display and return the new item's ID
    displayHistoryList();
    return historyItem.id;
  } catch (error) {
    console.error('Error saving to history:', error);
    return null;
  }
}

// Delete a history item
async function deleteHistoryItem(id) {
  try {
    const history = await loadHistory();
    const filtered = history.filter(item => item.id !== id);

    await browser.storage.local.set({ formatHistory: filtered });

    // If we deleted the currently displayed item, clear the view
    if (currentHistoryId === id) {
      currentHistoryId = null;
      codeContainer.classList.add('hidden');
      loading.classList.remove('hidden');
      loading.querySelector('p').textContent = 'Select a history item or format new content';
    }

    displayHistoryList();
  } catch (error) {
    console.error('Error deleting history item:', error);
  }
}

// Clear all history
async function clearAllHistory() {
  try {
    await browser.storage.local.set({ formatHistory: [] });
    currentHistoryId = null;
    codeContainer.classList.add('hidden');
    loading.classList.remove('hidden');
    loading.querySelector('p').textContent = 'No history. Format some content to get started.';
    displayHistoryList();
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

// Format timestamp for display
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

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

// Display history list
async function displayHistoryList() {
  const history = await loadHistory();

  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No history yet</div>';
    return;
  }

  historyList.innerHTML = history.map(item => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-item-header">
        <span class="history-item-time">${formatTimestamp(item.timestamp)}</span>
        <span class="history-item-format ${item.format}">${item.format.toUpperCase()}</span>
        <button class="delete-history-btn" data-id="${item.id}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Add event listeners to history items
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't trigger if clicking delete button
      if (e.target.closest('.delete-history-btn')) {
        return;
      }
      loadHistoryItem(item.dataset.id);
    });
  });

  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-history-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(btn.dataset.id);
    });
  });

  updateHistoryActiveState();
}

// Update active state of history items
function updateHistoryActiveState() {
  document.querySelectorAll('.history-item').forEach(item => {
    if (item.dataset.id === currentHistoryId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Load a history item
async function loadHistoryItem(id) {
  try {
    const history = await loadHistory();
    const item = history.find(h => h.id === id);

    if (!item) {
      showError('History item not found');
      return;
    }

    displayContent(item.content, item.format, id);
  } catch (error) {
    showError(`Error loading history item: ${error.message}`);
  }
}

// Main function to load and display content
async function loadContent() {
  try {
    // Load and display history first
    await displayHistoryList();

    // Retrieve new content from storage (if any)
    const result = await browser.storage.local.get(['formatterContent']);

    if (!result.formatterContent) {
      // No new content, just show the history
      loading.querySelector('p').textContent = 'Select a history item or format new content';
      return;
    }

    const content = result.formatterContent;

    // Detect format
    const format = detectFormat(content);

    // Save to history
    const historyId = await saveToHistory(content, format);

    // Display formatted content
    displayContent(content, format, historyId);

    // Clear temporary storage after loading
    browser.storage.local.remove('formatterContent');

  } catch (error) {
    showError(`Error loading content: ${error.message}`);
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Load content and history
  loadContent();

  // Add clear all button event listener
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearAllHistory();
    }
  });
});
