"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { ArrowLeft, Ban } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PersonCell } from "@/components/person-cell";
import { RouteSketch } from "@/components/route-sketch";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  ErrorState,
  Fact,
  MockBadge,
  TableSkeleton,
} from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { CANCEL_TRIP, TRIP_DETAIL } from "@/lib/graphql";
import { LUGGAGE, STOP_TYPE, TRIP_STATUS, VEHICLE_TYPE } from "@/lib/labels";
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { TripStop } from "@/lib/types";
import {
  cn,
  errorMessage,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatTime,
} from "@/lib/utils";

export function TripDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(TRIP_DETAIL, { variables: { id } });
  const [cancel, { loading: cancelling }] = useMutation(CANCEL_TRIP);
  const notify = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const trip = data?.adminTrip;

  if (!trip) {
    return (
      <>
        <BackLink />
        <Card>
          {loading ? <TableSkeleton /> : <ErrorState error={error} onRetry={() => refetch()} />}
        </Card>
      </>
    );
  }

  const stops = trip.stops
    .filter((stop): stop is TripStop => stop !== null)
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  async function handleCancel(reason: string) {
    setCancelError(null);
    try {
      await cancel({ variables: { input: { tripId: id, reason } } });
      setCancelOpen(false);
      notify("Đã huỷ chuyến đi.");
    } catch (cause) {
      setCancelError(errorMessage(cause));
    }
  }

  return (
    <>
      <BackLink />

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge meta={TRIP_STATUS[trip.status]} />
            {isProposedApiMocked() ? <MockBadge /> : null}
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
          <Button variant="danger" onClick={() => setCancelOpen(true)}>
            <Ban className="size-4" aria-hidden />
            Huỷ chuyến
          </Button>
        ) : null}
      </Card>

      {trip.status === "CANCELLED" ? (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-semibold">
            Chuyến đã bị huỷ
            {trip.cancelledBy
              ? trip.cancelledBy === trip.driverId
                ? " bởi tài xế"
                : " bởi quản trị viên"
              : ""}
            .
          </span>{" "}
          {trip.cancellationReason ? `Lý do: ${trip.cancellationReason}` : null}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader
            title="Lộ trình"
            description={`${formatNumber(trip.totalDistanceKm)} km · ${formatDuration(trip.totalDurationMinutes)}`}
          />
          <div className="space-y-5 p-5">
            <RouteSketch stops={stops} polyline={trip.routePolyline} />
            <ol>
              {stops.map((stop, index) => (
                <li key={stop.id} className="relative flex gap-4 pb-5 last:pb-0">
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
                        ? "border-brand-900 bg-accent"
                        : "border-brand-700 bg-white",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium">{stop.stopName}</p>
                      <p className="text-sm text-muted tabular-nums">
                        {formatTime(
                          index === 0 ? stop.plannedDepartureTime : stop.plannedArrivalTime,
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

        <div className="space-y-6">
          <Card>
            <CardHeader title="Thông tin chuyến" />
            <dl className="divide-y divide-line px-5 py-2">
              <Fact label="Ghế trống / ghế chia sẻ">
                {trip.availableSeats}/{trip.totalSeatsOffered}
              </Fact>
              <Fact label="Giá mỗi km, mỗi ghế">
                {trip.pricing ? formatCurrency(trip.pricing.baseCostPerKm) : "—"}
              </Fact>
              <Fact label="Tổng chi phí chia sẻ ước tính">
                {trip.pricing ? formatCurrency(trip.pricing.totalEstimatedFare) : "—"}
              </Fact>
              <Fact label="Hành lý">{LUGGAGE[trip.luggageAllowed]}</Fact>
              <Fact label="Đặt chỗ">
                {trip.isInstantBooking ? "Xác nhận ngay" : "Tài xế duyệt từng yêu cầu"}
              </Fact>
              <Fact label="Tạo lúc">{formatDateTime(trip.createdAt)}</Fact>
            </dl>
            {trip.driverNotes ? (
              <p className="border-t border-line px-5 py-4 text-sm">
                <span className="mb-1 block text-muted">Ghi chú của tài xế</span>
                {trip.driverNotes}
              </p>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Tài xế và phương tiện" />
            <div className="space-y-4 p-5">
              {trip.driver ? (
                <PersonCell person={trip.driver} href={`/users/${trip.driver.id}`} />
              ) : (
                <p className="text-sm text-muted">Không có thông tin tài xế.</p>
              )}
              {trip.vehicle ? (
                <dl className="divide-y divide-line border-t border-line pt-2">
                  <Fact label="Xe">
                    {trip.vehicle.make} {trip.vehicle.model} · {trip.vehicle.color}
                  </Fact>
                  <Fact label="Biển số">{trip.vehicle.plateNumber}</Fact>
                  <Fact label="Loại xe">{VEHICLE_TYPE[trip.vehicle.vehicleType]}</Fact>
                </dl>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <ReasonDialog
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setCancelError(null);
        }}
        title="Huỷ chuyến đi này?"
        description="Chuyến sẽ đóng đặt chỗ và không thể mở lại. Chỉ huỷ khi chuyến vi phạm quy định."
        reasonLabel="Lý do huỷ"
        confirmLabel="Huỷ chuyến"
        danger
        busy={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
      />
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
