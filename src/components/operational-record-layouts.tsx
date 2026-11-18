"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowRight, CheckCheck, Clock3, Mail, Ticket } from "lucide-react";
import { ReviewFeedback } from "./review-feedback";
import { formatDateTime } from "@/lib/utils";

export interface OperationalRow { id: string; reference: string; subject: string; status: string; amount: string | null; detail: string | null; createdAt: string }
const STATUS: Record<string, string> = {
  PENDING: "Chờ xử lý", CONFIRMED: "Đã xác nhận", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy",
  REJECTED: "Từ chối", EXPIRED: "Hết hạn", PAID: "Đã thanh toán", READ: "Đã đọc", UNREAD: "Chưa đọc",
  AS_DRIVER: "Đánh giá tài xế", AS_PASSENGER: "Đánh giá hành khách",
};
function State({ value }: { value: string }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${["PAID", "CONFIRMED", "COMPLETED", "READ"].includes(value) ? "bg-brand-50 text-brand-800" : ["PENDING", "UNREAD"].includes(value) ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-muted"}`}>{STATUS[value] ?? value}</span>;
}
function Money({ value }: { value: string | null }) {
  // Keep the API's decimal string intact, including when it cannot be parsed safely.
  return <span className="font-mono font-semibold tabular-nums">{value === null ? "Chưa có số tiền" : `${value} VND`}</span>;
}

export function OperationalRecordLayouts({ section, rows }: { section: string; rows: OperationalRow[] }) {
  if (section === "notifications") return <NotificationInbox rows={rows} />;
  if (section === "reviews") return <ReviewFeedback rows={rows} />;
  if (section === "bookings") return <div className="grid gap-5 bg-gray-50/50 p-5 lg:grid-cols-2">{rows.map((row) => <article key={row.id} className="rs-record-enter overflow-hidden rounded-xl border border-line bg-white"><header className="flex items-center justify-between gap-3 px-5 py-4"><span className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted"><Ticket className="size-4 shrink-0" aria-hidden /><span className="truncate" title={row.reference}>{row.reference}</span></span><State value={row.status} /></header><div className="px-5 pb-5"><h2 className="text-base font-semibold">{row.subject}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{row.detail ?? "Chưa có thông tin bổ sung."}</p></div><footer className="rs-ticket-edge flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line bg-gray-50/50 px-5 py-4"><span className="text-xs text-muted">{formatDateTime(row.createdAt)}</span><span className="text-sm"><Money value={row.amount} /></span></footer></article>)}</div>;
  return <div className="p-5"><div className="mb-5 flex items-center gap-3 rounded-xl bg-brand-50/60 p-4"><ArrowDownLeft className="size-5 text-brand-700" aria-hidden /><div><h2 className="text-sm font-semibold">Giao dịch thu payOS</h2><p className="mt-1 text-xs text-muted">Kết quả thanh toán theo từng lần thử</p></div></div><div className="divide-y divide-line">{rows.map((row) => <article key={row.id} className="rs-record-enter grid gap-4 py-5 md:grid-cols-[32px_minmax(0,1fr)_auto]"><span className="hidden size-8 items-center justify-center rounded-full border border-line text-muted md:flex"><ArrowDownLeft className="size-4" aria-hidden /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="text-sm font-semibold">{row.subject}</h3><State value={row.status} /></div><p className="mt-2 break-all font-mono text-xs text-muted">{row.reference}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted">{row.detail ?? "—"}</p></div><div className="md:text-right"><Money value={row.amount} /><p className="mt-2 text-xs text-muted">{formatDateTime(row.createdAt)}</p></div></article>)}</div></div>;
}

function NotificationInbox({ rows }: { rows: OperationalRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  return <div className="grid min-h-[480px] lg:grid-cols-[minmax(240px,2fr)_minmax(0,3fr)]">
    <div className="max-h-[65dvh] overflow-y-auto border-b border-line lg:border-r lg:border-b-0" aria-label="Thông báo">
      {rows.map((row) => <button key={row.id} type="button" aria-pressed={selected?.id === row.id} onClick={() => setSelectedId(row.id)} className={`rs-review-queue-item block w-full border-b border-line/70 border-l-2 p-5 text-left ${selected?.id === row.id ? "border-l-brand-700 bg-brand-50/50" : "border-l-transparent hover:bg-gray-50"}`}>
        <span className="flex items-center gap-2 text-xs text-muted">{row.status === "UNREAD" ? <span className="size-1.5 rounded-full bg-brand-600" /> : <CheckCheck className="size-3" aria-hidden />}Người nhận: {row.subject}<span className="sr-only"> · {STATUS[row.status] ?? row.status}</span></span>
        <span className="mt-2 block truncate text-sm font-semibold">{row.detail ?? row.reference}</span><span className="mt-2 block text-xs text-muted">{formatDateTime(row.createdAt)}</span>
      </button>)}
    </div>
    {selected ? <article key={selected.id} className="rs-record-enter min-w-0 break-words p-6 sm:p-8">
      <div className="mb-8 flex items-center justify-between"><Mail className="size-6 text-brand-600" aria-hidden /><State value={selected.status} /></div>
      <h2 className="text-lg font-semibold">{selected.detail ?? "Chưa có tiêu đề"}</h2><p className="mt-3 text-sm text-muted">Người nhận: {selected.subject}</p>
      <p className="mt-5 text-sm text-muted">API hiện chỉ cung cấp tiêu đề, chưa có nội dung đầy đủ.</p>
      <dl className="mt-10 space-y-4 border-t border-line pt-5 text-xs text-muted"><div className="flex gap-2"><Clock3 className="size-3.5 shrink-0" aria-hidden /><dt className="sr-only">Thời điểm</dt><dd>{formatDateTime(selected.createdAt)}</dd></div><div className="flex gap-2"><ArrowRight className="size-3.5 shrink-0" aria-hidden /><dt className="sr-only">Tham chiếu</dt><dd className="break-all">{selected.reference}</dd></div></dl>
      <p className="mt-6 text-xs text-muted">Chỉ xem lịch sử. Mở tại đây không đổi trạng thái đã đọc của người nhận.</p>
    </article> : null}
  </div>;
}
