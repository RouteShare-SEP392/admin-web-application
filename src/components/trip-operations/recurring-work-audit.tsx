"use client";
import { gql, type TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import type { AuditFilter, CursorPage } from "@/lib/trip-operations.graphql";
import { isExistingApiMocked } from "@/lib/mock-mode";

interface Evidence {
  id: string;
  templateId: string;
  createdAt: string;
  resultJson?: string | null;
  notices: { inboxCount: number; providerAcceptedCount: number; readCount: number };
}
interface Work extends Evidence { kind: string; state: string; dates: string[]; attempts: number; lastErrorCode?: string | null }
interface Change extends Evidence { operation: string; actorName: string; beforeJson?: string | null; afterJson: string }
const QUERY: TypedDocumentNode<{
  adminRecurringWork: CursorPage<Work>;
  adminRecurringEnrollmentChanges: CursorPage<Change>;
}, { work: AuditFilter; changes: AuditFilter }> = gql`
  query RecurringOversight($work: TripAuditFilter, $changes: TripAuditFilter) {
    adminRecurringWork(filter: $work) {
      items { id templateId kind state dates attempts lastErrorCode createdAt resultJson notices { inboxCount providerAcceptedCount readCount } }
      hasNextPage endCursor
    }
    adminRecurringEnrollmentChanges(filter: $changes) {
      items { id templateId operation actorName createdAt beforeJson afterJson resultJson notices { inboxCount providerAcceptedCount readCount } }
      hasNextPage endCursor
    }
  }
`;
export function RecurringWorkAudit() {
  const mocked = isExistingApiMocked();
  const [work, setWork] = useState<string>();
  const [changes, setChanges] = useState<string>();
  const q = useQuery(QUERY, { variables: { work: { after: work }, changes: { after: changes } }, skip: mocked, fetchPolicy: "network-only" });
  if (mocked) return null;
  const workPage = q.data?.adminRecurringWork;
  const changePage = q.data?.adminRecurringEnrollmentChanges;
  return <section className="bg-white border border-line rounded-2xl p-5 space-y-4">
    <h2 className="font-semibold">Xử lý lịch và đăng ký định kỳ</h2>
    {q.loading && <p>Đang tải…</p>}
    {q.error && <button onClick={() => void q.refetch().catch(() => {})}>Không tải được lịch sử. Thử lại</button>}
    <h3 className="font-semibold">Công việc tự động</h3>
    {workPage?.items.map(row => <EvidenceRow key={row.id} row={row}
      title={row.kind + " · " + row.state} details={row.dates.join(", ") + " · Số lần chạy " + row.attempts + (row.lastErrorCode ? " · " + row.lastErrorCode : "")} />)}
    {workPage?.items.length === 0 && <p>Chưa có công việc.</p>}
    {workPage?.hasNextPage && <button onClick={() => setWork(workPage.endCursor ?? undefined)}>Trang công việc tiếp theo</button>}
    {work && <button onClick={() => setWork(undefined)}>Về trang công việc đầu</button>}
    <h3 className="font-semibold">Thay đổi đăng ký</h3>
    <p className="text-sm text-muted">Số thông báo được tính trên toàn bộ đăng ký.</p>
    {changePage?.items.map(row => <EvidenceRow key={row.id} row={row} title={row.operation + " · " + row.actorName}
      details={row.templateId} before={row.beforeJson} after={row.afterJson} />)}
    {changePage?.items.length === 0 && <p>Chưa có thay đổi.</p>}
    {changePage?.hasNextPage && <button onClick={() => setChanges(changePage.endCursor ?? undefined)}>Trang thay đổi tiếp theo</button>}
    {changes && <button onClick={() => setChanges(undefined)}>Về trang thay đổi đầu</button>}
  </section>;
}
function EvidenceRow({ row, title, details, before, after }: { row: Evidence; title: string; details: string; before?: string | null; after?: string }) {
  return <details className="border rounded-lg p-3">
    <summary className="cursor-pointer">{title} · {new Date(row.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</summary>
    <p>{details}</p>
    <p>Hộp thư {row.notices.inboxCount} · Nhà cung cấp chấp nhận {row.notices.providerAcceptedCount} · Đã đọc {row.notices.readCount}</p>
    {before && <><p>Trước thay đổi</p><pre className="whitespace-pre-wrap break-all">{before}</pre></>}
    {after && <><p>Sau thay đổi</p><pre className="whitespace-pre-wrap break-all">{after}</pre></>}
    {row.resultJson && <><p>Kết quả</p><pre className="whitespace-pre-wrap break-all">{row.resultJson}</pre></>}
  </details>;
}
