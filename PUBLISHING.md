# Publishing Guide for Stash It Firefox Extension

This guide covers everything you need to know about packaging, signing, and publishing the Stash It extension to Mozilla Add-ons (AMO).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Building the Extension](#building-the-extension)
- [Testing Before Publishing](#testing-before-publishing)
- [Publishing to Mozilla Add-ons (AMO)](#publishing-to-mozilla-add-ons-amo)
- [Updating the Extension](#updating-the-extension)
- [Automated Signing](#automated-signing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you can publish the extension, you'll need:

1. **Firefox Developer Account**
   - Create an account at https://addons.mozilla.org/
   - Verify your email address

2. **Node.js and npm**
   - Install Node.js (v14 or higher recommended)
   - npm comes bundled with Node.js
   - Verify installation: `node --version` and `npm --version`

3. **web-ext Tool** (Installed via npm)
   - This will be installed automatically when you run `npm install`

## Initial Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

   This installs `web-ext`, Mozilla's official command-line tool for building and testing extensions.

2. **Verify Installation**

   ```bash
   npm run lint
   ```

   This should validate your extension without errors.

## Building the Extension

### Method 1: Using npm Scripts (Recommended)

```bash
# Build the extension
npm run build
```

This creates a `.zip` file in the `web-ext-artifacts/` directory. The file will be named something like `stash_it-0.1.0.zip`.

### Method 2: Manual Build

If you prefer to build manually:

```bash
# Using web-ext directly
npx web-ext build --overwrite-dest

# Or using zip
zip -r stash-it.xpi . -x '*.git*' 'node_modules/*' 'web-ext-artifacts/*' '*.md'
```

### What Gets Included?

The build process includes:
- `manifest.json`
- `background.js`
- `viewer.html`, `viewer.js`, `viewer.css`
- `icons/` directory
- `lib/` directory (bundled libraries)

And excludes:
- `.git/` directory
- `node_modules/`
- Documentation files (`*.md`)
- Package configuration files

## Testing Before Publishing

### 1. Lint the Extension

Always lint before publishing to catch errors:

```bash
npm run lint
```

Fix any errors or warnings reported.

### 2. Test Locally

Load the built extension in Firefox:

```bash
npm start
```

This opens Firefox with your extension loaded temporarily. Test all functionality:
- Context menu appears on text selection
- JSON formatting works correctly
- XML formatting works correctly
- Syntax highlighting is applied
- Error messages display properly

### 3. Test the Built Package

Manually install the built `.zip` file:

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select the `.zip` file from `web-ext-artifacts/`
4. Test thoroughly

## Publishing to Mozilla Add-ons (AMO)

### First-Time Submission

1. **Prepare Your Listing Information**

   Before submitting, prepare:
   - Extension name: "Stash It"
   - Summary (250 characters max): Brief description of functionality
   - Description: Detailed feature list and usage instructions
   - Category: Developer Tools or Productivity
   - Screenshots: 2-3 screenshots showing the extension in action
   - Privacy policy (if applicable)
   - Support email or URL

2. **Build the Extension**

   ```bash
   npm run build
   ```

3. **Submit to AMO**

   a. Go to https://addons.mozilla.org/developers/addon/submit/

   b. Click "Submit a New Add-on"

   c. Choose distribution channel:
      - **On this site**: Public listing (recommended for most users)
      - **On your own**: Self-distributed (you manage distribution)

   d. Upload your `.zip` file from `web-ext-artifacts/`

   e. Fill in all required information:
      - Name and description
      - Version notes (what's new in this version)
      - Categories and tags
      - Screenshots (PNG or JPG, at least 640x480)
      - Privacy policy and license

   f. Submit for review

4. **Source Code Submission**

   If your extension uses minified code or build tools, Mozilla may request your source code. Prepare a source package:

   ```bash
   npm run package:source
   ```

   This creates `stash-it-source.zip` in the parent directory. Include a `README.md` in the source package explaining:
   - How to install dependencies
   - How to build the extension
   - Any special requirements

5. **Review Process**

   - **Automated Review**: Most extensions are reviewed automatically within minutes
   - **Manual Review**: Some extensions require manual review (1-2 weeks)
   - **Common Issues**:
     - Missing or unclear permissions
     - Minified code without source
     - Security vulnerabilities
     - Policy violations

6. **After Approval**

   Once approved, your extension will be:
   - Listed on addons.mozilla.org
   - Signed by Mozilla
   - Available for users to install
   - Automatically updated on users' browsers

## Updating the Extension

### Version Numbering

Follow semantic versioning (semver):
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

### Update Process

1. **Update manifest.json**

   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Update package.json**

   ```json
   {
     "version": "1.0.1"
   }
   ```

3. **Test Thoroughly**

   ```bash
   npm run lint
   npm start
   ```

4. **Build New Version**

   ```bash
   npm run build
   ```

5. **Submit Update**

   - Go to https://addons.mozilla.org/developers/addons
   - Click on your extension
   - Click "Upload New Version"
   - Upload the new `.zip` file
   - Add version notes describing changes
   - Submit for review

6. **Automatic Updates**

   Once approved, users will automatically receive the update within 24 hours.

## Automated Signing

For self-hosted or automated deployments, you can use API credentials to sign your extension automatically.

### Setup API Credentials

1. Go to https://addons.mozilla.org/developers/addon/api/key/
2. Generate new credentials (API Key and Secret)
3. **Keep these secret!** Never commit them to git.

### Set Environment Variables

```bash
export WEB_EXT_API_KEY="your-api-key"
export WEB_EXT_API_SECRET="your-api-secret"
```

Or create a `.env` file (add to `.gitignore`):

```bash
WEB_EXT_API_KEY=your-api-key
WEB_EXT_API_SECRET=your-api-secret
```

### Sign the Extension

```bash
npm run sign
```

This will:
- Submit your extension to AMO
- Get it automatically signed
- Download the signed `.xpi` file

**Note**: This is primarily for self-hosted extensions. For public AMO listings, use the web interface.

## Troubleshooting

### Build Errors

**Problem**: `web-ext: command not found`

```bash
# Solution: Install dependencies
npm install
```

**Problem**: Build includes unwanted files

```bash
# Solution: Update .web-ext-config.js ignoreFiles array
```

### Validation Errors

**Problem**: "Invalid manifest.json"

- Check JSON syntax: https://jsonlint.com/
- Verify required fields are present
- Ensure version format is correct (e.g., "1.0.0")

**Problem**: "Icon file not found"

- Verify icon paths in manifest.json
- Ensure icon files exist in the icons/ directory

### AMO Submission Issues

**Problem**: Stuck in manual review

- Check email for requests from reviewers
- Respond promptly to any questions
- Provide source code if requested

**Problem**: Rejected for minified code

```bash
# Solution: Provide source package
npm run package:source
```

Include build instructions in the source package.

**Problem**: Privacy policy required

- Add privacy policy to listing
- Explain what data you collect (if any)
- For this extension: "No user data is collected or transmitted"

### Signing Errors

**Problem**: API key authentication failed

- Verify credentials are correct
- Check that credentials haven't expired
- Generate new credentials if needed

**Problem**: Extension already exists

- Use the update process instead
- Or use a different extension ID

## Best Practices

1. **Version Control**
   - Tag releases in git: `git tag v1.0.0`
   - Keep CHANGELOG.md updated
   - Use semantic versioning

2. **Testing**
   - Test on multiple Firefox versions
   - Test on different operating systems
   - Get beta testers before major releases

3. **Documentation**
   - Keep README.md updated
   - Document breaking changes
   - Provide migration guides for major versions

4. **Security**
   - Never commit API credentials
   - Review all dependencies regularly
   - Use minimal required permissions
   - Follow Mozilla's security guidelines

5. **Communication**
   - Respond to user reviews
   - Maintain a support channel (email, GitHub issues)
   - Announce major changes in advance

## Useful Links

- **Mozilla Add-ons Developer Hub**: https://addons.mozilla.org/developers/
- **Extension Workshop**: https://extensionworkshop.com/
- **web-ext Documentation**: https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/
- **Manifest.json Documentation**: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json
- **AMO Policies**: https://extensionworkshop.com/documentation/publish/add-on-policies/
- **Submission Guidelines**: https://extensionworkshop.com/documentation/publish/submitting-an-add-on/

## Getting Help

- **Mozilla Add-ons Community**: https://discourse.mozilla.org/c/add-ons/35
- **MDN Web Docs**: https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions
- **Stack Overflow**: Tag questions with `firefox-addon` and `webextensions`

## Checklist Before Publishing

- [ ] All functionality tested and working
- [ ] `npm run lint` passes without errors
- [ ] Version number updated in manifest.json and package.json
- [ ] CHANGELOG.md updated with changes
- [ ] Screenshots prepared (2-3 images)
- [ ] Description and summary written
- [ ] Privacy policy prepared (if needed)
- [ ] Support email/URL ready
- [ ] Source code package prepared (if using build tools)
- [ ] Extension built: `npm run build`
- [ ] Built package tested in Firefox
- [ ] Git changes committed and tagged

Ready to publish? Go to https://addons.mozilla.org/developers/ and follow the submission process!
