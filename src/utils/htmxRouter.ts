/**
 * Initialize htmx router
 * Intercepts htmx requests and sends them via browser.runtime.sendMessage()
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
    const path = event.detail.path;
    const target = event.detail.target;

    // Parse request data from hx-vals attribute
    let requestData: any = {};
    try {
      const hxVals = target.getAttribute('hx-vals');
      if (hxVals) {
        requestData = JSON.parse(hxVals);
      }
    } catch (error) {
      console.error('Error parsing hx-vals:', error);
    }

    try {
      // Send message to runtime API handler
      const response = await browser.runtime.sendMessage({
        type: 'htmx-request',
        endpoint: path,
        data: requestData
      });

      if (!response || response.error) {
        throw new Error(response?.error || 'No response from handler');
      }

      // Mock successful XHR response
      Object.defineProperty(xhr, 'status', { value: 200, writable: false });
      Object.defineProperty(xhr, 'response', { value: response.html, writable: false });
      Object.defineProperty(xhr, 'responseText', { value: response.html, writable: false });

      // Update target with response HTML
      target.innerHTML = response.html;

      // Process any new htmx attributes in the swapped content
      htmx.process(target);

    } catch (error) {
      console.error(`Error in htmx request for ${path}:`, error);
      target.innerHTML = `<div class="error">Error: ${(error as Error).message}</div>`;

      // Trigger error event
      event.detail.target.dispatchEvent(
        new CustomEvent('htmx:responseError', {
          detail: { xhr, target: event.detail.target, error }
        })
      );
    }
  });
}

/**
 * Dispatch a custom htmx request programmatically
 * @param endpoint - Route endpoint
 * @param data - Request data
 * @param target - Target element for response
 */
async function dispatchHtmxRequest(
  endpoint: string,
  data: any,
  target: HTMLElement
): Promise<void> {
  try {
    // Send message to runtime API handler
    const response = await browser.runtime.sendMessage({
      type: 'htmx-request',
      endpoint: endpoint,
      data: data
    });

    if (!response || response.error) {
      throw new Error(response?.error || 'No response from handler');
    }

    // Update target with response HTML
    target.innerHTML = response.html;
    htmx.process(target);

  } catch (error) {
    console.error(`Error in htmx request for ${endpoint}:`, error);
    target.innerHTML = `<div class="error">Error: ${(error as Error).message}</div>`;
  }
}
