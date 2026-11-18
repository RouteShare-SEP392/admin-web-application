"use client";
import { gql, type TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/ui/misc";
import { CONDUCT_RULES } from "@/lib/conduct-policy";
import { formatDateTime } from "@/lib/utils";

interface RecordItem { id: string; driverId: string; driverName: string; tripId: string; violationType: string; penaltyAction: string; affectedPassengersCount: number; penaltyUntil?: string | null; isForgiven: boolean; forgivenReason?: string | null; createdAt: string }
const HISTORY: TypedDocumentNode<{ adminConductHistory: { items: RecordItem[]; total: number } }, { page: number }> = gql`query AdminConductHistory($page: Int!) {
  adminConductHistory(page: $page) { total items { id driverId driverName tripId violationType penaltyAction affectedPassengersCount penaltyUntil isForgiven forgivenReason createdAt } }
}`;
const ACTIONS: Record<string, string> = { NONE: "Không áp dụng hạn chế", WARNING_SENT: "Đã cảnh cáo", SUSPENDED_24H: "Ngừng đăng chuyến 24 giờ", SUSPENDED_72H: "Ngừng đăng chuyến 72 giờ", REVOKED_DRIVER_LICENSE: "Thu hồi quyền tài xế, cần xét duyệt lại" };

export function ViolationsView() {
  const [tab, setTab] = useState("history");
  return <>
    <PageHeader title="Phản ánh và điểm tuân thủ" description="Quản lý cả tài xế và hành khách. Phản ánh chưa phải kết luận vi phạm." />
    <div className="mb-5 flex flex-wrap gap-3">{[["history", "Lịch sử hiện có"], ["cases", "Hồ sơ phản ánh"], ["rules", "Quy tắc và mức trừ"]].map(([value, label]) => <Button key={value} variant={tab === value ? "primary" : "secondary"} onClick={() => setTab(value)}>{label}</Button>)}</div>
    {tab === "history" ? <History /> : tab === "cases" ? <Card><CardHeader title="Xét phản ánh và khiếu nại" description="Chưa kích hoạt: Backend chưa có hồ sơ, bằng chứng, sổ điểm và quyết định xử lý." /><ol className="list-decimal space-y-3 p-8 text-sm"><li>Tiếp nhận, kiểm tra người liên quan và gộp report trùng.</li><li>Xác minh lịch hẹn, sự kiện và phản hồi hai bên.</li><li>Chọn mã vi phạm hoặc bác phản ánh; bắt buộc lý do.</li><li>Xem điểm trước/sau và hạn chế; không nhập tùy ý số điểm.</li><li>Lưu quyết định và thông báo cho người bị xử lý trong cùng giao dịch.</li><li>Xét khiếu nại bằng quyết định đảo, không xóa lịch sử.</li></ol><EmptyState title="Chưa có API xử lý phản ánh" description="Không hiển thị hồ sơ giả hoặc cho trừ điểm khi chưa có sổ điểm và cơ chế chống phạt trùng." /></Card> : <Rules />}
  </>;
}
function History() {
  const [page, setPage] = useState(1);
  const query = useQuery(HISTORY, { variables: { page }, fetchPolicy: "network-only" });
  if (query.loading) return <TableSkeleton />;
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const result = query.data?.adminConductHistory;
  return <div className="space-y-4"><Card className="p-5 text-sm">Đây là bằng chứng vi phạm tài xế theo cơ chế cũ, không phải điểm tuân thủ 12 điểm. Chưa chuyển đổi hoặc cộng thêm hình phạt. Hành khách chưa có sổ điểm.</Card>
    {!result?.items.length ? <Card><EmptyState title="Không có bản ghi" /></Card> : result.items.map((item) => <Card key={item.id} className="space-y-2 p-5 text-sm"><div className="flex flex-wrap justify-between gap-3"><Link className="font-semibold text-brand-700" href={`/users/${item.driverId}`}>{item.driverName}</Link><span>{formatDateTime(item.createdAt)}</span></div><p>{item.violationType === "NO_SHOW_WITH_PASSENGERS" ? "Không khởi hành khi có khách đã được xác nhận" : item.violationType === "EXPIRED_WITHOUT_PASSENGERS" ? "Chuyến hết hạn không có khách — không phạt" : "Loại chưa nhận diện"}</p><p>{ACTIONS[item.penaltyAction] ?? "Biện pháp chưa nhận diện"}{item.penaltyUntil ? ` · Đến ${formatDateTime(item.penaltyUntil)}` : ""}</p><p>Số khách được ghi nhận ảnh hưởng: {item.affectedPassengersCount}</p><p>{item.isForgiven ? `Đã được miễn xử lý: ${item.forgivenReason ?? "Chưa có lý do"}` : "Chưa có quyết định miễn xử lý"}</p><Link className="text-brand-700" href={`/trips/${item.tripId}`}>Xem chuyến liên quan</Link></Card>)}
    <div className="flex items-center gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page} · {result?.total ?? 0} bản ghi</span><Button variant="secondary" disabled={!result || page * 20 >= result.total} onClick={() => setPage(page + 1)}>Sau</Button></div></div>;
}
function Rules() {
  const [roleFilter, setRoleFilter] = useState("Hành khách");
  return <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="space-y-5"><div className="rounded-2xl bg-brand-900 p-5 text-white"><p className="text-xs text-brand-200">Khung điểm đề xuất</p><p className="mt-3 text-5xl font-semibold">12<span className="ml-2 text-sm font-normal text-brand-200">điểm</span></p><p className="mt-4 text-xs leading-6 text-brand-100">Cảnh báo ≤ 4 · Hết điểm chặn hoạt động mới. Chưa kích hoạt trừ điểm.</p></div><nav className="flex gap-2 lg:flex-col" aria-label="Vai trò áp dụng">{["Hành khách", "Tài xế", "Cả hai"].map((role) => <button key={role} type="button" aria-pressed={roleFilter === role} onClick={() => setRoleFilter(role)} className={`rs-settings-tab rounded-lg px-4 py-3 text-left text-sm ${roleFilter === role ? "bg-white font-semibold text-brand-800 shadow-sm" : "text-muted hover:bg-white"}`}>{role}</button>)}</nav></aside><section key={roleFilter} className="rs-record-enter space-y-3"><h2 className="mb-5 text-lg font-semibold">Quy tắc · {roleFilter}</h2>{CONDUCT_RULES.filter(([, role]) => role === roleFilter).map(([code, role, title, points, conditions]) => <details key={code} className="group overflow-hidden rounded-xl border border-line bg-white"><summary className="flex cursor-pointer list-none items-center gap-4 p-5"><span className="font-mono text-xs text-muted">{code}</span><span className="flex-1 text-sm font-medium">{title}</span><span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">−{points} điểm</span><span className="text-muted transition-transform group-open:rotate-45" aria-hidden>+</span></summary><div className="border-t border-line px-5 py-4 text-sm leading-6 text-muted"><p className="mb-2 text-xs font-medium">{role} · Đề xuất, chưa áp dụng</p>{conditions}</div></details>)}<p className="pt-3 text-xs leading-6 text-muted">Chỉ xử lý sau khi xác minh. Không nhân mức trừ theo số phản ánh; không phạt trùng hoặc tự đặt lại điểm.</p></section></div>;
}
