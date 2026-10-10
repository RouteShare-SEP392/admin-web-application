import { resolveMockMode } from "@/lib/mock-mode";

export { MOCK_ADMIN_CREDENTIALS } from "@/lib/mock-mode";

export const MOCK_MODE = resolveMockMode();

export const BACKEND_GRAPHQL_URL =
  process.env.BACKEND_GRAPHQL_URL ?? "http://localhost:3000/graphql";

export const SESSION_COOKIE = "rs_admin_token";

// Khớp JWT_EXPIRES_IN mặc định của backend (7 ngày).
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const MOCK_TOKEN_PREFIX = "mock:";
