import type { Tone } from "./labels";

export const PAYOUT_STATUS = {
  PENDING_REVIEW: { label: "Chờ duyệt", tone: "pending" },
  APPROVED: { label: "Đã duyệt · chưa chi", tone: "active" },
  AWAITING_FUNDS: { label: "Chờ bổ sung nguồn chi", tone: "pending" },
  PROCESSING: { label: "Đang chuyển", tone: "active" },
  RECONCILING: { label: "Đang đối soát", tone: "pending" },
  PAID: { label: "Đã chuyển", tone: "good" },
  REJECTED: { label: "Đã từ chối", tone: "bad" },
  FAILED: { label: "Chi thất bại đã xác nhận", tone: "bad" },
} satisfies Record<string, { label: string; tone: Tone }>;

export type PayoutStatus = keyof typeof PAYOUT_STATUS;
export interface PayoutPreview {
  id: string;
  driver: string;
  bank: string;
  account: string;
  holder: string;
  amount: number;
  status: PayoutStatus;
  reason?: string;
}

// Fictional design fixtures: never reuse real recipient details for a preview.
export const PAYOUT_PREVIEW: PayoutPreview[] = [
  { id: "MAU-001", driver: "Tài xế mẫu A", bank: "Techcombank", account: "DEMO-0001", holder: "TAI XE MAU A", amount: 90000, status: "PENDING_REVIEW" },
  { id: "MAU-002", driver: "Tài xế mẫu B", bank: "Vietcombank", account: "DEMO-0002", holder: "TAI XE MAU B", amount: 180000, status: "AWAITING_FUNDS" },
  { id: "MAU-003", driver: "Tài xế mẫu C", bank: "BIDV", account: "DEMO-0003", holder: "TAI XE MAU C", amount: 45000, status: "RECONCILING" },
];

export function reviewPreview(row: PayoutPreview, approved: boolean, reason: string): PayoutPreview {
  if (row.status !== "PENDING_REVIEW") return row;
  if (!approved && reason.trim().length < 5) return row;
  return { ...row, status: approved ? "APPROVED" : "REJECTED", reason: approved ? undefined : reason.trim() };
}
