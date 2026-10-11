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

const shortDateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Ngày giờ rút gọn không có năm, dùng trong bảng hẹp. */
export function formatShortDateTime(value: string | null | undefined): string {
  return value ? shortDateTimeFormat.format(new Date(value)) : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFormat.format(new Date(value)) : "—";
}

export function formatDate(value: string | null | undefined): string {
  return value ? dateFormat.format(new Date(value)) : "—";
}

export function formatTime(value: string | null | undefined): string {
  return value ? timeFormat.format(new Date(value)) : "—";
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

const decimalFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

/** Số có tối đa một chữ số thập phân, theo cách viết tiếng Việt (86,4). */
export function formatDecimal(value: number): string {
  return decimalFormat.format(value);
}

/** Số có dấu để diễn tả mức thay đổi: "+4,2%", "−0,2 km", "0%". */
export function formatSigned(value: number, suffix: string): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${decimalFormat.format(Math.abs(value))}${suffix}`;
}

export function formatCurrency(value: number): string {
  return `${numberFormat.format(Math.round(value))}đ`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} phút`;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}

/** Thông báo lỗi tiếng Việt để hiển thị cho quản trị viên. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const last = parts[parts.length - 1]?.[0] ?? "";
  const first = parts.length > 1 ? parts[0][0] : "";
  return `${first}${last}`.toUpperCase();
}
