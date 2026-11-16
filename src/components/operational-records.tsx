"use client";

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { Input } from "./ui/field";
import { Card, EmptyState, ErrorState, TableSkeleton } from "./ui/misc";
import { Pagination, Table, Td, Th, Tr } from "./ui/table";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { formatDateTime } from "@/lib/utils";

interface RecordRow { id: string; reference: string; subject: string; status: string; amount: string | null; detail: string | null; createdAt: string }
const QUERY: TypedDocumentNode<{
  adminOperationalRecords: { items: RecordRow[]; total: number; page: number; pageSize: number }
}, { section: string; input: { page: number; pageSize: number; search?: string } }> = gql`
  query AdminOperationalRecords($section: String!, $input: AdminPageInput) {
    adminOperationalRecords(section: $section, input: $input) {
      total page pageSize items { id reference subject status amount detail createdAt }
    }
  }
`;

const STATUS: Record<string, string> = {
  PENDING: "Chờ xử lý", CONFIRMED: "Đã xác nhận", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy",
  REJECTED: "Từ chối", EXPIRED: "Hết hạn", PAID: "Đã thanh toán", READ: "Đã đọc", UNREAD: "Chưa đọc",
  AS_DRIVER: "Đánh giá tài xế", AS_PASSENGER: "Đánh giá hành khách",
};

export function OperationalRecords({ section }: { section: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const keyword = useDebouncedValue(search.trim());
  const query = useQuery(QUERY, { variables: { section, input: { page, pageSize: 20, search: keyword || undefined } }, fetchPolicy: "network-only" });
  const result = query.data?.adminOperationalRecords;
  return <Card className="mb-5">
    <div className="space-y-3 border-b border-line p-4">
      {section === "payments" ? <p className="text-sm text-muted">Giao dịch thu payOS</p> : null}
      <Input aria-label="Tìm bản ghi" placeholder="Tìm mã tham chiếu, người dùng hoặc nội dung" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
    </div>
    {query.loading && !result ? <TableSkeleton /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !result ? <EmptyState title="Chưa nhận được dữ liệu" /> : !result.items.length ? <EmptyState title="Không có bản ghi phù hợp" /> : <>
      <Table><thead><tr><Th>Tham chiếu</Th><Th>Người liên quan</Th><Th>Trạng thái</Th><Th>{section === "payments" || section === "bookings" ? "Số tiền VND" : "Nội dung"}</Th><Th>Thời điểm</Th></tr></thead>
        <tbody>{result.items.map((row) => <Tr key={row.id}><Td className="max-w-64 break-all">{row.reference}</Td><Td>{row.subject}</Td><Td>{STATUS[row.status] ?? row.status}</Td><Td><p>{row.amount ?? ""}</p><p className="max-w-md whitespace-pre-wrap text-sm text-muted">{row.detail ?? "—"}</p></Td><Td>{formatDateTime(row.createdAt)}</Td></Tr>)}</tbody>
      </Table>
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
    </>}
  </Card>;
}
