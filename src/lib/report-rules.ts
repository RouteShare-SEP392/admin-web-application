import type { Report } from "./types";

/** Báo cáo OPEN chờ quá số giờ này mà chưa ai nhận là quá hạn; khớp `overdueReports` của Tổng quan. */
export const REPORT_OVERDUE_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Số giờ báo cáo đã chờ nếu nó quá hạn, ngược lại null. Chỉ báo cáo OPEN mới
 * quá hạn được: đã có người nhận (UNDER_REVIEW) hoặc đã đóng thì không tính.
 */
export function overdueHours(
  report: Pick<Report, "status" | "createdAt">,
  now: number = Date.now(),
): number | null {
  if (report.status !== "OPEN") return null;
  const waited = Math.floor((now - Date.parse(report.createdAt)) / HOUR_MS);
  return waited >= REPORT_OVERDUE_HOURS ? waited : null;
}
