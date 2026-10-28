/**
 * Trigger utilities
 */

/**
 * Deletes the existing triggers of the function, then creates one that runs daily during the given hour.
 * Triggers of other functions are left untouched.
 * @param functionName
 * @param hour 0-23
 */
export const recreateDailyTrigger = (
  functionName: string,
  hour: number,
): void => {
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  ScriptApp.newTrigger(functionName)
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .create();
};
