// Type declarations for global libraries loaded via script tags

declare const hljs: {
  highlightElement(element: HTMLElement): void;
};

declare const htmx: {
  process(element: HTMLElement): void;
  config: {
    selfRequestsOnly: boolean;
    allowEval: boolean;
  };
};

