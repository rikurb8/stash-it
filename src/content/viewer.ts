// highlight.js is loaded globally from lib/highlight.js
// XML formatter is loaded globally from lib/xml-formatter.js
// htmx is loaded globally from lib/htmx.min.js
// Handlebars is loaded globally from lib/handlebars.min.js
// All utility modules are loaded via script tags

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

// Display history list using htmx+Handlebars
async function displayHistoryList(): Promise<void> {
  const history = await loadHistory();

  // Use render function to generate HTML
  const html = await renderHistoryList(history, currentHistoryId);
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

// Message handler for htmx API calls
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle htmx requests
  if (message.type === 'htmx-request') {
    const { endpoint, data } = message;

    // Route handling
    (async () => {
      try {
        let html = '';

        // Route: Load history item
        if (endpoint === '/history/load') {
          const history = await loadHistory();
          const item = history.find((h: HistoryItem) => h.id === data.id);

          if (!item || item.type !== 'snippet') {
            sendResponse({ error: 'Item not found' });
            return;
          }

          // Update current history ID
          currentHistoryId = data.id;

          // Update format badge
          formatType.textContent = item.format.toUpperCase();
          formatType.className = `format-badge ${item.format}-badge`;

          // Render code display
          html = await renderCodeDisplay(item.content, item.format);

          // Show code container
          loading.classList.add('hidden');
          welcomeScreen.classList.add('hidden');
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
        }
        // Route: Delete history item
        else if (endpoint === '/history/delete') {
          await deleteHistoryItem(data.id);

          // If we deleted the currently displayed item, show welcome screen
          if (currentHistoryId === data.id) {
            currentHistoryId = null;
            codeContainer.classList.add('hidden');
            showWelcome();
          }

          // Refresh history list
          await displayHistoryList();

          // Return empty string (element will be removed by htmx swap)
          html = '';
        }
        // Route: Get single history item
        else if (endpoint === '/history/item') {
          const history = await loadHistory();
          const item = history.find((h: HistoryItem) => h.id === data.id);

          if (!item) {
            sendResponse({ error: 'Item not found' });
            return;
          }

          html = await renderHistoryItem(item, currentHistoryId);
        }
        // Unknown endpoint
        else {
          sendResponse({ error: `Unknown endpoint: ${endpoint}` });
          return;
        }

        // Send HTML response
        sendResponse({ html });
      } catch (error) {
        console.error(`Error handling ${endpoint}:`, error);
        sendResponse({ error: (error as Error).message });
      }
    })();

    // Return true to indicate async response
    return true;
  }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
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
