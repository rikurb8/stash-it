/**
 * Route handler type for htmx requests
 */
type RouteHandler = (data: any) => Promise<{ html: string } | { error: string }>;

/**
 * Registered routes for htmx requests
 */
const routes: Map<string, RouteHandler> = new Map();

/**
 * Register a route handler
 */
function registerRoute(endpoint: string, handler: RouteHandler): void {
  routes.set(endpoint, handler);
}

/**
 * Handle an htmx request by routing to the appropriate handler
 */
async function handleRoute(endpoint: string, data: any): Promise<{ html: string } | { error: string }> {
  const handler = routes.get(endpoint);
  if (!handler) {
    return { error: `Unknown endpoint: ${endpoint}` };
  }
  return handler(data);
}

/**
 * Initialize htmx router
 * Intercepts htmx requests and routes them to registered handlers
 */
function initializeHtmxRouter(): void {
  // Configure htmx to work in extension context
  if (typeof htmx !== 'undefined') {
    htmx.config.selfRequestsOnly = false;
    htmx.config.allowEval = false;
  }

  // Listen for htmx requests
  document.body.addEventListener('htmx:beforeRequest', async (event: any) => {
    event.preventDefault(); // Prevent actual HTTP request

    const xhr = event.detail.xhr;
    const elt = event.detail.elt; // The element that triggered the request
    const target = event.detail.target;

    // Get the path from htmx attributes (hx-get, hx-post, hx-delete, etc.)
    const path = elt.getAttribute('hx-get') ||
                 elt.getAttribute('hx-post') ||
                 elt.getAttribute('hx-delete') ||
                 elt.getAttribute('hx-put') ||
                 elt.getAttribute('hx-patch');

    // Parse request data from hx-vals attribute
    let requestData: any = {};
    try {
      const hxVals = elt.getAttribute('hx-vals');
      if (hxVals) {
        requestData = JSON.parse(hxVals);
      }
    } catch (error) {
      console.error('Error parsing hx-vals:', error);
    }

    try {
      // Route to handler directly (no message passing needed)
      const response = await handleRoute(path, requestData);

      if ('error' in response) {
        throw new Error(response.error);
      }

      // Mock successful XHR response
      Object.defineProperty(xhr, 'status', { value: 200, writable: false });
      Object.defineProperty(xhr, 'response', { value: response.html, writable: false });
      Object.defineProperty(xhr, 'responseText', { value: response.html, writable: false });

      // Update target with response HTML
      if (target) {
        target.innerHTML = response.html;
        // Process any new htmx attributes in the swapped content
        htmx.process(target);
      }

    } catch (error) {
      console.error(`Error in htmx request for ${path}:`, error);
      if (target) {
        target.innerHTML = `<div class="error">Error: ${(error as Error).message}</div>`;
      }
    }
  });
}
