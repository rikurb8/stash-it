# Next Steps

This document outlines the roadmap for progressing the Stash It extension after the htmx + Handlebars integration.

## Immediate Tasks (Before Release)

### 1. Testing & Validation
- [ ] **Manual Testing**
  - Load extension with `npm start`
  - Test snippet stashing (JSON and XML)
  - Test link saving via keyboard shortcut
  - Verify history list displays correctly
  - Test loading historical items by clicking
  - Test deleting items from history
  - Verify syntax highlighting works
  - Check responsive behavior and UI polish

- [ ] **Cross-browser Testing** (if applicable)
  - Test in different Firefox versions
  - Verify all features work consistently

- [ ] **Error Scenarios**
  - Test with malformed JSON/XML
  - Test with very large snippets (>1MB)
  - Test with empty selections
  - Test deleting currently displayed item
  - Test rapid clicking/interactions

### 2. Documentation Updates
- [ ] **Update CLAUDE.md**
  - Add section about htmx + Handlebars architecture
  - Document the new module structure
  - Explain template system and routing
  - Update "Adding New Formatters" section to include template creation

- [ ] **Update README.md** (if needed)
  - Mention modern architecture in features
  - Update screenshots if UI changed

- [ ] **Code Comments**
  - Add JSDoc comments to exported functions
  - Document complex routing logic
  - Add inline comments for non-obvious code

### 3. Build & Package
- [ ] **Verify Build Process**
  ```bash
  npm run lint
  npm run build
  ```
- [ ] **Test Packaged Extension**
  - Install the built .zip file
  - Verify all resources load correctly
  - Check templates are accessible
  - Test all functionality

### 4. Version & Release
- [ ] Update version numbers
  - `manifest.json`: Update `version` field
  - `package.json`: Update `version` field
  - Keep them in sync

- [ ] Create git tag
  ```bash
  git tag -a v0.2.0 -m "feat: htmx + Handlebars integration"
  git push origin v0.2.0
  ```

## Short-term Improvements (Next Sprint)

### 1. Performance Optimization
- [ ] **Measure Performance**
  - Profile template loading times
  - Check memory usage with large history
  - Measure rendering performance

- [ ] **Optimize Template Loading**
  - Consider preloading all templates on startup
  - Implement template bundle for faster loading
  - Add loading indicators for slow operations

- [ ] **History Management**
  - Implement pagination for large history lists
  - Add search/filter functionality
  - Consider IndexedDB for better storage performance

### 2. User Experience Enhancements
- [ ] **History Features**
  - Add "Clear All History" button
  - Implement export history to JSON
  - Add import history from JSON
  - Group history by date (Today, Yesterday, This Week, etc.)

- [ ] **UI Polish**
  - Add loading animations (htmx indicators)
  - Improve delete confirmation (modal dialog)
  - Add keyboard shortcuts for navigation
  - Implement drag-to-reorder history items

- [ ] **Error Handling**
  - Better error messages for users
  - Add retry mechanisms for failed operations
  - Implement error boundary for UI

### 3. Code Quality
- [ ] **Testing Infrastructure**
  - Set up unit tests (Jest or Vitest)
  - Add tests for formatters
  - Test template rendering
  - Test routing logic

- [ ] **Linting & Formatting**
  - Configure ESLint for TypeScript
  - Set up Prettier for consistent formatting
  - Add pre-commit hooks

- [ ] **Type Safety**
  - Add stricter TypeScript configuration
  - Define interfaces for all data structures
  - Remove `any` types where possible

## Medium-term Features (Next Month)

### 1. New Formatters
- [ ] **Additional Format Support**
  - YAML formatter
  - TOML formatter
  - CSV formatter with table view
  - Markdown preview
  - SQL formatter with syntax highlighting

- [ ] **Format Conversion**
  - Convert JSON ↔ XML
  - Convert JSON ↔ YAML
  - Export formatted code to file

### 2. Advanced Features
- [ ] **Code Manipulation**
  - Inline editing of stashed snippets
  - JSONPath/XPath query tool
  - Pretty print vs. minify toggle
  - Copy specific nodes/paths

- [ ] **Collections & Organization**
  - Create named collections/folders
  - Tag snippets with labels
  - Star/favorite important snippets
  - Color-code snippets

- [ ] **Sharing & Collaboration**
  - Generate shareable links (via Gist or Pastebin)
  - Export snippets with syntax highlighting (HTML)
  - Create snippet screenshots

### 3. Settings & Customization
- [ ] **User Preferences**
  - Theme selection (multiple dark/light themes)
  - Font size and family customization
  - Indentation preferences (2/4 spaces, tabs)
  - Auto-collapse depth for JSON/XML

- [ ] **Extension Settings Page**
  - Create dedicated settings UI
  - Import/export settings
  - Keyboard shortcut customization
  - Storage management (clear cache, etc.)

## Long-term Vision (Next Quarter)

### 1. Cloud Sync
- [ ] **Sync Across Devices**
  - Firefox Sync integration
  - Or implement custom cloud backend
  - Conflict resolution strategy
  - Privacy-first approach

### 2. AI Integration
- [ ] **Smart Features**
  - Auto-detect data structure and suggest schema
  - Explain complex JSON/XML structures
  - Generate sample data from schema
  - Code snippet suggestions

### 3. Developer Tools
- [ ] **API Testing**
  - Make HTTP requests and stash responses
  - Save API endpoint collections
  - Response comparison tool
  - Mock server integration

- [ ] **Code Generation**
  - Generate TypeScript interfaces from JSON
  - Generate XML schemas
  - Create code snippets for various languages

### 4. Platform Expansion
- [ ] **Chrome/Edge Support**
  - Migrate to Manifest V3
  - Use Chrome APIs (`chrome.*` namespace)
  - Replace background scripts with service workers
  - Test cross-browser compatibility

- [ ] **Mobile Support**
  - Firefox Mobile extension
  - Responsive design optimization
  - Touch-friendly interactions

## Technical Debt & Refactoring

### Current Known Issues
- None identified yet (pending testing)

### Future Refactoring Opportunities
- [ ] **Bundle Size Optimization**
  - Consider using Handlebars runtime-only build
  - Lazy-load highlight.js language definitions
  - Analyze and minimize bundle size

- [ ] **Module System**
  - Consider migrating to ES modules
  - Use bundler (Vite, Rollup, esbuild)
  - Implement proper dependency management

- [ ] **State Management**
  - Implement centralized state management
  - Consider using a lightweight state library
  - Add state persistence layer

## Commit Strategy

### Current Commit
```bash
git add .
git commit -m "feat: integrate htmx and Handlebars for declarative UI architecture

Replace imperative DOM manipulation with htmx+Handlebars templating system:
- Add htmx (47KB) and Handlebars (86KB) libraries
- Create 4 Handlebars templates for modular UI components
- Implement client-side routing via browser.runtime.sendMessage
- Add template loader with caching and custom helpers
- Refactor viewer.ts to use declarative rendering (~200 lines reduced)
- Add comprehensive architecture documentation (HTMX_HANDLEBARS.md)

Benefits:
- Cleaner separation of HTML templates and business logic
- Declarative interactions via HTML attributes
- Better maintainability and testability
- Type-safe rendering functions

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Future Commit Guidelines
- Use conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Keep commits atomic and focused
- Reference issues in commit messages when applicable
- Run `npm run lint` before committing

## Resources & References

### Documentation
- [htmx Documentation](https://htmx.org/docs/)
- [Handlebars Guide](https://handlebarsjs.com/guide/)
- [Firefox Extension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools
- [web-ext](https://github.com/mozilla/web-ext) - Extension development tool
- [Firefox DevTools](https://firefox-dev.tools/) - Browser debugging

### Community
- [r/firefox](https://reddit.com/r/firefox) - Firefox community
- [r/webextensions](https://reddit.com/r/webextensions) - Extension development

---

**Last Updated**: 2025-12-17
**Current Version**: 0.1.0
**Target Next Version**: 0.2.0 (with htmx + Handlebars)
