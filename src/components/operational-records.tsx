"use client";

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { Input } from "./ui/field";
import { Card, EmptyState, ErrorState, TableSkeleton } from "./ui/misc";
import { Pagination } from "./ui/table";
import { OperationalRecordLayouts } from "./operational-record-layouts";
import { useDebouncedValue } from "@/lib/use-debounced-value";

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


export function OperationalRecords({ section }: { section: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const keyword = useDebouncedValue(search.trim());
  const query = useQuery(QUERY, { variables: { section, input: { page, pageSize: 20, search: keyword || undefined } }, fetchPolicy: "network-only" });
  const result = query.data?.adminOperationalRecords;
  return <Card className="mb-5">
    <div className="space-y-3 border-b border-line p-4">
      <Input aria-label={section === "reviews" ? "Tìm đánh giá" : "Tìm bản ghi"} placeholder={section === "reviews" ? "Tìm người viết, mã đặt chỗ hoặc lời nhận xét…" : "Tìm mã tham chiếu, người dùng hoặc nội dung"} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
    </div>
    {query.loading && !result ? <TableSkeleton /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : !result ? <EmptyState title="Chưa nhận được dữ liệu" /> : !result.items.length ? <EmptyState title="Không có bản ghi phù hợp" /> : <>
      <OperationalRecordLayouts section={section} rows={result.items} />
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
    </>}
  </Card>;
}
