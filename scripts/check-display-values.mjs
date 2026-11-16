import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";

const js = ts.transpileModule(fs.readFileSync("src/lib/utils.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const compiled = { exports: {} };
new Function("module", "exports", js)(compiled, compiled.exports);
const { formatCurrency, formatDateTime, formatDate, formatTime, errorMessage } = compiled.exports;
assert.equal(formatCurrency(15469.25), "15.469,25đ");
assert.equal(formatCurrency(0), "0đ");
assert.equal(formatCurrency(NaN), "—");
for (const format of [formatDateTime, formatDate, formatTime]) {
  for (const input of [null, undefined, "", "invalid-date"]) assert.equal(format(input), "—");
}
assert.equal(formatTime("2026-11-15T00:00:00Z"), "07:00");
assert.ok(!errorMessage(new Error('Cannot query field "privateField"')).includes("privateField"));
assert.ok(!errorMessage(new Error('column secret_table does not exist')).includes("secret_table"));
console.log("Display value regression checks passed.");
