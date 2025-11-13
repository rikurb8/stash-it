// Detect if content is JSON or XML
function detectFormat(text: string): 'json' | 'xml' {
  const trimmed = text.trim();

  // Check if it starts with JSON characters
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json';
  }

  // Check if it starts with XML declaration or tags
  if (trimmed.startsWith('<?xml') ||
      (trimmed.startsWith('<') && trimmed.includes('>'))) {
    return 'xml';
  }

  // Try to parse as JSON as fallback
  try {
    JSON.parse(trimmed);
    return 'json';
  } catch (e) {
    // If JSON parse fails, assume XML
    return 'xml';
  }
}
