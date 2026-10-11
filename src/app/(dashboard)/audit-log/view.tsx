"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import { AuditLogTable } from "@/components/audit-log-table";
import { Input, Select } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination } from "@/components/ui/table";
import { AUDIT_LOGS } from "@/lib/graphql";
import { AUDIT_ACTION } from "@/lib/labels";
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { AuditAction } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";

const PAGE_SIZE = 15;
const ACTION_OPTIONS = Object.keys(AUDIT_ACTION) as AuditAction[];

/** Mọi thao tác quản trị đã thực hiện: ai làm, làm gì, với đối tượng nào, lúc nào. */
export function AuditLogView() {
  // Bộ lọc nằm trên URL: /audit-log?action=...&q=...&page=...
  const url = useUrlState();
  const action = url.getOption("action", ACTION_OPTIONS);
  const page = url.getPage();
  const query = url.getText("q");
  const [search, setSearch] = useUrlSearchText(query, (q) => url.setParams({ q, page: null }));

  const { data, previousData, loading, error, refetch } = useQuery(AUDIT_LOGS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        action: action || undefined,
        search: query || undefined,
      },
    },
  });
  const result = (data ?? previousData)?.adminAuditLogs;

  return (
    <>
      <PageHeader
        title="Nhật ký thao tác"
        description="Các quyết định của quản trị viên, mới nhất xếp trước. Nhật ký chỉ ghi thêm, không sửa hay xoá được."
        mocked={isProposedApiMocked()}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Tìm trong nhật ký"
              placeholder="Tìm theo đối tượng, người thực hiện, lý do"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Loại hành động"
            value={action}
            onChange={(event) => url.setParams({ action: event.target.value, page: null })}
          >
            <option value="">Tất cả hành động</option>
            {ACTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {AUDIT_ACTION[option].label}
              </option>
            ))}
          </Select>
        </div>

        {!result && loading ? (
          <TableSkeleton />
        ) : !result ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : result.items.length === 0 ? (
          <EmptyState
            title="Không có thao tác phù hợp"
            description="Thử đổi từ khoá hoặc loại hành động."
          />
        ) : (
          <>
            <AuditLogTable entries={result.items} />
            <Pagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              onPageChange={(next) => url.setParams({ page: next === 1 ? null : next })}
            />
          </>
        )}
      </Card>
    </>
  );
}
