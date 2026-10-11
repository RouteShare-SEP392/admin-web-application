"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { PersonCell } from "@/components/person-cell";
import { TripRoute } from "@/components/trip-route";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { BOOKINGS } from "@/lib/graphql";
import { BOOKING_STATUS } from "@/lib/labels";
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { BookingStatus } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = Object.keys(BOOKING_STATUS) as BookingStatus[];

export function BookingsView() {
  // Bộ lọc nằm trên URL: /bookings?q=...&status=...&page=...
  const url = useUrlState();
  const status = url.getOption("status", STATUS_OPTIONS);
  const page = url.getPage();
  const query = url.getText("q");
  const [search, setSearch] = useUrlSearchText(query, (q) => url.setParams({ q, page: null }));

  const { data, previousData, loading, error, refetch } = useQuery(BOOKINGS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        search: query || undefined,
        status: status || undefined,
      },
    },
  });
  const result = (data ?? previousData)?.adminBookings;

  return (
    <>
      <PageHeader
        title="Đặt chỗ"
        description="Mọi yêu cầu đặt chỗ của hành khách, mới đặt xếp trước. Quản trị viên chỉ tra cứu, không đặt hay huỷ thay người dùng."
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
              aria-label="Tìm đặt chỗ"
              placeholder="Tìm theo mã đặt chỗ, mã chuyến, tên hành khách"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Trạng thái đặt chỗ"
            value={status}
            onChange={(event) => url.setParams({ status: event.target.value, page: null })}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {BOOKING_STATUS[option].label}
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
            title="Không có đặt chỗ phù hợp"
            description="Thử đổi từ khoá hoặc bộ lọc."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Mã đặt chỗ</Th>
                  <Th>Hành khách</Th>
                  <Th>Chặng đi</Th>
                  <Th>Chuyến</Th>
                  <Th className="text-right">Khách trả</Th>
                  <Th>Trạng thái</Th>
                  <Th>Đặt lúc</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((booking) => (
                  <Tr key={booking.id}>
                    <Td>
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="font-semibold whitespace-nowrap text-brand-700 tabular-nums hover:underline"
                      >
                        {booking.bookingCode}
                      </Link>
                    </Td>
                    <Td>
                      <PersonCell
                        person={booking.passenger}
                        href={`/users/${booking.passenger.id}`}
                      />
                    </Td>
                    <Td>
                      <TripRoute
                        stops={[
                          { stopName: booking.pickupStop.stopName, sequenceOrder: 0 },
                          { stopName: booking.dropoffStop.stopName, sequenceOrder: 1 },
                        ]}
                      />
                    </Td>
                    <Td>
                      <Link
                        href={`/trips/${booking.trip.id}`}
                        className="font-medium whitespace-nowrap tabular-nums hover:text-brand-700 hover:underline"
                      >
                        {booking.trip.tripCode}
                      </Link>
                      <p className="text-xs whitespace-nowrap text-muted">
                        {formatDateTime(booking.trip.departureTime)}
                      </p>
                    </Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">
                      {booking.totalAmount > 0 ? formatCurrency(booking.totalAmount) : "—"}
                    </Td>
                    <Td>
                      <StatusBadge meta={BOOKING_STATUS[booking.status]} />
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDateTime(booking.requestedAt)}
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
