/**
 * Builds the greeting text.
 * Kept free of Apps Script services so it can be tested with Vitest.
 * @param name
 * @param date
 * @returns
 */
export const buildGreeting = (name: string, date: string): string =>
  `Hello, ${name}! (${date})`;
