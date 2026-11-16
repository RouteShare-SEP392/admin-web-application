"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { useDebouncedValue } from "@/lib/use-debounced-value";
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

export function TripsView({ history = false }: { history?: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TripStatus | "">(history ? "COMPLETED" : "");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());

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
        title={history ? "Lịch sử hành trình" : "Chuyến đi"}
        description={history ? "Tra cứu chuyến đã hoàn thành, hủy hoặc hết hạn." : "Tra cứu chuyến đi, tài xế và lịch trình đã đăng."}
        mocked={isProposedApiMocked()}
      />

      {history ? <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Lọc lịch sử hành trình">
        {(["COMPLETED", "CANCELLED", "EXPIRED"] as const).map((value) => <button key={value} type="button" aria-pressed={status === value} className={buttonClass(status === value ? "primary" : "secondary")} onClick={() => { setStatus(value); setPage(1); }}>{TRIP_STATUS[value].label}</button>)}
      </div> : null}

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
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          {!history ? <Select
            aria-label="Trạng thái chuyến"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TripStatus | "");
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {TRIP_STATUS[option].label}
              </option>
            ))}
          </Select> : null}
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
                   <Th className="px-2.5 text-center whitespace-nowrap">Ghế đã đăng</Th>
                   <Th className="px-2.5 text-right whitespace-nowrap">Mức chia sẻ/km</Th>
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
                       {trip.totalSeatsOffered}
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
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
