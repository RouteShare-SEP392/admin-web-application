import { rootValue as coreResolvers } from "./resolvers";
import { operationsResolvers } from "./resolvers-operations";

/** Toàn bộ resolver của lớp mock, theo tên root field trong schema. */
export const rootValue = { ...coreResolvers, ...operationsResolvers };
