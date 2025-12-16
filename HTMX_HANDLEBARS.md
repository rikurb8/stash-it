# htmx + Handlebars Integration Guide

This document explains how htmx and Handlebars have been integrated into the Stash It extension.

## Architecture Overview

The extension now uses a **client-side routing system** that mimics server-side behavior:

```
┌─────────────────┐
│  User Action    │
│  (Click item)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  htmx Trigger   │
│  hx-post="/..." │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  htmx Router    │
│  (Intercepts)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Route Handler  │
│  (Async func)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Render Func    │
│  (Handlebars)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTML Response  │
│  (Swap into DOM)│
└─────────────────┘
```

## Directory Structure

```
src/
├── templates/              # NEW: Handlebars templates
│   ├── history-snippet.hbs # Snippet history item
│   ├── history-link.hbs    # Link history item
│   ├── history-list.hbs    # Complete list (unused currently)
│   └── code-display.hbs    # Code viewer display
├── lib/                    # External libraries
│   ├── handlebars.min.js   # NEW: Handlebars runtime
│   ├── htmx.min.js         # NEW: htmx library
│   ├── highlight.js        # Syntax highlighting
│   └── xml-formatter.js    # XML formatting
├── utils/                  # Utility modules
│   ├── templateLoader.ts   # NEW: Load and compile .hbs files
│   ├── htmxRouter.ts       # NEW: Client-side routing
│   ├── renderFunctions.ts  # NEW: Component renderers
│   ├── historyManager.ts   # History storage
│   └── formatDetector.ts   # Format detection
├── types/                  # NEW: TypeScript declarations
│   └── globals.d.ts        # Global library types
└── content/
    └── viewer.ts           # MODIFIED: Now uses htmx+Handlebars
```

## Key Components

### 1. Template Files (`.hbs`)

**Location**: `src/templates/`

Templates are stored as separate `.hbs` files and loaded at runtime:

```handlebars
<!-- history-snippet.hbs -->
<div class="history-item {{#if active}}active{{/if}}"
     data-id="{{id}}"
     data-type="snippet"
     hx-post="/history/load"
     hx-vals='{"id": "{{id}}"}'
     hx-trigger="click"
     hx-target="#code-container"
     hx-swap="innerHTML">
  <div class="history-item-header">
    <span class="history-item-time">{{timestamp}}</span>
    <span class="history-item-format {{format}}">{{formatUpper}}</span>
    <button class="delete-history-btn"
            hx-post="/history/delete"
            hx-vals='{"id": "{{id}}"}'
            title="Delete">
      <!-- SVG icon -->
    </button>
  </div>
</div>
```

**Key htmx attributes used:**
- `hx-post`: Endpoint to call (intercepted by router)
- `hx-vals`: JSON data to send with request
- `hx-trigger`: Event that triggers the request
- `hx-target`: Where to put the response
- `hx-swap`: How to swap the response (innerHTML, outerHTML, etc.)

### 2. Template Loader (`templateLoader.ts`)

**Purpose**: Fetch and compile `.hbs` files at runtime

**Key features:**
- Caching: Templates are compiled once and cached
- Uses `browser.runtime.getURL()` to load templates
- Registers custom Handlebars helpers

```typescript
// Load a template
const template = await loadTemplate('history-snippet');

// Render with data
const html = template({ id: '123', format: 'json', ... });
```

**Custom Helpers:**
- `upper`: Convert string to uppercase
- `eq`: Equality comparison
- `json`: Stringify for hx-vals

### 3. htmx Router (`htmxRouter.ts`)

**Purpose**: Intercept htmx requests and route to handlers

**How it works:**

1. **Intercept htmx requests**:
   ```typescript
   document.body.addEventListener('htmx:beforeRequest', async (event) => {
     event.preventDefault(); // Prevent actual HTTP request
     // ... route to handler
   });
   ```

2. **Parse request data** from `hx-vals` attribute:
   ```typescript
   const hxVals = target.getAttribute('hx-vals');
   const requestData = JSON.parse(hxVals);
   ```

3. **Execute route handler**:
   ```typescript
   const handler = routes.get(path);
   const html = await handler(requestData);
   ```

4. **Update DOM**:
   ```typescript
   target.innerHTML = html;
   htmx.process(target); // Process any new htmx attributes
   ```

**API:**

```typescript
// Register a route
registerRoute('/history/load', async (data: { id: string }) => {
  // ... fetch data, render template
  return html;
});

// Dispatch programmatically
dispatchHtmxRequest('/history/load', { id: '123' }, targetElement);
```

### 4. Render Functions (`renderFunctions.ts`)

**Purpose**: Render components using Handlebars templates

**Functions:**
- `renderHistorySnippet(item, isActive)`: Render snippet item
- `renderHistoryLink(item)`: Render link item
- `renderHistoryItem(item, currentId)`: Dispatch to correct renderer
- `renderHistoryList(items, currentId)`: Render complete list
- `renderCodeDisplay(content, format)`: Render code viewer

**Example:**
```typescript
async function renderHistorySnippet(item, isActive) {
  const template = await loadTemplate('history-snippet');
  return template({
    id: item.id,
    timestamp: formatTimestamp(item.timestamp),
    format: item.format,
    formatUpper: item.format.toUpperCase(),
    active: isActive
  });
}
```

### 5. Viewer Integration (`viewer.ts`)

**Key changes:**

1. **Simplified history rendering**:
   ```typescript
   // BEFORE (120 lines of template literals)
   historyList.innerHTML = history.map(item => `<div>...</div>`).join('');

   // AFTER (3 lines)
   const html = await renderHistoryList(history, currentHistoryId);
   historyList.innerHTML = html;
   htmx.process(historyList);
   ```

2. **Route registration**:
   ```typescript
   registerRoute('/history/load', async (data) => {
     // Load item, render code, update UI
     return html;
   });

   registerRoute('/history/delete', async (data) => {
     // Delete item, update UI
     return '';
   });
   ```

3. **No manual event listeners** for history items (htmx handles it)

## Benefits

### Code Quality
- **Separation of concerns**: Templates separate from logic
- **Reusability**: Templates can be used anywhere
- **Type safety**: TypeScript for logic, typed template data
- **Maintainability**: Easy to modify UI without touching JS

### Developer Experience
- **Declarative UI**: Interactions defined in HTML
- **Less boilerplate**: No manual event listeners
- **Built-in animations**: htmx swap transitions
- **Hot reloadable**: Templates can be edited independently

### Performance
- **Template caching**: Compiled once, reused many times
- **Efficient updates**: htmx only updates changed parts
- **Progressive enhancement**: Works without JS frameworks

## Usage Examples

### Adding a New Component

1. **Create template** (`src/templates/my-component.hbs`):
   ```handlebars
   <div class="my-component">
     <h3>{{title}}</h3>
     <p>{{description}}</p>
   </div>
   ```

2. **Create render function** (in `renderFunctions.ts`):
   ```typescript
   async function renderMyComponent(data) {
     const template = await loadTemplate('my-component');
     return template(data);
   }
   ```

3. **Register route** (in `viewer.ts`):
   ```typescript
   registerRoute('/my-component', async (data) => {
     return await renderMyComponent(data);
   });
   ```

4. **Use in HTML**:
   ```html
   <button hx-post="/my-component"
           hx-vals='{"title": "Hello"}'
           hx-target="#output">
     Load Component
   </button>
   ```

### Adding htmx Interactions

**Delete with confirmation:**
```handlebars
<button hx-post="/delete"
        hx-vals='{"id": "{{id}}"}'
        hx-confirm="Are you sure?"
        hx-swap="outerHTML swap:0.5s">
  Delete
</button>
```

**Loading indicator:**
```handlebars
<button hx-post="/load"
        hx-indicator="#spinner">
  Load
</button>
<div id="spinner" class="htmx-indicator">Loading...</div>
```

**Optimistic UI:**
```handlebars
<button hx-post="/like"
        hx-swap="outerHTML"
        onclick="this.classList.add('liked')">
  Like
</button>
```

## Configuration

### manifest.json

Templates must be web-accessible:
```json
{
  "web_accessible_resources": [
    "src/templates/*.hbs"
  ]
}
```

### viewer.html

Load libraries in order:
```html
<!-- External Libraries -->
<script src="../lib/handlebars.min.js"></script>
<script src="../lib/htmx.min.js"></script>

<!-- Utility Modules -->
<script src="../../dist/utils/templateLoader.js"></script>
<script src="../../dist/utils/htmxRouter.js"></script>
<script src="../../dist/utils/renderFunctions.js"></script>

<!-- Viewer Logic -->
<script src="../../dist/content/viewer.js"></script>
```

## Testing

### Test Template Rendering

```typescript
// In browser console
const template = await loadTemplate('history-snippet');
const html = template({ id: '123', format: 'json', formatUpper: 'JSON', timestamp: 'Just now' });
console.log(html);
```

### Test Route Handlers

```typescript
// In browser console
dispatchHtmxRequest('/history/load', { id: '123' }, document.getElementById('code-container'));
```

### Debug htmx

```javascript
// Enable htmx logging
htmx.logAll();

// View htmx events
document.body.addEventListener('htmx:afterRequest', (e) => {
  console.log('htmx request completed:', e.detail);
});
```

## Common Patterns

### Conditional Rendering
```handlebars
{{#if active}}
  <div class="active">Active!</div>
{{else}}
  <div>Inactive</div>
{{/if}}
```

### Loops
```handlebars
{{#each items}}
  <div>{{this.name}}</div>
{{/each}}
```

### Nested Data
```handlebars
<div>{{user.profile.name}}</div>
```

### Escaping
```handlebars
{{{unescapedHtml}}}  <!-- Raw HTML -->
{{escapedText}}       <!-- Escaped for safety -->
```

## Troubleshooting

### Templates not loading
- Check `manifest.json` has `web_accessible_resources`
- Verify template filename matches `loadTemplate()` call
- Check browser console for fetch errors

### htmx not triggering
- Verify htmx is loaded before viewer.js
- Check `initializeHtmxRouter()` is called
- Use `htmx.logAll()` to debug

### Route handler not found
- Verify route is registered before first use
- Check path matches exactly (case-sensitive)
- Check route is registered in DOMContentLoaded

### Syntax highlighting not working
- Ensure `hljs.highlightElement()` is called after DOM update
- Use `setTimeout(() => { ... }, 0)` to defer highlighting
- Check code element has correct `language-*` class

## Future Improvements

1. **Streaming responses**: Use htmx SSE for real-time updates
2. **Form handling**: Add forms with htmx validation
3. **Partial updates**: Use `hx-swap="outerHTML"` for efficient updates
4. **History push**: Use `hx-push-url` for browser history
5. **Lazy loading**: Use `hx-trigger="revealed"` for infinite scroll
6. **Prefetching**: Use `hx-trigger="mouseenter"` for instant loads

## Resources

- [htmx Documentation](https://htmx.org/docs/)
- [Handlebars Documentation](https://handlebarsjs.com/guide/)
- [htmx Examples](https://htmx.org/examples/)
- [Extension Best Practices](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
