# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Format & View is a Firefox extension (Manifest V2) that formats and syntax-highlights JSON and XML content in a new tab. Users select text on any webpage, right-click, and choose "Format and Open in New Tab" to view beautifully formatted code.

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

### Extension Flow
1. **Context Menu Creation** (background.js): Creates "Format and Open in New Tab" menu item on extension install
2. **Content Capture** (background.js): On menu click, captures selected text and stores in `browser.storage.local`
3. **New Tab Display** (viewer.html): Opens viewer page in new tab
4. **Format Detection** (viewer.js): Automatically detects JSON vs XML based on content structure
5. **Formatting** (viewer.js):
   - JSON: Uses native `JSON.stringify()` with 2-space indentation
   - XML: Uses bundled xml-formatter library (lib/xml-formatter.js) with custom options
6. **Syntax Highlighting** (viewer.js): Applies highlight.js with GitHub Dark theme
7. **Cleanup** (viewer.js): Removes content from storage after display

### Key Files
- **manifest.json**: Extension configuration (Manifest V2, permissions, background scripts)
- **background.js**: Background script handling context menu and storage operations
- **viewer.html**: Display page using bundled libraries from lib/ directory
- **viewer.js**: Core formatting logic and format detection
- **viewer.css**: Dark-themed UI styling (GitHub-inspired)
- **lib/**: Bundled libraries (highlight.js, xml-formatter.js, github-dark.min.css)

### Format Detection Logic (viewer.js:12-35)
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
Libraries are bundled locally in lib/ directory rather than loaded from CDN to ensure offline functionality and pass AMO review requirements. The .web-ext-config.js excludes documentation and build files from the packaged extension.

## Testing Workflow

1. Make code changes to background.js, viewer.js, or viewer.html
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
Edit viewer.js:41 - Change the third parameter in `JSON.stringify(parsed, null, 2)`

### Changing XML Formatting Options
Edit viewer.js:51-55 - Modify the xmlFormatter options object:
- `indentation`: Change spacing (default: '  ')
- `collapseContent`: Toggle empty tag collapsing
- `lineSeparator`: Modify line breaks

### Updating Highlight.js Theme
Replace lib/github-dark.min.css with another highlight.js theme, and update viewer.html:9 link reference

### Modifying UI Colors
Edit viewer.css - Color variables are embedded throughout (not using CSS custom properties)

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
