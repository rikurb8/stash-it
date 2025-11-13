// highlight.js is loaded globally from lib/highlight.js
// XML formatter is loaded globally from lib/xml-formatter.js
// All utility modules are loaded via script tags

// Type declarations for global libraries
declare const hljs: {
  highlightElement(element: HTMLElement): void;
};

// Get DOM elements
const codeContent = document.getElementById('code-content') as HTMLElement;
const codeContainer = document.getElementById('code-container') as HTMLElement;
const errorMessage = document.getElementById('error-message') as HTMLElement;
const formatType = document.getElementById('format-type') as HTMLElement;
const loading = document.getElementById('loading') as HTMLElement;
const historyList = document.getElementById('history-list') as HTMLElement;
const clearAllBtn = document.getElementById('clear-all-btn') as HTMLButtonElement;
const welcomeScreen = document.getElementById('welcome-screen') as HTMLElement;

// Current active history item
let currentHistoryId: string | null = null;

// Show welcome screen
function showWelcome(): void {
  welcomeScreen.classList.remove('hidden');
  loading.classList.add('hidden');
  codeContainer.classList.add('hidden');
  errorMessage.classList.add('hidden');
}

// Hide welcome screen
function hideWelcome(): void {
  welcomeScreen.classList.add('hidden');
}

// Display error message
function showError(message: string): void {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  loading.classList.add('hidden');
  codeContainer.classList.add('hidden');
  welcomeScreen.classList.add('hidden');
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

    // Show the code container and hide loading/welcome
    loading.classList.add('hidden');
    welcomeScreen.classList.add('hidden');
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

  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No history yet</div>';
    return;
  }

  historyList.innerHTML = history.map(item => {
    if (item.type === 'link') {
      // Render link item
      const domain = new URL(item.url).hostname;
      return `
        <div class="history-item history-item-link" data-id="${item.id}" data-type="link" data-url="${item.url}">
          <div class="history-item-header">
            <span class="history-item-time">${formatTimestamp(item.timestamp)}</span>
            <span class="history-item-format link">LINK</span>
            <button class="delete-history-btn" data-id="${item.id}" title="Delete">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
              </svg>
            </button>
          </div>
          <div class="history-item-content">
            <div class="link-title">${item.title || item.url}</div>
            <div class="link-domain">${domain}</div>
          </div>
        </div>
      `;
    } else {
      // Render snippet item
      return `
        <div class="history-item" data-id="${item.id}" data-type="snippet">
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
      `;
    }
  }).join('');

  // Add event listeners to history items
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't trigger if clicking delete button
      if ((e.target as HTMLElement).closest('.delete-history-btn')) {
        return;
      }

      const itemElement = item as HTMLElement;
      if (itemElement.dataset.type === 'link') {
        // Open link in new tab
        const url = itemElement.dataset.url;
        if (url) {
          browser.tabs.create({ url: url });
        }
      } else {
        // Load snippet
        const id = itemElement.dataset.id;
        if (id) {
          loadHistoryItem(id);
        }
      }
    });
  });

  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-history-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id;
      if (id) {
        deleteHistoryItemAndUpdate(id);
      }
    });
  });

  updateHistoryActiveState();
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
    // If we deleted the currently displayed item, show welcome screen
    if (currentHistoryId === id) {
      currentHistoryId = null;
      codeContainer.classList.add('hidden');
      showWelcome();
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
    showWelcome();
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
      hideWelcome();
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

      // Show welcome screen with success message
      showWelcome();
      return;
    }

    // Retrieve new snippet content from storage (if any)
    const result = await browser.storage.local.get(['formatterContent']);

    if (!result.formatterContent) {
      // No new content, show welcome screen
      showWelcome();
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
    hideWelcome();
    displayContent(content, format, historyId);

    // Clear temporary storage after loading
    browser.storage.local.remove('formatterContent');

  } catch (error) {
    showError(`Error loading content: ${(error as Error).message}`);
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Load content and history
  loadContent();

  // Add clear all button event listener
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearAllHistoryAndUpdate();
    }
  });
});
