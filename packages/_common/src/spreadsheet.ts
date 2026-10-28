export type SSheet = GoogleAppsScript.Spreadsheet.Sheet;
export type SRange = GoogleAppsScript.Spreadsheet.Range;

export const COL_NUM = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
  FIFTH: 5,
  SIXTH: 6,
  SEVENTH: 7,
  EIGHTH: 8,
  NINTH: 9,
  TENTH: 10,
  ELEVENTH: 11,
  TWELFTH: 12,
  THIRTEENTH: 13,
  FOURTEENTH: 14,
  FIFTEENTH: 15,
  SIXTEENTH: 16,
  SEVENTEENTH: 17,
  EIGHTEENTH: 18,
  NINETEENTH: 19,
  TWENTIETH: 20,
  TWENTY_FIRST: 21,
  TWENTY_SECOND: 22,
  TWENTY_THIRD: 23,
  TWENTY_FOURTH: 24,
  TWENTY_FIFTH: 25,
  TWENTY_SIXTH: 26,
  TWENTY_SEVENTH: 27,
  TWENTY_EIGHTH: 28,
  TWENTY_NINTH: 29,
  THIRTIETH: 30,
} as const;

export const NUM_ROWS = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  ELEVEN: 11,
  TWELVE: 12,
  THIRTEEN: 13,
  FOURTEEN: 14,
  FIFTEEN: 15,
  SIXTEEN: 16,
  SEVENTEEN: 17,
  EIGHTEEN: 18,
  NINETEEN: 19,
  TWENTY: 20,
} as const;

/**
 * Gets a sheet of the active spreadsheet by name
 * @param sheetName
 * @returns
 */
export const getSheet = (sheetName: string) =>
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName) as SSheet;

/**
 * Gets the value of a cell by row and column number
 * @param sheet
 * @param rowNum
 * @param colNum
 */
export const getValueSheetByNum = (
  sheet: SSheet,
  rowNum: number,
  colNum: number,
) => {
  return sheet.getRange(rowNum, colNum).getValue();
};

/**
 * Gets the values of a range in A1 notation
 * @param sheet
 * @param range
 */
export const getValuesSheetByRange = (sheet: SSheet, range: string) => {
  return sheet.getRange(range).getValues();
};

/**
 * Gets data rows as a 2D array
 * @param sheet
 * @param headerRowNum
 * @param startDataRowNum
 * @param rowCountNum
 * @param colCountNum
 * @returns
 */
export const getRowData2D = (
  sheet: SSheet,
  headerRowNum: number,
  startDataRowNum: number,
  rowCountNum?: number,
  colCountNum?: number,
) => {
  const rowNum = rowCountNum || sheet.getLastRow();
  const colNum = colCountNum || sheet.getLastColumn();
  // Number of data rows, excluding the header
  const dataRangeRowCount = rowNum - headerRowNum + 1;

  return sheet
    .getRange(startDataRowNum, COL_NUM.FIRST, dataRangeRowCount, colNum)
    .getValues() as string[][];
};

/**
 * Gets a script property (empty string when it is not set)
 * @param key
 * @returns
 */
export const getScriptPropertyValue = (key: string) => {
  return PropertiesService.getScriptProperties().getProperty(key) || "";
};

/**
 * Sets a script property
 * @param key
 * @param value
 */
export const setScriptPropertyValue = (key: string, value: string) => {
  PropertiesService.getScriptProperties().setProperty(key, value);
};

/**
 * Writes a value, a row, or a 2D array starting at the given cell.
 * Values are written as plain text so leading zeros are kept.
 * @param sheet
 * @param rowNum
 * @param colNum
 * @param post
 */
export const setValueSheetByNum = (
  sheet: SSheet,
  rowNum: number,
  colNum: number,
  // biome-ignore lint/suspicious/noExplicitAny: accepts any spreadsheet value
  post: string | number | boolean | any[][] | any[],
) => {
  if (
    typeof post === "string" ||
    typeof post === "number" ||
    typeof post === "boolean"
  ) {
    sheet.getRange(rowNum, colNum).setNumberFormat("@").setValue(post);
    return;
  }

  if (Array.isArray(post[0])) {
    // 2D array
    const rowLength = post.length;
    const colLength = post[0].length;
    sheet
      .getRange(rowNum, colNum, rowLength, colLength)
      .setNumberFormat("@")
      .setValues(post);
  } else {
    // 1D array: written as a single row
    const colLength = post.length;
    sheet
      .getRange(rowNum, colNum, NUM_ROWS.ONE, colLength)
      .setNumberFormat("@")
      .setValues([post]);
  }
};

/**
 * Writes a value or a 2D array to a range in A1 notation, as plain text
 * @param sheet
 * @param range
 * @param post
 */
export const setValuesSheetByRange = (
  sheet: SSheet,
  range: string,
  // biome-ignore lint/suspicious/noExplicitAny: accepts any spreadsheet value
  post: string | number | boolean | any[][],
) => {
  if (
    typeof post === "string" ||
    typeof post === "number" ||
    typeof post === "boolean"
  ) {
    sheet.getRange(range).setNumberFormat("@").setValue(post);
    return;
  }
  sheet.getRange(range).setNumberFormat("@").setValues(post);
};

/**
 * Clears the contents of a range
 * @param sheet
 * @param row
 * @param column
 * @param numRows
 * @param numColumns
 */
export const clearSheetContent = (
  sheet: SSheet,
  row: number,
  column: number,
  numRows: number,
  numColumns: number,
) => {
  sheet.getRange(row, column, numRows, numColumns).clearContent();
};

/**
 * Converts a column letter to its number
 * @param columnLetter - e.g. "A", "Z", "AA"
 * @returns The column number, starting at 1
 * @example
 * columnLetterToNumber("A") // => 1
 * columnLetterToNumber("Z") // => 26
 * columnLetterToNumber("AA") // => 27
 * columnLetterToNumber("BT") // => 72
 */
export const columnLetterToNumber = (columnLetter: string): number => {
  let result = 0;
  const upper = columnLetter.toUpperCase();

  for (let i = 0; i < upper.length; i++) {
    const charCode = upper.charCodeAt(i) - 64; // A=1, B=2, ..., Z=26
    result = result * 26 + charCode;
  }

  return result;
};

/**
 * Converts a row and column number to A1 notation
 * @param row - starting at 1
 * @param column - starting at 1
 * @returns e.g. "A4", "B10"
 */
export const getCellNotation = (row: number, column: number): string => {
  let columnLetter = "";
  let col = column;

  while (col > 0) {
    col--;
    columnLetter = String.fromCharCode(65 + (col % 26)) + columnLetter;
    col = Math.floor(col / 26);
  }

  return `${columnLetter}${row}`;
};

/**
 * Shows an HTML file as a modal dialog
 * @param fileName
 * @param title
 */
export const showModalDialog = (fileName: string, title: string) => {
  const htmlOutput = HtmlService.createHtmlOutputFromFile(fileName)
    .setWidth(400)
    .setHeight(300);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
};

export type HeaderStyle = {
  background: string;
  fontColor: string;
};

export type GetOrCreateSheetOptions = {
  /** Header row written to row 1 of a new sheet (bold, frozen) */
  headers?: string[];
  headerStyle?: HeaderStyle;
  /** Hide the sheet when it is newly created */
  hidden?: boolean;
};

const DEFAULT_HEADER_STYLE: HeaderStyle = {
  background: "#3B4A6B",
  fontColor: "#FFFFFF",
};

/**
 * Gets a sheet, creating it when missing (options apply only on creation)
 * @param sheetName
 * @param options
 * @returns
 */
export const getOrCreateSheet = (
  sheetName: string,
  options: GetOrCreateSheetOptions = {},
): SSheet => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = ss.getSheetByName(sheetName);
  if (existing) return existing;

  const sheet = ss.insertSheet(sheetName);
  const { headers, headerStyle = DEFAULT_HEADER_STYLE, hidden } = options;
  if (headers?.length) {
    sheet
      .getRange(1, COL_NUM.FIRST, NUM_ROWS.ONE, headers.length)
      .setValues([headers])
      .setFontWeight("bold")
      .setBackground(headerStyle.background)
      .setFontColor(headerStyle.fontColor);
    sheet.setFrozenRows(1);
  }
  if (hidden) sheet.hideSheet();
  return sheet;
};

/**
 * Sets number formats per column
 * @param sheet
 * @param startRow
 * @param numRows
 * @param formats Column number (from 1) → format (e.g. { 1: "yyyy/mm/dd", 5: "0.0%" })
 */
export const applyNumberFormats = (
  sheet: SSheet,
  startRow: number,
  numRows: number,
  formats: Record<number, string>,
) => {
  for (const [col, format] of Object.entries(formats)) {
    sheet.getRange(startRow, Number(col), numRows, 1).setNumberFormat(format);
  }
};
