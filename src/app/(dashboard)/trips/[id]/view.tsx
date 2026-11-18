"use client";
import { TripMilestoneAudit } from "@/components/trip-monitoring/trip-milestone-audit";
import { TripChangeAudit } from "@/components/trip-operations/trip-change-audit";

import { useQuery } from "@apollo/client/react";
import { ArrowLeft, Ban } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PersonCell } from "@/components/person-cell";
import { TripRouteMap } from "@/components/trip-route-map";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  ErrorState,
  Fact,
  MockBadge,
  TableSkeleton,
} from "@/components/ui/misc";
import { TRIP_DETAIL } from "@/lib/graphql";
import { LUGGAGE, STOP_TYPE, TRIP_STATUS, VEHICLE_TYPE } from "@/lib/labels";
import { isExistingApiMocked, resolveMockMode } from "@/lib/mock-mode";
import type { TripStop } from "@/lib/types";
import {
  cn,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatTime,
} from "@/lib/utils";

export function TripDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(TRIP_DETAIL, {
    variables: { id },
  });

  const trip = data?.adminTrip;

  if (!trip) {
    return (
      <>
        <BackLink />
        <Card>
          {loading ? (
            <TableSkeleton />
          ) : (
            <ErrorState error={error} onRetry={() => refetch()} />
          )}
        </Card>
      </>
    );
  }

  const stops = trip.stops
    .filter((stop): stop is TripStop => stop !== null)
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);


  return (
    <>
      <BackLink />

      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge meta={TRIP_STATUS[trip.status]} />
            {isExistingApiMocked() ? <MockBadge /> : null}
          </div>
          <h1 className="text-xl font-semibold">
            {stops.length > 0
              ? `${stops[0].stopName} → ${stops[stops.length - 1].stopName}`
              : "Chuyến đi"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Khởi hành {formatDateTime(trip.departureTime)} · dự kiến đến{" "}
            {formatDateTime(trip.estimatedArrivalTime)}
          </p>
        </div>
        {trip.status === "PUBLISHED" ? (
          <Button variant="danger" disabled title="API hủy chuyến quản trị chưa được triển khai">
            <Ban className="size-4" aria-hidden />
            Huỷ chuyến
          </Button>
        ) : null}
      </section>

      {trip.status === "PUBLISHED" && resolveMockMode() !== "all" ? <p className="mb-5 text-sm text-muted">Hủy chuyến quản trị chưa khả dụng: cần Backend xử lý đặt chỗ liên quan, lý do, thông báo và audit trong cùng nghiệp vụ.</p> : null}

      {trip.status === "CANCELLED" ? (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-semibold">
            Chuyến đã bị huỷ
            {trip.cancelledBy
              ? trip.cancelledBy === trip.driverId
                ? " bởi tài xế"
                : " bởi người xử lý khác (chưa có vai trò xác nhận)"
              : ""}
            .
          </span>{" "}
          {trip.cancellationReason ? `Lý do: ${trip.cancellationReason}` : null}
        </p>
      ) : null}

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Lộ trình"
            description={`${formatNumber(trip.totalDistanceKm)} km · ${formatDuration(trip.totalDurationMinutes)}`}
          />
          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 bg-gray-50 p-3"><TripRouteMap stops={stops} polyline={trip.routePolyline} /></div>
            <ol className="max-h-[520px] overflow-y-auto border-t border-line p-5 lg:border-t-0 lg:border-l" aria-label="Lịch trình đã lưu">
              {stops.map((stop, index) => (
                <li
                  key={stop.id}
                  className="relative flex gap-4 pb-5 last:pb-0"
                >
                  {index < stops.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute top-7 bottom-0 left-[13px] w-0.5 bg-brand-200"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold text-brand-900",
                       stop.stopType === "DESTINATION"
                         ? "border-red-500 bg-red-50 text-red-700"
                         : stop.stopType === "INTERMEDIATE_STOP" ? "border-amber-400 bg-amber-50 text-amber-800" : "border-brand-700 bg-white",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium">{stop.stopName}</p>
                      <p className="text-sm text-muted tabular-nums">
                        {formatTime(
                          index === 0
                            ? stop.plannedDepartureTime
                            : stop.plannedArrivalTime,
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-muted">{stop.stopAddress}</p>
                    <p className="mt-0.5 text-xs font-medium text-brand-700">
                      {STOP_TYPE[stop.stopType]}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Thông tin chuyến" />
            <dl className="divide-y divide-line px-5 py-2">
              <Fact label="Ghế chia sẻ đã đăng">
                {trip.totalSeatsOffered}
              </Fact>
              <Fact label="Mức chia sẻ tổng mỗi km">
                {trip.pricing
                  ? formatCurrency(trip.pricing.baseCostPerKm)
                  : "—"}
              </Fact>
              <Fact label="Tổng chi phí chia sẻ ước tính">
                {trip.pricing
                  ? formatCurrency(trip.pricing.totalEstimatedFare)
                  : "—"}
              </Fact>
              <Fact label="Hành lý">{LUGGAGE[trip.luggageAllowed]}</Fact>
              <Fact label="Đặt chỗ">
                {trip.isInstantBooking
                  ? "Xác nhận ngay"
                  : "Tài xế duyệt từng yêu cầu"}
              </Fact>
              <Fact label="Tạo lúc">{formatDateTime(trip.createdAt)}</Fact>
            </dl>
            {trip.driverNotes ? (
              <p className="border-t border-line px-5 py-4 text-sm">
                <span className="mb-1 block text-muted">
                  Ghi chú của tài xế
                </span>
                {trip.driverNotes}
              </p>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Tài xế và phương tiện" />
            <div className="space-y-4 p-5">
              {trip.driver ? (
                <PersonCell
                  person={trip.driver}
                  href={`/users/${trip.driver.id}`}
                />
              ) : (
                <p className="text-sm text-muted">Không có thông tin tài xế.</p>
              )}
              {trip.vehicle ? (
                <dl className="divide-y divide-line border-t border-line pt-2">
                  <Fact label="Xe">
                    {trip.vehicle.make} {trip.vehicle.model} ·{" "}
                    {trip.vehicle.color}
                  </Fact>
                  <Fact label="Biển số">{trip.vehicle.plateNumber}</Fact>
                  <Fact label="Loại xe">
                    {VEHICLE_TYPE[trip.vehicle.vehicleType]}
                  </Fact>
                </dl>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <TripMilestoneAudit trip={trip} />
      <TripChangeAudit tripId={id} />
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/trips"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand-700"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Danh sách chuyến đi
    </Link>
  );
}
