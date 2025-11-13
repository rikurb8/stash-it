// Format JSON content
function formatJSON(text: string): string {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error(`Invalid JSON: ${(error as Error).message}`);
  }
}
