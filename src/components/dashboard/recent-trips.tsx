"use client";

import { useQuery } from "@apollo/client/react";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar, Card, EmptyState, ErrorState, TableSkeleton } from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { RECENT_TRIPS, type RecentTripFilter } from "@/lib/graphql";
import { TRIP_STATUS } from "@/lib/labels";
import type { Trip } from "@/lib/types";
import { cn, formatCurrency, formatShortDateTime } from "@/lib/utils";

const PAGE_SIZE = 7;
const REFRESH_MS = 30_000;

const FILTERS: { key: RecentTripFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "lowMatch", label: "Ghép < 70%" },
  { key: "hasViolation", label: "Có vi phạm" },
  { key: "today", label: "Hôm nay" },
];

/** Bảng chuyến mới tạo gần đây, tự làm mới để quản trị viên theo dõi trong ca. */
export function RecentTrips({
  filter,
  onFilterChange,
}: {
  filter: RecentTripFilter;
  onFilterChange: (filter: RecentTripFilter) => void;
}) {
  const [page, setPage] = useState(1);
  const { data, previousData, loading, error, refetch } = useQuery(RECENT_TRIPS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        sortBy: "CREATED_AT",
        lowMatchOnly: filter === "lowMatch" || undefined,
        hasViolation: filter === "hasViolation" || undefined,
        todayOnly: filter === "today" || undefined,
      },
    },
    pollInterval: REFRESH_MS,
  });
  const result = (data ?? previousData)?.adminTrips;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="font-semibold">Chuyến gần đây</h2>
          <p className="mt-0.5 text-sm text-muted">
            Chuyến mới tạo xếp trước · làm mới mỗi 30 giây
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc chuyến gần đây">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={filter === option.key}
              onClick={() => {
                onFilterChange(option.key);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                filter === option.key
                  ? "border-brand-200 bg-brand-50 text-brand-800"
                  : "border-line bg-white text-ink hover:bg-brand-50/60",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!result && loading ? (
        <TableSkeleton rows={PAGE_SIZE} />
      ) : !result ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : result.items.length === 0 ? (
        <EmptyState title="Không có chuyến phù hợp" description="Thử chọn bộ lọc khác." />
      ) : (
        <>
          <Table className="border-t border-line">
            <thead>
              <tr>
                <Th>Mã chuyến</Th>
                <Th>Tài xế</Th>
                <Th>Lộ trình</Th>
                <Th>Khách</Th>
                <Th>Trạng thái</Th>
                <Th>Tỷ lệ ghép</Th>
                <Th className="text-right">Chia sẻ chi phí</Th>
                <Th className="text-right">Tạo lúc</Th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((trip) => (
                <Tr key={trip.id}>
                  <Td>
                    <Link
                      href={`/trips/${trip.id}`}
                      className="font-semibold whitespace-nowrap text-brand-700 tabular-nums hover:underline"
                    >
                      {trip.tripCode}
                    </Link>
                  </Td>
                  <Td>
                    <DriverCell trip={trip} />
                  </Td>
                  <Td>
                    <RouteCell trip={trip} />
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums">
                    <span className="font-semibold">{trip.bookedSeats}</span>
                    <span className="text-muted"> /{trip.totalSeatsOffered}</span>
                  </Td>
                  <Td>
                    <StatusBadge meta={TRIP_STATUS[trip.status]} />
                  </Td>
                  <Td>
                    <MatchBar percent={trip.averageMatchPercent} />
                  </Td>
                  <Td className="text-right font-medium whitespace-nowrap tabular-nums">
                    {trip.sharedCostTotal === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      formatCurrency(trip.sharedCostTotal)
                    )}
                  </Td>
                  <Td className="text-right whitespace-nowrap text-muted tabular-nums">
                    {formatShortDateTime(trip.createdAt)}
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
  );
}

function DriverCell({ trip }: { trip: Trip }) {
  if (!trip.driver) return <span className="text-muted">—</span>;
  return (
    <div className="flex w-44 items-center gap-3">
      <Avatar name={trip.driver.fullName} src={trip.driver.avatarUrl} />
      <div className="min-w-0 leading-tight">
        <Link
          href={`/users/${trip.driver.id}`}
          className="font-medium hover:text-brand-700 hover:underline"
        >
          {trip.driver.fullName}
        </Link>
        <p className="flex items-center gap-1 text-xs text-muted">
          <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
          <span className="tabular-nums">{trip.driver.ratingAsDriver.toFixed(1)}</span>
          {trip.vehicle ? (
            <span className="truncate">
              · {trip.vehicle.make} {trip.vehicle.model}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function RouteCell({ trip }: { trip: Trip }) {
  const stops = [...trip.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  if (stops.length === 0) return <span className="text-muted">—</span>;
  return (
    <div className="flex min-w-40 flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-brand-600" aria-hidden />
        {stops[0].stopName}
      </span>
      <ArrowRight className="size-3.5 shrink-0 text-subtle" aria-label="đến" />
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-sm bg-orange-500" aria-hidden />
        {stops[stops.length - 1].stopName}
      </span>
    </div>
  );
}

/** Thanh tỷ lệ trùng tuyến; dưới 70% được tô cam để dễ nhận ra chuyến ghép kém. */
function MatchBar({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="whitespace-nowrap text-muted">Chưa có khách</span>;
  const low = percent < 70;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-14 rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full", low ? "bg-orange-600" : "bg-brand-600")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          low ? "text-orange-700" : "text-brand-700",
        )}
      >
        {Math.round(percent)}%
      </span>
    </div>
  );
}
