"use client";

import { useQuery } from "@apollo/client/react";
import { ArrowUpRight, CalendarClock, Search, Users } from "lucide-react";
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
import { Pagination } from "@/components/ui/table";
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
            {!history ? <div className="grid gap-4 bg-gray-50/50 p-4 md:grid-cols-2 2xl:grid-cols-3" aria-label="Các chuyến đi">{result.items.map((trip) => {
              const variance = computeDepartureVariance(trip.departureTime, trip.actualStartedAt, trip.status);
              return <article key={trip.id} className="rs-trip-card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-5 py-3"><StatusBadge meta={TRIP_STATUS[trip.status]} /><span className="inline-flex items-center gap-1.5 text-xs text-muted"><Users className="size-3.5" aria-hidden />{trip.totalSeatsOffered} ghế đã đăng</span></div>
                <div className="flex flex-1 flex-col p-5"><Link href={`/trips/${trip.id}`} className="block font-medium transition-colors hover:text-brand-700"><TripRoute stops={trip.stops} /></Link>
                  <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5"><CalendarClock className="size-4 shrink-0 text-muted" aria-hidden /><span className="text-sm font-medium tabular-nums">{formatDateTime(trip.departureTime)}</span>{variance.tone !== "neutral" || variance.isOverdue ? <Badge tone={variance.tone} className="text-[11px]" >{variance.shortLabel}</Badge> : null}</div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">{trip.driver ? <PersonCell person={trip.driver} href={`/users/${trip.driver.id}`} /> : <span className="text-sm text-muted">Chưa có thông tin tài xế</span>}<div className="ml-auto text-right"><p className="text-[11px] text-muted">Mức chia sẻ / km</p><p className="mt-1 text-sm font-semibold tabular-nums">{trip.pricing ? formatCurrency(trip.pricing.baseCostPerKm) : "—"}</p></div></div>
                </div>
                <Link href={`/trips/${trip.id}`} className="flex items-center justify-between border-t border-line/70 px-5 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50">Xem hành trình<ArrowUpRight className="size-4" aria-hidden /></Link>
              </article>;
            })}</div> : <ol className="p-5 sm:p-7" aria-label="Lịch sử theo giờ khởi hành">{result.items.map((trip) => {
              const variance = computeDepartureVariance(trip.departureTime, trip.actualStartedAt, trip.status);
              return <li key={trip.id} className="rs-record-enter relative border-l border-line pb-7 pl-6 last:pb-0">
                <span className="absolute top-1 -left-1.5 size-3 rounded-full border-2 border-white bg-brand-600 ring-1 ring-line" aria-hidden />
                <div className="mb-3 flex flex-wrap items-center gap-3"><time dateTime={trip.departureTime} className="text-xs font-medium tabular-nums text-muted">Khởi hành dự kiến · {formatDateTime(trip.departureTime)}</time><StatusBadge meta={TRIP_STATUS[trip.status]} /></div>
                <article className="min-w-0 rounded-xl border border-line bg-white p-5">
                  <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(180px,1fr)]"><Link href={`/trips/${trip.id}`} className="min-w-0 font-medium hover:text-brand-700"><TripRoute stops={trip.stops} /></Link><div className="min-w-0 xl:justify-self-end">{trip.driver ? <PersonCell person={trip.driver} href={`/users/${trip.driver.id}`} /> : <p className="text-sm text-muted">Chưa có thông tin tài xế</p>}</div></div>
                  <dl className="mt-5 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-3">
                    <div><dt className="text-xs text-muted">Khởi hành thực tế</dt><dd className="mt-1 tabular-nums">{trip.actualStartedAt ? formatDateTime(trip.actualStartedAt) : "Chưa ghi nhận"}{variance.tone !== "neutral" || variance.isOverdue ? <span className="mt-2 block" title={variance.label}><Badge tone={variance.tone} className="text-[11px]">{variance.shortLabel}</Badge></span> : null}</dd></div>
                    <div><dt className="text-xs text-muted">Ghế đã đăng</dt><dd className="mt-1 tabular-nums">{trip.totalSeatsOffered}</dd></div>
                    <div><dt className="text-xs text-muted">Mức chia sẻ / km</dt><dd className="mt-1 tabular-nums">{trip.pricing ? formatCurrency(trip.pricing.baseCostPerKm) : "—"}</dd></div>
                  </dl>
                  <div className="mt-4 flex justify-end"><Link href={`/trips/${trip.id}`} className="inline-flex items-center gap-2 py-2 text-sm font-medium text-brand-700">Xem hồ sơ hành trình<ArrowUpRight className="size-4" aria-hidden /></Link></div>
                </article>
              </li>;
            })}</ol>}
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
