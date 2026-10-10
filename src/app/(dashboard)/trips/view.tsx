"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PersonCell } from "@/components/person-cell";
import { TripRoute } from "@/components/trip-route";
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

export function TripsView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TripStatus | "">("");
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
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
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
                  <Th>Lộ trình</Th>
                  <Th>Tài xế</Th>
                  <Th>Khởi hành</Th>
                  <Th className="text-right">Ghế trống</Th>
                  <Th className="text-right">Giá mỗi km</Th>
                  <Th>Trạng thái</Th>
                  <Th className="text-right">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((trip) => (
                  <Tr key={trip.id}>
                    <Td>
                      <Link href={`/trips/${trip.id}`} className="block hover:text-brand-700">
                        <TripRoute stops={trip.stops} />
                      </Link>
                    </Td>
                    <Td>
                      {trip.driver ? (
                        <PersonCell person={trip.driver} href={`/users/${trip.driver.id}`} />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">{formatDateTime(trip.departureTime)}</Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">
                      {trip.availableSeats}/{trip.totalSeatsOffered}
                    </Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">
                      {trip.pricing ? formatCurrency(trip.pricing.baseCostPerKm) : "—"}
                    </Td>
                    <Td>
                      <StatusBadge meta={TRIP_STATUS[trip.status]} />
                    </Td>
                    <Td className="text-right">
                      <Link href={`/trips/${trip.id}`} className={buttonClass("secondary", "sm")}>
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
