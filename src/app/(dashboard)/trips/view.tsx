"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { PersonCell } from "@/components/person-cell";
import { computeDepartureVariance } from "@/components/trip-monitoring/trip-milestone-audit";
import { TripRoute } from "@/components/trip-route";
import { Badge, StatusBadge } from "@/components/ui/badge";
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
import { TRIPS } from "@/lib/graphql";
import { TRIP_STATUS } from "@/lib/labels";
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { TripStatus } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: TripStatus[] = [
  "PUBLISHED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "DRAFT",
];

export function TripsView() {
  // Bộ lọc nằm trên URL: /trips?q=...&status=...&page=...
  const url = useUrlState();
  const status = url.getOption("status", STATUS_OPTIONS);
  const page = url.getPage();
  const debouncedSearch = url.getText("q");
  const [search, setSearch] = useUrlSearchText(debouncedSearch, (q) =>
    url.setParams({ q, page: null }),
  );

  const { data, previousData, loading, error, refetch } = useQuery(TRIPS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: status || undefined,
      },
    },
  });
  const result = (data ?? previousData)?.adminTrips;

  return (
    <>
      <Link
        href="/trip-operations"
        className="mb-4 inline-flex font-medium text-brand-700"
      >
        Lịch định kỳ & thay đổi chuyến →
      </Link>
      <PageHeader
        title="Chuyến đi"
        description="Giám sát các chuyến tài xế đã đăng. Quản trị viên chỉ xem và huỷ chuyến vi phạm, không tạo hay sửa chuyến."
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
              aria-label="Tìm chuyến đi"
              placeholder="Tìm theo tên tài xế hoặc điểm dừng"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Trạng thái chuyến"
            value={status}
            onChange={(event) => url.setParams({ status: event.target.value, page: null })}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {TRIP_STATUS[option].label}
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
            title="Không có chuyến đi phù hợp"
            description="Thử đổi từ khoá hoặc bộ lọc."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th className="px-2.5 first:pl-4">Lộ trình</Th>
                  <Th className="px-2.5">Tài xế</Th>
                  <Th className="px-2.5">Khởi hành</Th>
                  <Th className="px-2.5 text-center whitespace-nowrap">Ghế trống</Th>
                  <Th className="px-2.5 text-right whitespace-nowrap">Giá mỗi km</Th>
                  <Th className="px-2.5 text-center whitespace-nowrap">Trạng thái</Th>
                  <Th className="px-2.5 text-right whitespace-nowrap last:pr-4">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((trip) => (
                  <Tr key={trip.id}>
                    <Td className="px-2.5 first:pl-4">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="block hover:text-brand-700"
                      >
                        <TripRoute stops={trip.stops} className="min-w-44" />
                      </Link>
                    </Td>
                    <Td className="px-2.5">
                      {trip.driver ? (
                        <PersonCell
                          person={trip.driver}
                          href={`/users/${trip.driver.id}`}
                          className="min-w-36"
                        />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td className="px-2.5">
                      <div className="whitespace-nowrap">
                        {formatDateTime(trip.departureTime)}
                      </div>
                      {(() => {
                        const variance = computeDepartureVariance(
                          trip.departureTime,
                          trip.actualStartedAt,
                          trip.status,
                        );
                        if (variance.tone === "neutral" && !variance.isOverdue) return null;
                        return (
                          <div className="mt-1" title={variance.label}>
                            <Badge tone={variance.tone} className="text-[11px] px-2 py-0">
                              {variance.shortLabel}
                            </Badge>
                          </div>
                        );
                      })()}
                    </Td>
                    <Td className="px-2.5 text-center whitespace-nowrap tabular-nums">
                      {trip.availableSeats}/{trip.totalSeatsOffered}
                    </Td>
                    <Td className="px-2.5 text-right whitespace-nowrap tabular-nums">
                      {trip.pricing
                        ? formatCurrency(trip.pricing.baseCostPerKm)
                        : "—"}
                    </Td>
                    <Td className="px-2.5 text-center whitespace-nowrap">
                      <StatusBadge meta={TRIP_STATUS[trip.status]} />
                    </Td>
                    <Td className="px-2.5 text-right whitespace-nowrap last:pr-4">
                      <Link
                        href={`/trips/${trip.id}`}
                        className={buttonClass("secondary", "sm")}
                      >
                        Chi tiết
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
