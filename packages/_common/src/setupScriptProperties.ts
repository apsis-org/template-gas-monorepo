/**
 * Initial setup of script properties
 */

/**
 * Registers every script property that is not set yet with the value DUMMY.
 * Existing values are never overwritten.
 * @param properties A Record whose values are the property key names (e.g. SCRIPT_PROPERTIES)
 */
export const setupScriptProperties = (
  properties: Record<string, string>,
): void => {
  const scriptProperties = PropertiesService.getScriptProperties();
  const existing = scriptProperties.getProperties();

  const keysToSet = Object.values(properties).filter(
    (key) => !(key in existing),
  );

  if (keysToSet.length === 0) {
    Logger.log("[setupScriptProperties] All properties are already set.");
    return;
  }

  const newProperties = Object.fromEntries(
    keysToSet.map((key) => [key, "DUMMY"]),
  );
  // false = keep the existing properties
  scriptProperties.setProperties(newProperties, false);

  for (const key of keysToSet) {
    Logger.log(`[setupScriptProperties] Registered: ${key} = DUMMY`);
  }
  Logger.log(
    `[setupScriptProperties] Registered ${keysToSet.length} properties with DUMMY. Replace them with the real values.`,
  );
};
