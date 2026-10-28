/**
 * Date utilities
 * Dates are passed around as 'YYYY-MM-DD' strings
 */

/**
 * Formats a Date as 'YYYY-MM-DD' in the given time zone
 * @param date
 * @param tz
 * @returns
 */
export const formatYmd = (date: Date, tz: string): string =>
  Utilities.formatDate(date, tz, "yyyy-MM-dd");

/**
 * 'YYYY-MM-DD' or 'YYYYMMDD' → a Date at midnight of that day (script time zone)
 * @param s
 * @returns
 */
export const parseYmd = (s: string): Date => {
  const p = String(s).replace(/-/g, "");
  return new Date(
    Number(p.slice(0, 4)),
    Number(p.slice(4, 6)) - 1,
    Number(p.slice(6, 8)),
  );
};

/**
 * Adds n days to 'YYYY-MM-DD' (calculated in the script time zone)
 * @param s
 * @param n
 * @returns
 */
export const addDaysYmd = (s: string, n: number): string => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return formatYmd(d, Session.getScriptTimeZone());
};

/**
 * Adds n days to 'YYYY-MM-DD' (a UTC date)
 * @param s
 * @param n
 * @returns
 */
export const addDaysYmdUtc = (s: string, n: number): string => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return formatYmd(d, "UTC");
};
