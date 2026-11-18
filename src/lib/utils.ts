export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const TIME_ZONE = "Asia/Ho_Chi_Minh";

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormat = new Intl.NumberFormat("vi-VN");

export function formatDateTime(value: string | null | undefined): string {
  return value && Number.isFinite(Date.parse(value)) ? dateTimeFormat.format(new Date(value)) : "—";
}

export function formatDate(value: string | null | undefined): string {
  return value && Number.isFinite(Date.parse(value)) ? dateFormat.format(new Date(value)) : "—";
}

export function formatTime(value: string | null | undefined): string {
  return value && Number.isFinite(Date.parse(value)) ? timeFormat.format(new Date(value)) : "—";
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatCurrency(value: number): string {
  return Number.isFinite(value) ? `${numberFormat.format(value)}đ` : "—";
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} phút`;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}

/** Thông báo lỗi tiếng Việt để hiển thị cho quản trị viên. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    if (/Cannot query field|Unknown type|GRAPHQL_VALIDATION_FAILED/i.test(error.message)) return "Chức năng chưa tương thích với máy chủ. Vui lòng liên hệ quản trị hệ thống.";
    if (/SQL|column .* does not exist|relation .* does not exist|ECONN|fetch failed|Failed to fetch|Internal server error/i.test(error.message)) return "Không tải được dữ liệu từ máy chủ. Vui lòng thử lại sau.";
    return error.message;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const last = parts[parts.length - 1]?.[0] ?? "";
  const first = parts.length > 1 ? parts[0][0] : "";
  return `${first}${last}`.toUpperCase();
}
