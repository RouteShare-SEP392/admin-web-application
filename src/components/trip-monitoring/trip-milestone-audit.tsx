"use client";

import {
  AlertCircle,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  User,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/misc";
import type { Tone } from "@/lib/labels";
import type { Trip } from "@/lib/types";
import { cn, formatDateTime, formatTime } from "@/lib/utils";

export interface VarianceResult {
  minutes: number;
  label: string;
  shortLabel: string;
  tone: Tone;
  isOverdue?: boolean;
}

export function computeDepartureVariance(
  plannedIso: string,
  actualIso?: string | null,
  status?: string,
): VarianceResult {
  const planned = Date.parse(plannedIso);
  const now = Date.now();

  if (!actualIso) {
    if (status === "COMPLETED" || status === "IN_PROGRESS" || status === "EXPIRED") {
      return { minutes: 0, label: "Không có mốc xuất phát được lưu", shortLabel: "Thiếu dữ liệu", tone: "neutral" };
    }
    if (status === "CANCELLED") {
      return {
        minutes: 0,
        label: "Đã huỷ trước khi chạy",
        shortLabel: "Đã huỷ",
        tone: "neutral",
      };
    }
    const diffMinutes = Math.round((now - planned) / 60_000);
    if (diffMinutes > 10 && status === "PUBLISHED") {
      return {
        minutes: diffMinutes,
        label: `Chưa xuất phát (Quá ${diffMinutes} phút)`,
        shortLabel: `Quá giờ ${diffMinutes}p`,
        tone: "bad",
        isOverdue: true,
      };
    }
    return {
      minutes: 0,
      label: "Chờ xuất phát",
      shortLabel: "Chờ chạy",
      tone: "neutral",
    };
  }

  const actual = Date.parse(actualIso);
  const diffMinutes = Math.round((actual - planned) / 60_000);

  if (diffMinutes <= -6) {
    return {
      minutes: diffMinutes,
      label: `Sớm ${Math.abs(diffMinutes)} phút`,
      shortLabel: `Sớm ${Math.abs(diffMinutes)}p`,
      tone: "active",
    };
  }
  if (diffMinutes >= -5 && diffMinutes <= 5) {
    return {
      minutes: diffMinutes,
      label: diffMinutes === 0 ? "Đúng giờ tuyệt đối" : `Đúng giờ (${diffMinutes > 0 ? `+${diffMinutes}` : diffMinutes}p)`,
      shortLabel: "Đúng giờ",
      tone: "good",
    };
  }
  if (diffMinutes > 5 && diffMinutes <= 15) {
    return {
      minutes: diffMinutes,
      label: `Khởi hành trễ ${diffMinutes} phút`,
      shortLabel: `Trễ ${diffMinutes}p`,
      tone: "pending",
    };
  }
  return {
    minutes: diffMinutes,
    label: `Khởi hành trễ ${diffMinutes} phút (Nghiêm trọng)`,
    shortLabel: `Trễ ${diffMinutes}p`,
    tone: "bad",
  };
}

export function computePickupVariance(
  plannedIso: string,
  actualIso?: string | null,
): VarianceResult {
  if (!actualIso) {
    return {
      minutes: 0,
      label: "Chưa tới điểm đón",
      shortLabel: "Chưa tới",
      tone: "neutral",
    };
  }
  const planned = Date.parse(plannedIso);
  const actual = Date.parse(actualIso);
  const diffMinutes = Math.round((actual - planned) / 60_000);

  if (diffMinutes <= -5) {
    return {
      minutes: diffMinutes,
      label: `Đến sớm ${Math.abs(diffMinutes)} phút`,
      shortLabel: `Sớm ${Math.abs(diffMinutes)}p`,
      tone: "active",
    };
  }
  if (diffMinutes >= -4 && diffMinutes <= 5) {
    return {
      minutes: diffMinutes,
      label: "Đón đúng giờ",
      shortLabel: "Đúng giờ",
      tone: "good",
    };
  }
  if (diffMinutes > 5 && diffMinutes <= 15) {
    return {
      minutes: diffMinutes,
      label: `Đón trễ ${diffMinutes} phút`,
      shortLabel: `Trễ ${diffMinutes}p`,
      tone: "pending",
    };
  }
  return {
    minutes: diffMinutes,
    label: `Đón trễ ${diffMinutes} phút (Nghiêm trọng)`,
    shortLabel: `Trễ ${diffMinutes}p`,
    tone: "bad",
  };
}

export function computeWaitMinutes(
  arrivedIso?: string | null,
  boardedIso?: string | null,
): number | null {
  if (!arrivedIso || !boardedIso) return null;
  return Math.max(0, Math.round((Date.parse(boardedIso) - Date.parse(arrivedIso)) / 60_000));
}

export function TripMilestoneAudit({ trip }: { trip: Trip }) {
  if (trip.bookings === undefined) return <Card className="mt-6"><CardHeader title="Mốc hành trình & đặt chỗ" description="Chưa có dữ liệu mốc đặt chỗ từ API quản trị." /><p className="p-5 text-sm text-muted">Không đủ dữ liệu để thống kê lượt đón, thời gian chờ hoặc độ đúng giờ. Thiếu dữ liệu không đồng nghĩa không có hành khách.</p></Card>;
  const depVariance = computeDepartureVariance(
    trip.departureTime,
    trip.actualStartedAt,
    trip.status,
  );

  const bookings = trip.bookings ?? [];
  const evaluatedPickups = bookings.filter((b) => Boolean(b.arrivedAt));
  const onTimePickups = evaluatedPickups.filter(
    (b) => computePickupVariance(b.plannedPickupTime, b.arrivedAt).tone === "good" ||
           computePickupVariance(b.plannedPickupTime, b.arrivedAt).tone === "active",
  );

  const waitTimes = bookings
    .map((b) => computeWaitMinutes(b.arrivedAt, b.boardedAt))
    .filter((w): w is number => w !== null);
  const avgWait = waitTimes.length > 0
    ? Math.round(waitTimes.reduce((acc, v) => acc + v, 0) / waitTimes.length)
    : null;

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader
        title="Giám sát vận hành & Độ đúng giờ"
        description="Đối chiếu các mốc thời gian thực tế với kế hoạch để phát hiện đón trễ, khởi hành sai giờ hoặc chờ khách bất thường."
      />

      {/* Thẻ tổng quan chỉ số SLA */}
      <div className="grid gap-3 border-b border-line p-5 sm:grid-cols-2 lg:grid-cols-4 bg-surface-subtle/40">
        <div className="rounded-xl border border-line bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span className="font-medium">Xuất phát chuyến</span>
            <Clock className="size-4 text-brand-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums">
              {trip.actualStartedAt ? formatTime(trip.actualStartedAt) : "—"}
            </span>
            <span className="text-xs text-muted">
              (Hẹn {formatTime(trip.departureTime)})
            </span>
          </div>
          <div className="mt-2.5">
            <Badge tone={depVariance.tone}>{depVariance.label}</Badge>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span className="font-medium">Đón khách đúng giờ</span>
            <UserCheck className="size-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">
              {evaluatedPickups.length > 0
                ? `${Math.round((onTimePickups.length / evaluatedPickups.length) * 100)}%`
                : "—"}
            </span>
            <span className="text-xs text-muted">
              ({onTimePickups.length}/{evaluatedPickups.length || bookings.length} lượt đón)
            </span>
          </div>
          <p className="mt-2.5 text-xs text-muted">
            {bookings.length === 0
              ? "Chưa có hành khách đặt"
              : evaluatedPickups.length === 0
                ? "Chưa đến mốc đón khách"
                : `${evaluatedPickups.length - onTimePickups.length} lượt bị trễ`}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span className="font-medium">Thời gian đợi khách TB</span>
            <CalendarClock className="size-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums">
              {avgWait !== null ? `${avgWait} phút` : "—"}
            </span>
            <span className="text-xs text-muted">/ khách</span>
          </div>
          <p className="mt-2.5 text-xs text-muted">
            Tính từ lúc tài xế tới đến khi khách lên xe
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span className="font-medium">Về đích / Kết thúc</span>
            <Navigation className="size-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums">
              {trip.actualCompletedAt ? formatTime(trip.actualCompletedAt) : "—"}
            </span>
            <span className="text-xs text-muted">
              (Dự kiến {formatTime(trip.estimatedArrivalTime)})
            </span>
          </div>
          <div className="mt-2.5">
            {trip.actualCompletedAt ? (
              <Badge tone="good">Đã hoàn thành</Badge>
            ) : trip.status === "IN_PROGRESS" ? (
              <Badge tone="active">Đang trên đường</Badge>
            ) : (
              <Badge tone="neutral">Chưa hoàn thành</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Cảnh báo vi phạm nghiêm trọng nếu có */}
      {depVariance.isOverdue && (
        <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <AlertCircle className="size-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">Cảnh báo: Chuyến đi quá giờ khởi hành</p>
            <p className="mt-0.5 text-red-700">
              Chuyến đã quá giờ hẹn {depVariance.minutes} phút nhưng tài xế chưa bấm bắt đầu chuyến. Quản trị viên nên liên hệ tài xế hoặc huỷ chuyến nếu có dấu hiệu bỏ chuyến.
            </p>
          </div>
        </div>
      )}

      {/* Chi tiết từng mốc theo trình tự */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Chi tiết dòng sự kiện hành trình (Milestone Audit Trail)
        </h3>

        <div className="relative border-l-2 border-brand-200 ml-4 space-y-6 pb-2">
          {/* Mốc 1: Xuất phát */}
          <div className="relative pl-6">
            <div className={cn(
              "absolute -left-[17px] top-0.5 flex size-8 items-center justify-center rounded-full border-2 bg-white",
              trip.actualStartedAt ? "border-brand-600 text-brand-700" : "border-gray-300 text-muted"
            )}>
              <Car className="size-4" />
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                  Mốc 1: Khởi hành tại điểm xuất phát
                </span>
                <Badge tone={depVariance.tone}>{depVariance.label}</Badge>
              </div>
              <p className="mt-1 font-medium text-foreground">
                {trip.stops[0]?.stopName ?? "Điểm đi"}
              </p>
              <p className="text-xs text-muted">{trip.stops[0]?.stopAddress}</p>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line/60 pt-3 text-xs sm:grid-cols-3">
                <div>
                  <span className="text-muted block">Giờ hẹn ban đầu:</span>
                  <span className="font-semibold text-foreground">
                    {formatDateTime(trip.departureTime)}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Thực tế bấm chạy:</span>
                  <span className={cn("font-semibold", trip.actualStartedAt ? "text-foreground" : "text-amber-600")}>
                    {trip.actualStartedAt ? formatDateTime(trip.actualStartedAt) : "Chưa bấm"}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Độ lệch:</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {depVariance.minutes > 0 ? `+${depVariance.minutes} phút` : `${depVariance.minutes} phút`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mốc 2: Danh sách đón khách */}
          {bookings.map((booking, index) => {
            const pickVar = computePickupVariance(booking.plannedPickupTime, booking.arrivedAt);
            const waitTime = computeWaitMinutes(booking.arrivedAt, booking.boardedAt);

            return (
              <div key={booking.id} className="relative pl-6">
                <div className={cn(
                  "absolute -left-[17px] top-0.5 flex size-8 items-center justify-center rounded-full border-2 bg-white",
                  booking.boardedAt
                    ? "border-emerald-600 text-emerald-600"
                    : booking.arrivedAt
                      ? "border-amber-500 text-amber-600"
                      : "border-gray-300 text-muted"
                )}>
                  <User className="size-4" />
                </div>
                <div className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Đón khách #{index + 1}: {booking.passengerName}
                      </span>
                      <span className="text-xs text-muted">
                        ({booking.seatsBooked} ghế · SĐT: {booking.passengerPhone || "—"})
                      </span>
                    </div>
                    <Badge tone={pickVar.tone}>{pickVar.label}</Badge>
                  </div>

                  <div className="mt-2 flex items-start gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-brand-600 mt-0.5" />
                    <div>
                      <span className="font-medium text-foreground">{booking.pickupLabel}</span>
                      <span className="text-xs text-muted block">
                        Đích đến: {booking.dropoffLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line/60 pt-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-muted block">Giờ hẹn đón:</span>
                      <span className="font-semibold text-foreground">
                        {formatTime(booking.plannedPickupTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Tài xế đến nơi:</span>
                      <span className={cn("font-semibold", booking.arrivedAt ? "text-foreground" : "text-muted")}>
                        {booking.arrivedAt ? formatTime(booking.arrivedAt) : "Đang tới"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Khách lên xe:</span>
                      <span className={cn("font-semibold", booking.boardedAt ? "text-emerald-700" : "text-muted")}>
                        {booking.boardedAt ? formatTime(booking.boardedAt) : "Chưa lên"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Thời gian đợi:</span>
                      <span className={cn("font-semibold tabular-nums", waitTime && waitTime > 10 ? "text-amber-700" : "text-foreground")}>
                        {waitTime !== null ? `${waitTime} phút` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Mốc 3: Điểm đến kết thúc */}
          <div className="relative pl-6">
            <div className={cn(
              "absolute -left-[17px] top-0.5 flex size-8 items-center justify-center rounded-full border-2 bg-white",
              trip.actualCompletedAt ? "border-brand-900 bg-accent text-brand-900" : "border-gray-300 text-muted"
            )}>
              <CheckCircle2 className="size-4" />
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
                  Điểm đến cuối & Hoàn thành chuyến
                </span>
                {trip.actualCompletedAt ? (
                  <Badge tone="good">Đã hoàn thành</Badge>
                ) : (
                  <Badge tone="neutral">Chưa kết thúc</Badge>
                )}
              </div>
              <p className="mt-1 font-medium text-foreground">
                {trip.stops[trip.stops.length - 1]?.stopName ?? "Điểm đến"}
              </p>
              <p className="text-xs text-muted">
                {trip.stops[trip.stops.length - 1]?.stopAddress}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line/60 pt-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-muted block">Dự kiến kết thúc:</span>
                  <span className="font-semibold text-foreground">
                    {formatDateTime(trip.estimatedArrivalTime)}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Thời điểm thực tế:</span>
                  <span className="font-semibold text-foreground">
                    {trip.actualCompletedAt ? formatDateTime(trip.actualCompletedAt) : "Đang xử lý"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

