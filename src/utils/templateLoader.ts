// Template cache to avoid re-fetching and re-compiling
const templateCache: Map<string, (context: any) => string> = new Map();

/**
 * Load and compile a Handlebars template from a .hbs file
 * @param templateName - Name of the template file (without .hbs extension)
 * @returns Compiled template function
 */
async function loadTemplate(templateName: string): Promise<(context: any) => string> {
  // Check cache first
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  try {
    // Fetch template file
    const templateUrl = browser.runtime.getURL(`src/templates/${templateName}.hbs`);
    const response = await fetch(templateUrl);

    if (!response.ok) {
      throw new Error(`Failed to load template: ${templateName}`);
    }

    const templateSource = await response.text();

    // Compile template
    const compiledTemplate = Handlebars.compile(templateSource);

    // Cache for future use
    templateCache.set(templateName, compiledTemplate);

    return compiledTemplate;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

/**
 * Register custom Handlebars helpers
 */
function registerHelpers(): void {
  // Helper to format uppercase
  Handlebars.registerHelper('upper', (str: string) => {
    return str ? str.toUpperCase() : '';
  });

  // Helper for conditional equality
  Handlebars.registerHelper('eq', (a: any, b: any) => {
    return a === b;
  });

  // Helper to stringify JSON for hx-vals
  Handlebars.registerHelper('json', (context: any) => {
    return JSON.stringify(context);
  });
}

// Initialize helpers on load
registerHelpers();
