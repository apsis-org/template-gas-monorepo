export type FetchOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;
// biome-ignore lint/suspicious/noExplicitAny: the shape of external API responses is unknown
type ResponseData = any;

/**
 * Current date and time in the script's time zone
 * @returns "yyyy/MM/dd HH:mm:ss"
 */
export const getCurrentDate = () =>
  Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy/MM/dd HH:mm:ss",
  );

/**
 * Current month (1-12) in the script's time zone
 */
export const getCurrentMonth = () =>
  Number(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "M"));

/**
 * Calls an API and returns the parsed response with its status code.
 * Errors are logged and returned as status 500 instead of being thrown.
 * Use fetchJsonOrThrow in http.ts when the caller should handle failures.
 * @param url
 * @param options
 * @returns
 */
export const fetchData = (
  url: string,
  options: FetchOptions,
): {
  responseData: ResponseData;
  statusCode: number;
} => {
  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseData = JSON.parse(response.getContentText());

    if (statusCode === 200 || statusCode === 201) {
      Logger.log(`Success: ${JSON.stringify(responseData)}`);
    } else {
      Logger.log(`Error (${statusCode}): ${JSON.stringify(responseData)}`);
    }
    return { responseData, statusCode };
  } catch (error) {
    Logger.log(`Failure: ${error}`);
    return { responseData: null, statusCode: 500 };
  }
};
