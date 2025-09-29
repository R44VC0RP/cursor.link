/**
 * Utility functions for generating Cursor deeplinks
 * Based on the Cursor deeplink documentation
 */

const MAX_URL_LENGTH = 8000;

/**
 * Generates a Cursor app deeplink for a prompt
 * @param promptText The text to pre-fill in the chat
 * @returns Cursor app deeplink URL
 */
export function generatePromptDeeplink(promptText: string): string {
  const url = new URL('cursor://anysphere.cursor-deeplink/prompt');
  url.searchParams.set('text', promptText);
  
  // Check URL length limit
  if (url.toString().length > MAX_URL_LENGTH) {
    throw new Error(`Deeplink URL exceeds maximum length of ${MAX_URL_LENGTH} characters`);
  }
  
  return url.toString();
}

/**
 * Generates a web-based Cursor deeplink for a prompt (works in browsers)
 * @param promptText The text to pre-fill in the chat
 * @returns Web-based Cursor deeplink URL
 */
export function generateWebPromptDeeplink(promptText: string): string {
  const url = new URL('https://cursor.com/link/prompt');
  url.searchParams.set('text', promptText);
  
  // Check URL length limit
  if (url.toString().length > MAX_URL_LENGTH) {
    throw new Error(`Deeplink URL exceeds maximum length of ${MAX_URL_LENGTH} characters`);
  }
  
  return url.toString();
}

/**
 * Formats a cursor rule into a prompt suitable for deeplinks
 * @param title The rule title
 * @param content The rule content
 * @returns Formatted prompt text
 */
export function formatRuleAsPrompt(title: string, content: string): string {
  return `Apply this cursor rule: "${title}"

${content}`;
}

/**
 * Checks if a prompt text would exceed URL length limits when encoded
 * @param promptText The prompt text to check
 * @returns Whether the prompt would fit in a deeplink URL
 */
export function isPromptValidForDeeplink(promptText: string): boolean {
  try {
    generateWebPromptDeeplink(promptText);
    return true;
  } catch {
    return false;
  }
}