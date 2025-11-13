// Create context menu item when extension is installed
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "format-and-view",
    title: "Format and Open in New Tab",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "format-and-view" && info.selectionText) {
    formatAndOpenText(info.selectionText);
  }
});

// Handle keyboard command
browser.commands.onCommand.addListener((command) => {
  if (command === "format-selection") {
    // Query the active tab to get selected text
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0]) {
        // Execute a content script to get the selected text
        browser.tabs.executeScript(tabs[0].id, {
          code: 'window.getSelection().toString();'
        }).then(results => {
          // Call formatAndOpenText with the selection (even if empty)
          formatAndOpenText(results && results[0] ? results[0] : "");
        }).catch(error => {
          console.error("Error getting selection:", error);
          // If we can't get selection (e.g., on special pages), just open viewer
          formatAndOpenText("");
        });
      }
    });
  }
});

// Shared function to format and open text in new tab
function formatAndOpenText(selectedText) {
  // If no text selected, just open the viewer (will show welcome page)
  if (!selectedText || selectedText.trim() === "") {
    browser.tabs.create({
      url: browser.runtime.getURL("src/ui/viewer.html")
    });
    return;
  }

  // Store the text in browser storage for the viewer page to access
  // Using storage instead of URL to handle large content
  browser.storage.local.set({
    formatterContent: selectedText,
    timestamp: Date.now()
  }).then(() => {
    // Open viewer page in a new tab
    browser.tabs.create({
      url: browser.runtime.getURL("src/ui/viewer.html")
    });
  }).catch(error => {
    console.error("Error storing content:", error);
  });
}
