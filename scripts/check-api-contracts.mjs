import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { buildSchema, getOperationAST, parse, print, validate } from "graphql";

// Static contract check only: never executes queries, mutations or database writes.
const schemaPath = process.argv[2] ?? "../Backend/src/schema.gql";
const schema = buildSchema(fs.readFileSync(schemaPath, "utf8"));
let checked = 0;
let failed = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "server") walk(file);
      continue;
    }
    if (!/\.tsx?$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    if (!source.includes("gql`")) continue;
    const documents = [];
    const requireStub = (name) => name === "@apollo/client" ? {
      gql(strings, ...values) {
        const document = parse(strings.reduce((text, part, index) => text + part +
          (values[index] ? (values[index].kind ? print(values[index]) : values[index]) : ""), ""));
        documents.push(document);
        return document;
      },
    } : {};
    const js = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    try {
      const compiled = { exports: {} };
      new Function("require", "module", "exports", js)(requireStub, compiled, compiled.exports);
    } catch (error) {
      throw new Error(`Cannot extract GraphQL from ${file}`, { cause: error });
    }
    for (const document of documents) {
      if (!document.definitions.some((definition) => definition.kind === "OperationDefinition")) continue;
      checked++;
      const errors = validate(schema, document);
      if (errors.length) failed++;
      console.log(`${errors.length ? "FAIL" : "PASS"} ${getOperationAST(document)?.name?.value ?? file}`);
      for (const error of errors) console.error(error.message);
    }
  }
}
walk("src");
console.log(`${checked} operations checked; ${failed} failed.`);
if (failed || checked === 0) process.exitCode = 1;
