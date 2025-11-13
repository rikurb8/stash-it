// Storage keys
const STORAGE_KEYS = {
  FORMATTER_CONTENT: 'formatterContent',
  FORMAT_HISTORY: 'formatHistory',
  TIMESTAMP: 'timestamp'
} as const;

// Format types
const FORMAT_TYPES = {
  JSON: 'json',
  XML: 'xml'
} as const;

// Context menu IDs
const MENU_IDS = {
  STASH_IT: 'stash-it'
} as const;

type FormatType = typeof FORMAT_TYPES[keyof typeof FORMAT_TYPES];
