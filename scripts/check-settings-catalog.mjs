import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";
const compile = (file) => {
  const compiled = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function("exports", js)(compiled.exports);
  return compiled.exports;
};
const { SETTINGS_CATALOG, SETTING_KEYS, validateSettings } = compile("src/lib/settings-catalog.ts");
const backend = fs.readFileSync("../Backend/src/modules/settings/settings.registry.ts", "utf8");
// Inspect registry literals without importing Nest or connecting to the database.
const literal = backend.slice(backend.indexOf("export const SETTINGS_REGISTRY"), backend.indexOf("export type SettingField"));
const registry = { exports: {} };
new Function("exports", ts.transpileModule(literal, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(registry.exports);
const rules = registry.exports.SETTINGS_REGISTRY;
assert.deepEqual([...SETTING_KEYS].sort(), Object.keys(rules).sort());
const values = Object.fromEntries(SETTING_KEYS.map((key) => [key, rules[key].defaultValue]));
assert.equal(validateSettings(values), null);
for (const key of SETTING_KEYS) {
  assert.ok(validateSettings({ ...values, [key]: NaN }));
  assert.ok(validateSettings({ ...values, [key]: -1 }));
  if (SETTINGS_CATALOG[key].max !== undefined) assert.equal(SETTINGS_CATALOG[key].max, rules[key].max);
}
assert.ok(validateSettings({ ...values, platformFeePercent: 10.123 }));
assert.ok(validateSettings({ ...values, minCostPerKm: 3000 }));
assert.ok(validateSettings({ ...values, activeStationarySeconds: 30 }));
assert.ok(validateSettings({ ...values, activeProximityMeters: 50, activeGpsAccuracyMeters: 100 }));
console.log(`Settings catalog checks passed: ${SETTING_KEYS.length} editable fields match Backend registry.`);
