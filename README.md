# Stash It - Firefox Extension

Your personal stash for code snippets and interesting links. Select, stash, and revisit whenever you need them.

## What's This About?

Ever find yourself copying JSON blobs or XML configs between tabs? Or bookmarking links you know you'll forget about? **Stash It** is your snippet treasure chest - select any JSON or XML text, right-click to stash it, and it gets beautifully formatted with syntax highlighting. Also works for saving links you want to revisit later.

Think of it as your code snippet pocket, but way prettier.

## Features

- **Smart Formatting**: Automatically detects and formats JSON and XML with proper indentation
- **Pretty Syntax Highlighting**: Uses highlight.js with GitHub Dark theme (easy on the eyes)
- **Quick Access**: Right-click menu or keyboard shortcuts
- **Link Stashing**: Save interesting links for later with a quick shortcut
- **History Sidebar**: Browse through your stash collection
- **Clean Dark UI**: Modern interface that doesn't burn your retinas

## Installation

### Option 1: Load Temporary Add-on (For Testing)

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to the extension directory and select `manifest.json`
5. The extension is now loaded temporarily (will be removed when Firefox restarts)

### Option 2: Install as Permanent Add-on

1. Package the extension:
   ```bash
   cd browser-formatted-viewer
   zip -r stash-it.xpi *
   ```

2. In Firefox, go to `about:addons`
3. Click the gear icon ⚙️ and select "Install Add-on From File..."
4. Select the `stash-it.xpi` file
5. Confirm the installation

**Note**: Firefox requires extensions to be signed for permanent installation. For personal use, you can:
- Use temporary add-on loading for development
- Enable `xpinstall.signatures.required` to `false` in `about:config` (not recommended for security reasons)
- Submit to Mozilla Add-ons for signing

## Publishing

For detailed instructions on publishing this extension to Mozilla Add-ons (AMO), see [PUBLISHING.md](PUBLISHING.md).

Quick start:
```bash
# Install dependencies
npm install

# Build the extension
npm run build

# The packaged extension will be in web-ext-artifacts/
```

## Usage

### Stashing Code Snippets

1. **Select Text**: Highlight JSON or XML text on any webpage
2. **Right-Click**: Open the context menu and choose "Stash selected snippet"
   - Or use the keyboard shortcut: `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac)
3. **View Your Stash**: A new tab opens with your beautifully formatted snippet

### Stashing Links

1. **Navigate** to any page worth revisiting
2. **Press** `Ctrl+Shift+U` (Windows/Linux) or `Cmd+Shift+U` (Mac)
3. **Done**: The link is saved to your history

### Browsing Your Stash

- Click the History sidebar to see all your stashed snippets and links
- Click on any snippet to view it again
- Click on any link to open it in a new tab

### Example Content to Test

**JSON:**
```json
{"name":"John Doe","age":30,"city":"New York","hobbies":["reading","coding","gaming"]}
```

**XML:**
```xml
<?xml version="1.0"?><note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don't forget me this weekend!</body></note>
```

## Technical Details

### Architecture

```
browser-formatted-viewer/
├── src/
│   ├── background/
│   │   └── background.js      # Context menu and storage
│   ├── content/
│   │   └── viewer.js          # Main viewer logic
│   ├── formatters/
│   │   ├── jsonFormatter.js   # JSON formatting
│   │   └── xmlFormatter.js    # XML formatting
│   ├── ui/
│   │   ├── viewer.html        # Display page
│   │   └── viewer.css         # Dark-themed styling
│   ├── utils/
│   │   ├── formatDetector.js  # Format detection
│   │   └── historyManager.js  # History utilities
│   ├── lib/                   # Bundled libraries
│   └── constants.js           # Shared constants
├── icons/                     # Extension icons
├── manifest.json              # Extension config
└── package.json
```

### Libraries Used

- **[highlight.js](https://highlightjs.org/)** (v11.9.0): Syntax highlighting with GitHub Dark theme
- **[xml-formatter](https://www.npmjs.com/package/xml-formatter)** (v3.6.3): XML formatting

### Permissions

- `contextMenus`: Create the right-click menu item
- `activeTab`: Access selected text from the current page
- `storage`: Store snippets and links locally

### How It Works

1. User selects text and clicks context menu or uses keyboard shortcut
2. `background.js` captures the selected text
3. Text is stored in `browser.storage.local`
4. New tab opens with `viewer.html`
5. `viewer.js` retrieves the text from storage
6. Format is auto-detected (JSON or XML)
7. Content is formatted using the appropriate formatter
8. Syntax highlighting is applied with highlight.js
9. Storage is cleared after loading (except history)

## Development

### Prerequisites

- Firefox Browser (version 48+)
- Node.js and npm (for build tools)

### Setup

```bash
# Install dependencies
npm install
```

### Available Scripts

- `npm start` - Run extension in Firefox for testing
- `npm run lint` - Validate extension code
- `npm run build` - Build and package the extension
- `npm test` - Run linting tests

### Testing

1. Make changes to the code
2. Run the extension: `npm start`
3. Or if testing with temporary add-on:
   - Go to `about:debugging`
   - Click "Reload" next to the extension
4. Test with various JSON/XML content

### Debugging

- Open the Browser Console: `Ctrl+Shift+J` (Windows/Linux) or `Cmd+Shift+J` (Mac)
- View extension logs and errors
- Use `console.log()` in your code for debugging

## Customization

### Change Highlight.js Theme

Replace `src/lib/github-dark.min.css` with another highlight.js theme, and update the link reference in `src/ui/viewer.html`.

### Modify Formatting Options

**JSON** (src/formatters/jsonFormatter.js):
```javascript
return JSON.stringify(parsed, null, 2); // Change '2' for different indentation
```

**XML** (src/formatters/xmlFormatter.js):
```javascript
const formatted = xmlFormatter(text, {
  indentation: '  ',      // Change indentation
  collapseContent: true,  // Collapse empty tags
  lineSeparator: '\n'     // Line separator
});
```

## Troubleshooting

### Extension Not Loading

- Check that all files are in the correct directory
- Verify `manifest.json` syntax is valid
- Check Browser Console for error messages

### Content Not Displaying

- Ensure text is properly selected before right-clicking
- Check if content is valid JSON/XML
- View error message in the viewer page

### Syntax Highlighting Not Working

- Libraries are bundled locally, so no internet connection needed
- Check Browser Console for loading errors

## Browser Compatibility

- Firefox 48+ (Manifest V2)
- **Note**: Chrome/Edge require Manifest V3 and different API usage

## License

MIT License - Feel free to use and modify as needed.

## Resources

- [Firefox Extension Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [highlight.js Documentation](https://highlightjs.org/)
- [xml-formatter on npm](https://www.npmjs.com/package/xml-formatter)
- [Context Menus API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus)

## Contributing

Found a bug? Got an idea? Feel free to submit issues and enhancement requests!
