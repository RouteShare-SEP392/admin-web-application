"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { PersonCell } from "@/components/person-cell";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { REPORTS } from "@/lib/graphql";
import { REPORT_STATUS } from "@/lib/labels";
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { ReportStatus } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = Object.keys(REPORT_STATUS) as ReportStatus[];

export function ReportsView() {
  // Bộ lọc nằm trên URL: /reports?q=...&status=...&page=...
  const url = useUrlState();
  const status = url.getOption("status", STATUS_OPTIONS);
  const page = url.getPage();
  const query = url.getText("q");
  const [search, setSearch] = useUrlSearchText(query, (q) => url.setParams({ q, page: null }));

  const { data, previousData, loading, error, refetch } = useQuery(REPORTS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        search: query || undefined,
        status: status || undefined,
      },
    },
  });
  const result = (data ?? previousData)?.adminReports;

  return (
    <>
      <PageHeader
        title="Báo cáo và khiếu nại"
        description="Báo cáo người dùng gửi về tài xế hoặc hành khách sau chuyến đi, mới gửi xếp trước."
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
              aria-label="Tìm báo cáo"
              placeholder="Tìm theo loại báo cáo, người báo cáo, người bị báo cáo"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Trạng thái báo cáo"
            value={status}
            onChange={(event) => url.setParams({ status: event.target.value, page: null })}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {REPORT_STATUS[option].label}
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
            title="Không có báo cáo phù hợp"
            description="Thử đổi từ khoá hoặc bộ lọc."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Nội dung</Th>
                  <Th>Người bị báo cáo</Th>
                  <Th>Người báo cáo</Th>
                  <Th>Trạng thái</Th>
                  <Th>Gửi lúc</Th>
                  <Th className="text-right">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((report) => (
                  <Tr key={report.id}>
                    <Td className="max-w-80">
                      <Link
                        href={`/reports/${report.id}`}
                        className="font-medium hover:text-brand-700 hover:underline"
                      >
                        {report.type}
                      </Link>
                      <p className="line-clamp-2 text-xs text-muted">{report.description}</p>
                    </Td>
                    <Td>
                      <PersonCell
                        person={report.reportedUser}
                        href={`/users/${report.reportedUser.id}`}
                      />
                    </Td>
                    <Td className="whitespace-nowrap">{report.reporter.fullName}</Td>
                    <Td>
                      <StatusBadge meta={REPORT_STATUS[report.status]} />
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDateTime(report.createdAt)}
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/reports/${report.id}`}
                        className={buttonClass(
                          report.status === "OPEN" || report.status === "UNDER_REVIEW"
                            ? "primary"
                            : "secondary",
                          "sm",
                        )}
                      >
                        {report.status === "OPEN" || report.status === "UNDER_REVIEW"
                          ? "Xử lý"
                          : "Xem"}
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
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
