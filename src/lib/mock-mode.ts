/** Legacy callers are live-only on both server and client. */
export type MockMode = "all" | "missing" | "off";

export function resolveMockMode(): MockMode {
  return "off";
}

/** No environment-dependent rendering during hydration. */
export function isExistingApiMocked(): boolean {
  return false;
}

export function isProposedApiMocked(): boolean {
  return false;
}

/** Tài khoản đăng nhập khi NEXT_PUBLIC_API_MOCK=all (không cần chạy backend). */
export const MOCK_ADMIN_CREDENTIALS = {
  identifier: "admin@routeshare.vn",
  password: "Admin@123",
};
