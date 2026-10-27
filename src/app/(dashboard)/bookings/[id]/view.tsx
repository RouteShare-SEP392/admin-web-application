"use client";

import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PersonCell } from "@/components/person-cell";
import { TripRoute } from "@/components/trip-route";
import { Badge, StatusBadge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  ErrorState,
  Fact,
  TableSkeleton,
} from "@/components/ui/misc";
import { BOOKING_DETAIL } from "@/lib/graphql";
import {
  BOOKING_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SETTLEMENT_STATUS,
  TRIP_STATUS,
} from "@/lib/labels";
import { cn, formatCurrency, formatDateTime, formatDecimal } from "@/lib/utils";

export function BookingDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(BOOKING_DETAIL, { variables: { id } });
  const booking = data?.adminBooking;
  const back = <BackLink href="/bookings" label="Danh sách đặt chỗ" />;

  if (!booking) {
    return (
      <>
        {back}
        <Card>
          {loading ? <TableSkeleton /> : <ErrorState error={error} onRetry={() => refetch()} />}
        </Card>
      </>
    );
  }

  const { trip, payment } = booking;
  const hasFare = booking.baseAmount > 0;
  const timeline = [
    { label: "Gửi yêu cầu", at: booking.requestedAt },
    { label: "Tài xế xác nhận", at: booking.confirmedAt },
    { label: "Huỷ", at: booking.cancelledAt },
    { label: "Hoàn thành chuyến", at: booking.completedAt },
    { label: "Thanh toán", at: payment?.paidAt ?? null },
  ].filter((step): step is { label: string; at: string } => step.at !== null);

  return (
    <>
      {back}

      <Card className="mb-6 p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-brand-700 tabular-nums">{booking.bookingCode}</span>
          <StatusBadge meta={BOOKING_STATUS[booking.status]} />
        </div>
        <h1 className="text-xl font-semibold">
          {booking.pickupStop.stopName} → {booking.dropoffStop.stopName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {booking.seatsBooked} ghế trên chuyến{" "}
          <Link href={`/trips/${trip.id}`} className="font-medium text-brand-700 hover:underline">
            {trip.tripCode}
          </Link>
          , khởi hành {formatDateTime(trip.departureTime)}
        </p>
        {booking.cancellationReason ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            <span className="font-semibold">Lý do huỷ:</span> {booking.cancellationReason}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Chia sẻ chi phí"
            action={
              hasFare ? (
                <Badge tone={booking.fareStatus === "FINALIZED" ? "good" : "pending"}>
                  {booking.fareStatus === "FINALIZED" ? "Đã chốt" : "Ước tính"}
                </Badge>
              ) : undefined
            }
          />
          {hasFare ? (
            <dl className="px-5 py-2 text-sm">
              <FareRow label="Phần chi phí theo chặng đi" value={booking.baseAmount} />
              {booking.discountAmount > 0 ? (
                <FareRow
                  label={`Giảm giá khách quen (${formatDecimal(booking.discountPercent)}%)`}
                  value={-booking.discountAmount}
                />
              ) : null}
              <FareRow label="Khách trả" value={booking.totalAmount} strong />
              <FareRow label="Phí nền tảng (tính trên giá gốc)" value={-booking.platformFee} />
              <FareRow label="Tài xế nhận" value={booking.driverEarnings} strong />
            </dl>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">
              Đặt chỗ này không phát sinh chi phí vì chưa từng được xác nhận.
            </p>
          )}
          {hasFare && booking.fareStatus === "ESTIMATED" ? (
            <p className="border-t border-line px-5 py-3 text-xs text-muted">
              Số tiền được chốt sau khi chuyến kết thúc, theo số khách thực tế trên từng chặng.
            </p>
          ) : null}
        </Card>

        <Card>
          <CardHeader
            title="Thanh toán"
            action={payment ? <StatusBadge meta={PAYMENT_STATUS[payment.status]} /> : undefined}
          />
          {payment ? (
            <dl className="divide-y divide-line px-5 py-2">
              <Fact label="Phương thức">{PAYMENT_METHOD[payment.method]}</Fact>
              <Fact label="Số tiền">{formatCurrency(payment.amount)}</Fact>
              <Fact label="Mã giao dịch">{payment.transactionReference ?? "—"}</Fact>
              <Fact label="Thanh toán lúc">{formatDateTime(payment.paidAt)}</Fact>
              <Fact label="Chuyển cho tài xế">
                {payment.settlementStatus ? (
                  <StatusBadge meta={SETTLEMENT_STATUS[payment.settlementStatus]} />
                ) : payment.method === "CASH" ? (
                  "Khách trả tiền mặt trực tiếp"
                ) : (
                  "—"
                )}
              </Fact>
            </dl>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">
              Chưa có thanh toán. Hành khách thanh toán sau khi chuyến kết thúc.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader title="Hành khách và tài xế" />
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                Hành khách
              </p>
              <PersonCell person={booking.passenger} href={`/users/${booking.passenger.id}`} />
            </div>
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                Tài xế
              </p>
              {trip.driver ? (
                <PersonCell person={trip.driver} href={`/users/${trip.driver.id}`} />
              ) : (
                <p className="text-sm text-muted">Không có thông tin tài xế.</p>
              )}
            </div>
            <div className="border-t border-line pt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Lộ trình của chuyến
                </p>
                <StatusBadge meta={TRIP_STATUS[trip.status]} />
              </div>
              <TripRoute stops={trip.stops} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Các mốc thời gian" />
          <ol className="p-5">
            {timeline.map((step, index) => (
              <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
                {index < timeline.length - 1 ? (
                  <span aria-hidden className="absolute top-4 bottom-0 left-[5px] w-0.5 bg-brand-200" />
                ) : null}
                <span aria-hidden className="relative mt-1.5 size-3 shrink-0 rounded-full bg-brand-600" />
                <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-muted tabular-nums">{formatDateTime(step.at)}</span>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}

/** Một dòng trong bảng tính tiền; số âm là khoản trừ. */
function FareRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2",
        strong && "border-t border-line font-semibold",
      )}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">
        {value < 0 ? `−${formatCurrency(-value)}` : formatCurrency(value)}
      </dd>
    </div>
  );
}
