"use client";

import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { TripRoute } from "@/components/trip-route";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, ErrorState, Skeleton } from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { BOOKINGS, USER_POSTED_TRIPS, USER_VIOLATIONS } from "@/lib/graphql";
import { BOOKING_STATUS, PENALTY_ACTION, TRIP_STATUS, VIOLATION_TYPE } from "@/lib/labels";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

const PAGE_SIZE = 5;

/**
 * Khung chung của ba bảng lịch sử trong trang chi tiết người dùng: tiêu đề kèm
 * tổng số, trạng thái tải, lỗi, rỗng, và phân trang khi có nhiều hơn một trang.
 */
function HistoryCard({
  title,
  emptyText,
  loading,
  error,
  onRetry,
  page,
  children,
  onPageChange,
}: {
  title: string;
  emptyText: string;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  page: { total: number; page: number; pageSize: number } | undefined;
  /** Bảng dữ liệu; chỉ được hiển thị khi có ít nhất một dòng. */
  children: ReactNode;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title={page ? `${title} (${formatNumber(page.total)})` : title}
      />
      {!page && loading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : !page ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : page.total === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">{emptyText}</p>
      ) : (
        <>
          {children}
          {page.total > page.pageSize ? (
            <Pagination
              page={page.page}
              pageSize={page.pageSize}
              total={page.total}
              onPageChange={onPageChange}
            />
          ) : null}
        </>
      )}
    </Card>
  );
}

function TripCodeLink({ id, code }: { id: string; code: string }) {
  return (
    <Link
      href={`/trips/${id}`}
      className="font-semibold whitespace-nowrap text-brand-700 tabular-nums hover:underline"
    >
      {code}
    </Link>
  );
}

/** Các chuyến người này đã đăng với tư cách tài xế. */
export function PostedTripsCard({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const { data, previousData, loading, error, refetch } = useQuery(USER_POSTED_TRIPS, {
    variables: { input: { driverId: userId, page, pageSize: PAGE_SIZE } },
  });
  const result = (data ?? previousData)?.adminTrips;

  return (
    <HistoryCard
      title="Chuyến đã đăng"
      emptyText="Tài xế này chưa đăng chuyến nào."
      loading={loading}
      error={error}
      onRetry={() => refetch()}
      page={result}
      onPageChange={setPage}
    >
      <Table>
        <thead>
          <tr>
            <Th>Mã chuyến</Th>
            <Th>Lộ trình</Th>
            <Th>Khởi hành</Th>
            <Th>Khách</Th>
            <Th>Trạng thái</Th>
          </tr>
        </thead>
        <tbody>
          {result?.items.map((trip) => (
            <Tr key={trip.id}>
              <Td>
                <TripCodeLink id={trip.id} code={trip.tripCode} />
              </Td>
              <Td>
                <TripRoute stops={trip.stops} />
              </Td>
              <Td className="whitespace-nowrap">{formatDateTime(trip.departureTime)}</Td>
              <Td className="whitespace-nowrap tabular-nums">
                {trip.bookedSeats}/{trip.totalSeatsOffered}
              </Td>
              <Td>
                <StatusBadge meta={TRIP_STATUS[trip.status]} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </HistoryCard>
  );
}

/** Các lần người này đặt chỗ với tư cách hành khách. */
export function BookingsCard({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const { data, previousData, loading, error, refetch } = useQuery(BOOKINGS, {
    variables: { input: { passengerId: userId, page, pageSize: PAGE_SIZE } },
  });
  const result = (data ?? previousData)?.adminBookings;

  return (
    <HistoryCard
      title="Chuyến đã đặt"
      emptyText="Người dùng này chưa đặt chỗ lần nào."
      loading={loading}
      error={error}
      onRetry={() => refetch()}
      page={result}
      onPageChange={setPage}
    >
      <Table>
        <thead>
          <tr>
            <Th>Mã đặt chỗ</Th>
            <Th>Chặng đi</Th>
            <Th>Tài xế</Th>
            <Th>Khởi hành</Th>
            <Th className="text-right">Chia sẻ chi phí</Th>
            <Th>Trạng thái</Th>
          </tr>
        </thead>
        <tbody>
          {result?.items.map((booking) => (
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
                <TripRoute
                  stops={[
                    { stopName: booking.pickupStop.stopName, sequenceOrder: 0 },
                    { stopName: booking.dropoffStop.stopName, sequenceOrder: 1 },
                  ]}
                />
              </Td>
              <Td className="whitespace-nowrap">
                {booking.trip.driver ? (
                  <Link
                    href={`/users/${booking.trip.driver.id}`}
                    className="hover:text-brand-700 hover:underline"
                  >
                    {booking.trip.driver.fullName}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="whitespace-nowrap">
                {formatDateTime(booking.trip.departureTime)}
              </Td>
              <Td className="text-right whitespace-nowrap tabular-nums">
                {booking.totalAmount > 0 ? formatCurrency(booking.totalAmount) : "—"}
              </Td>
              <Td>
                <StatusBadge meta={BOOKING_STATUS[booking.status]} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </HistoryCard>
  );
}

/** Các vi phạm đã ghi nhận của người này với tư cách tài xế. */
export function ViolationsCard({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const { data, previousData, loading, error, refetch } = useQuery(USER_VIOLATIONS, {
    variables: { input: { driverId: userId, page, pageSize: PAGE_SIZE } },
  });
  const result = (data ?? previousData)?.adminDriverViolations;

  return (
    <HistoryCard
      title="Vi phạm"
      emptyText="Tài xế này chưa có vi phạm nào."
      loading={loading}
      error={error}
      onRetry={() => refetch()}
      page={result}
      onPageChange={setPage}
    >
      <Table>
        <thead>
          <tr>
            <Th>Vi phạm</Th>
            <Th>Chuyến</Th>
            <Th>Hình phạt</Th>
            <Th>Ghi nhận lúc</Th>
            <Th>Tình trạng</Th>
          </tr>
        </thead>
        <tbody>
          {result?.items.map((violation) => (
            <Tr key={violation.id}>
              <Td className="font-medium">{VIOLATION_TYPE[violation.violationType]}</Td>
              <Td>
                {violation.trip ? (
                  <TripCodeLink id={violation.trip.id} code={violation.trip.tripCode} />
                ) : (
                  "—"
                )}
              </Td>
              <Td className="whitespace-nowrap">{PENALTY_ACTION[violation.penaltyAction]}</Td>
              <Td className="whitespace-nowrap text-muted">
                {formatDateTime(violation.createdAt)}
              </Td>
              <Td>
                {violation.isForgiven ? (
                  <Badge tone="neutral">Đã tha</Badge>
                ) : (
                  <Badge tone="bad">Còn hiệu lực</Badge>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </HistoryCard>
  );
}
