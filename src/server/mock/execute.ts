import { buildSchema, graphql, Kind, parse, type GraphQLSchema } from "graphql";
import { MOCK_MODE } from "../config";
import { rootValue, type MockContext } from "./resolvers";
import { EXISTING_SDL, PROPOSED_ROOT_FIELDS, PROPOSED_SDL } from "./schema";

export interface GraphQLRequestBody {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
}

let schema: GraphQLSchema | undefined;

function getSchema(): GraphQLSchema {
  schema ??= buildSchema(`${EXISTING_SDL}\n${PROPOSED_SDL}`);
  return schema;
}

/** Tên các root field của operation sẽ chạy; mảng rỗng nếu query không phân tích được. */
function rootFieldNames(body: GraphQLRequestBody): string[] {
  try {
    const operations = parse(body.query).definitions.filter(
      (d) => d.kind === Kind.OPERATION_DEFINITION,
    );
    const operation =
      operations.find((o) => o.name?.value === body.operationName) ?? operations[0];
    return (operation?.selectionSet.selections ?? []).flatMap((s) =>
      s.kind === Kind.FIELD ? [s.name.value] : [],
    );
  } catch {
    return [];
  }
}

/** Quyết định request đi vào lớp mock hay chuyển tiếp sang backend. */
export function shouldMock(body: GraphQLRequestBody): boolean {
  // Live-only operational reads never fall back to fabricated business records.
  const liveFields = rootFieldNames(body);
  if (liveFields.includes("adminOperationalRecords") || body.operationName === "AdminTypedSettings" || body.operationName === "AdminSaveTypedSettings") return false;
  if (MOCK_MODE === "all") return true;
  if (MOCK_MODE === "off") return false;
  // Never apply a simulated decision to an entity read from the real backend.
  if (liveFields.some((field) => ["adminSuspendUser", "adminUnsuspendUser", "adminCancelTrip", "adminForgiveViolation"].includes(field))) return false;
  const fields = rootFieldNames(body);
  return fields.length > 0 && fields.every((f) => PROPOSED_ROOT_FIELDS.has(f));
}

export async function executeMock(body: GraphQLRequestBody, context: MockContext) {
  return graphql({
    schema: getSchema(),
    source: body.query,
    rootValue,
    contextValue: context,
    variableValues: body.variables ?? undefined,
    operationName: body.operationName ?? undefined,
  });
}
