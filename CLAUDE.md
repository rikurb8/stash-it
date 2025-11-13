# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stash It is a Firefox extension (Manifest V2) that lets users stash code snippets and links for later. Select JSON or XML text on any webpage, right-click, and choose "Stash selected snippet" to view beautifully formatted and syntax-highlighted code in a new tab. Also supports quick link saving via keyboard shortcut.

## Development Commands

### Essential Commands
- `npm start` - Run extension in Firefox with debugging enabled (opens at about:debugging)
- `npm run lint` - Validate extension code using web-ext
- `npm run build` - Build and package the extension (output: web-ext-artifacts/*.zip)
- `npm test` - Alias for `npm run lint`

### Publishing Commands
- `npm run package:source` - Create source code package for AMO submission
- `npm run sign` - Sign extension using AMO API (requires WEB_EXT_API_KEY and WEB_EXT_API_SECRET env vars)

## Architecture

### Directory Structure
```
browser-formatted-viewer/
├── src/
│   ├── background/
│   │   └── background.js      # Context menu and storage operations
│   ├── content/
│   │   └── viewer.js          # Main viewer page logic
│   ├── formatters/
│   │   ├── jsonFormatter.js   # JSON formatting module
│   │   └── xmlFormatter.js    # XML formatting module
│   ├── ui/
│   │   ├── viewer.html        # Display page
│   │   └── viewer.css         # Dark-themed UI styling
│   ├── utils/
│   │   ├── formatDetector.js  # Format detection logic
│   │   └── historyManager.js  # History storage utilities
│   ├── lib/                   # Third-party libraries
│   │   ├── highlight.js
│   │   ├── xml-formatter.js
│   │   └── github-dark.min.css
│   └── constants.js           # Shared constants
├── icons/                     # Extension icons
├── manifest.json              # Extension configuration
└── package.json
```

### Extension Flow
1. **Context Menu Creation** (src/background/background.js): Creates "Stash selected snippet" menu item on extension install
2. **Content Capture** (src/background/background.js): On menu click, captures selected text and stores in `browser.storage.local`
3. **New Tab Display** (src/ui/viewer.html): Opens viewer page in new tab
4. **Format Detection** (src/utils/formatDetector.js): Automatically detects JSON vs XML based on content structure
5. **Formatting**: Uses dedicated formatter modules
   - JSON: src/formatters/jsonFormatter.js - native `JSON.stringify()` with 2-space indentation
   - XML: src/formatters/xmlFormatter.js - bundled xml-formatter library with custom options
6. **Syntax Highlighting** (src/content/viewer.js): Applies highlight.js with GitHub Dark theme
7. **History Management** (src/utils/historyManager.js): Saves and manages snippet history
8. **Cleanup** (src/content/viewer.js): Removes temporary content from storage after display

### Module Organization
The codebase is organized into logical modules for better maintainability:
- **Background scripts**: Extension lifecycle and context menu handling
- **Content scripts**: Viewer page logic coordinating all modules
- **Formatters**: Isolated formatting logic for each supported format
- **Utils**: Reusable utilities (format detection, history management)
- **UI**: HTML and CSS separated from logic
- **Lib**: Third-party bundled libraries

### Format Detection Logic (src/utils/formatDetector.js)
The extension uses a multi-step detection approach:
1. Check if content starts/ends with JSON brackets `{}` or `[]`
2. Check for XML declaration `<?xml` or presence of tags `<...>`
3. Fallback: Try JSON.parse(), default to XML if it fails

### Storage Pattern
Uses `browser.storage.local` instead of URL parameters to handle large content. Storage is cleared after content is loaded to prevent accumulation.

## Browser Extension Specifics

### Permissions Required
- `contextMenus`: Create right-click menu item
- `activeTab`: Access selected text from current page
- `storage`: Temporarily store content for viewer page

### Firefox-Specific APIs
This extension uses Firefox WebExtensions API (`browser.*` namespace). For Chrome compatibility, would need:
- Manifest V3 migration
- Chrome API namespace (`chrome.*` instead of `browser.*`)
- Service worker instead of background script

### Bundled Libraries Strategy
Libraries are bundled locally in src/lib/ directory rather than loaded from CDN to ensure offline functionality and pass AMO review requirements. The .web-ext-config.js excludes documentation, build files, and old root-level files from the packaged extension.

## Testing Workflow

1. Make code changes in the src/ directory
2. Run `npm start` to launch Firefox with extension loaded
3. Test with sample content:
   - JSON: `{"name":"John","age":30,"hobbies":["reading","coding"]}`
   - XML: `<?xml version="1.0"?><note><to>Tove</to><from>Jani</from></note>`
4. For temporary addon testing without npm start:
   - Navigate to about:debugging#/runtime/this-firefox
   - Click "Load Temporary Add-on" and select manifest.json
   - Click "Reload" after making changes

## Common Modifications

### Changing JSON Indentation
Edit src/formatters/jsonFormatter.js - Change the third parameter in `JSON.stringify(parsed, null, 2)`

### Changing XML Formatting Options
Edit src/formatters/xmlFormatter.js - Modify the xmlFormatter options object:
- `indentation`: Change spacing (default: '  ')
- `collapseContent`: Toggle empty tag collapsing
- `lineSeparator`: Modify line breaks

### Updating Highlight.js Theme
Replace src/lib/github-dark.min.css with another highlight.js theme, and update src/ui/viewer.html link reference

### Modifying UI Colors
Edit src/ui/viewer.css - Color variables are embedded throughout (not using CSS custom properties)

### Adding New Formatters
1. Create new formatter module in src/formatters/
2. Add format detection logic in src/utils/formatDetector.js
3. Load the module in src/ui/viewer.html
4. Update src/content/viewer.js displayContent() function to handle new format

## Publishing to Mozilla Add-ons

See PUBLISHING.md for detailed instructions. Key points:
- Always run `npm run lint` before building
- Version numbers must be updated in both manifest.json and package.json
- AMO may request source code submission (use `npm run package:source`)
- Extension uses bundled libraries to avoid CDN dependencies and security concerns

## Important Constraints

- **No TypeScript**: This is a vanilla JavaScript project (no build step beyond web-ext packaging)
- **No Module System**: Uses global scripts loaded via script tags (highlight.js and xmlFormatter are global)
- **Firefox Only**: Manifest V2 format, would require significant changes for Chrome/Edge
- **Manifest V2**: Not using Manifest V3 (background scripts instead of service workers)
