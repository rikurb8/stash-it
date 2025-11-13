// Format XML content
// Requires xml-formatter library to be loaded globally as `xmlFormatter`

declare const xmlFormatter: (xml: string, options: {
  indentation: string;
  collapseContent: boolean;
  lineSeparator: string;
}) => string;

function formatXML(text: string): string {
  try {
    // xml-formatter is available as global `xmlFormatter`
    const formatted = xmlFormatter(text, {
      indentation: '  ',
      collapseContent: true,
      lineSeparator: '\n'
    });
    return formatted;
  } catch (error) {
    throw new Error(`Invalid XML: ${(error as Error).message}`);
  }
}
