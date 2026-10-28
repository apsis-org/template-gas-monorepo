/**
 * Sample project: adds a menu to the spreadsheet and writes a greeting to the active cell.
 * Replace this with your own code, or delete packages/sample once you have a project of your own.
 */

import { logInfo } from "../../_common/src/logger";
import { getCurrentDate } from "../../_common/src/utils";
import { buildGreeting } from "./greeting";

/** Runs when the spreadsheet is opened */
function onOpen(): void {
  SpreadsheetApp.getUi()
    .createMenu("Sample")
    .addItem("Write a greeting", "writeGreeting")
    .addToUi();
}

/** Writes a greeting to the active cell */
function writeGreeting(): void {
  const name = Session.getActiveUser().getEmail() || "there";
  const message = buildGreeting(name, getCurrentDate());
  SpreadsheetApp.getActiveRange().setValue(message);
  logInfo("Wrote a greeting", { message });
}

// Expose the functions to the Apps Script global scope
declare const global: { [x: string]: unknown };

global.onOpen = onOpen;
global.writeGreeting = writeGreeting;
