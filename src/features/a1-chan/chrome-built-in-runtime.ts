/**
 * Compatibility facade for Chrome Built-in AI Runtime.
 * All modular implementations are housed in `./chrome-ai/`.
 */
export * from "./chrome-ai";
export { createChromeBuiltInRuntime as default } from "./chrome-ai";
