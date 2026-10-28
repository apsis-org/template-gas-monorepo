import type { FetchOptions } from "./utils";

/**
 * Calls an API that returns JSON and returns the parsed response.
 * Throws an error with the beginning of the body when the status is not 200
 * (unlike fetchData, which swallows the error and returns statusCode).
 * @param url
 * @param options
 * @returns
 */
export const fetchJsonOrThrow = <T>(
  url: string,
  options: FetchOptions = {},
): T => {
  const res = UrlFetchApp.fetch(url, { ...options, muteHttpExceptions: true });
  const code = res.getResponseCode();
  if (code !== 200) {
    throw new Error(`HTTP ${code}: ${res.getContentText().slice(0, 300)}`);
  }
  return JSON.parse(res.getContentText()) as T;
};
