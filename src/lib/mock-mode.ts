/**
 * Chế độ mock API, đặt qua NEXT_PUBLIC_API_MOCK:
 * - all:     mọi thao tác (kể cả đăng nhập) chạy trên dữ liệu mẫu, không cần backend.
 * - missing: thao tác backend đã có thì gọi thật, thao tác chưa có thì dùng dữ liệu mẫu.
 * - off:     gọi backend cho mọi thao tác.
 */
export type MockMode = "all" | "missing" | "off";

export function resolveMockMode(): MockMode {
  const raw = process.env.NEXT_PUBLIC_API_MOCK;
  return raw === "missing" || raw === "off" ? raw : "all";
}

/** Trang chỉ dùng API backend đã có: chỉ là dữ liệu mẫu khi mock toàn bộ. */
export function isExistingApiMocked(): boolean {
  return resolveMockMode() === "all";
}

/** Trang dùng API admin backend chưa có: dữ liệu mẫu trừ khi tắt mock. */
export function isProposedApiMocked(): boolean {
  return resolveMockMode() !== "off";
}

/** Tài khoản đăng nhập khi NEXT_PUBLIC_API_MOCK=all (không cần chạy backend). */
export const MOCK_ADMIN_CREDENTIALS = {
  identifier: "admin@routeshare.vn",
  password: "Admin@123",
};
