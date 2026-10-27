import { overdueHours } from "@/lib/report-rules";
import type { OperationsOverview, OverviewKpi } from "@/lib/types";
import { getStore, isActiveBooking, VN_OFFSET, type MockBooking } from "./store";

const DAY = 86_400_000;
const BUCKETS = 10;
const ALLOWED_RANGES = [7, 14, 30];

/** Ngày YYYY-MM-DD theo giờ Việt Nam. */
export function vnDateKey(ms: number): string {
  return new Date(ms + VN_OFFSET).toISOString().slice(0, 10);
}

/** 00:00 hôm nay theo giờ Việt Nam, tính bằng mili giây. */
export function startOfVnDay(ms: number): number {
  return Math.floor((ms + VN_OFFSET) / DAY) * DAY - VN_OFFSET;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function percent(part: number, whole: number): number | null {
  return whole > 0 ? round1((part / whole) * 100) : null;
}

/** Phần trăm thay đổi so với kỳ trước; null nếu kỳ trước bằng 0. */
function percentChange(current: number, previous: number): number | null {
  return previous > 0 ? round1(((current - previous) / previous) * 100) : null;
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

/**
 * Số liệu trang tổng quan cho kỳ `rangeDays` ngày gần nhất, so với kỳ liền trước
 * có cùng độ dài. Mọi con số đều tính từ kho dữ liệu mẫu, trừ hai bậc đầu của
 * phễu đặt chỗ (lượt tìm chuyến) vì chưa có nguồn dữ liệu nào ghi lại.
 */
export function buildOperationsOverview(requestedRange: number): OperationsOverview {
  const rangeDays = ALLOWED_RANGES.includes(requestedRange) ? requestedRange : 14;
  const store = getStore();
  const now = Date.now();
  const start = now - rangeDays * DAY;
  const previousStart = start - rangeDays * DAY;
  const bucketSize = (now - start) / BUCKETS;

  const inPeriod = (ms: number) => ms >= start && ms <= now;
  const inPrevious = (ms: number) => ms >= previousStart && ms < start;
  const bucketOf = (ms: number) =>
    Math.min(Math.floor((ms - start) / bucketSize), BUCKETS - 1);
  /** Đếm số phần tử rơi vào từng khoảng thời gian của kỳ. */
  const countSeries = (timestamps: number[]) => {
    const series = new Array<number>(BUCKETS).fill(0);
    for (const ms of timestamps) if (inPeriod(ms)) series[bucketOf(ms)] += 1;
    return series;
  };

  const members = store.users.filter((u) => u.role === "USER");
  const trips = store.trips
    .filter((t) => t.status !== "DRAFT")
    .map((trip) => ({ trip, departure: Date.parse(trip.departureTime) }));
  const periodTrips = trips.filter((t) => inPeriod(t.departure));
  const previousTrips = trips.filter((t) => inPrevious(t.departure));
  const requests = store.bookings.filter((b) => inPeriod(b.createdAt));
  const previousRequests = store.bookings.filter((b) => inPrevious(b.createdAt));

  // ----- Người dùng -----
  const joinedAt = members.map((u) => Date.parse(u.createdAt));
  const totalNow = joinedAt.filter((ms) => ms <= now).length;
  const totalBefore = joinedAt.filter((ms) => ms < start).length;

  // ----- Tài xế và khách hoạt động -----
  const tripsPerDriver = new Map<string, number>();
  for (const { trip } of periodTrips) {
    tripsPerDriver.set(trip.driverId, (tripsPerDriver.get(trip.driverId) ?? 0) + 1);
  }
  const repeatDrivers = [...tripsPerDriver.values()].filter((n) => n >= 2).length;
  const previousDrivers = new Set(previousTrips.map((t) => t.trip.driverId)).size;
  const distinctPerBucket = <T,>(items: T[], at: (item: T) => number, id: (item: T) => string) => {
    const sets = Array.from({ length: BUCKETS }, () => new Set<string>());
    for (const item of items) sets[bucketOf(at(item))].add(id(item));
    return sets.map((set) => set.size);
  };

  const isRealRequest = (b: MockBooking) => b.status !== "REJECTED" && b.status !== "EXPIRED";
  const rides = requests.filter(isRealRequest);
  const passengers = new Set(rides.map((b) => b.passengerId)).size;
  const previousPassengers = new Set(
    previousRequests.filter(isRealRequest).map((b) => b.passengerId),
  ).size;

  // ----- Chuyến hôm nay -----
  const todayStart = startOfVnDay(now);
  const departuresOn = (dayStart: number) =>
    trips.filter((t) => t.departure >= dayStart && t.departure < dayStart + DAY);
  const today = departuresOn(todayStart);
  const hourCounts = new Map<number, number>();
  for (const { departure } of today) {
    const hour = new Date(departure + VN_OFFSET).getUTCHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }
  const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0];

  // ----- Đặt chỗ -----
  const isConfirmed = (b: MockBooking) => b.status === "CONFIRMED" || b.status === "COMPLETED";
  const confirmed = requests.filter(isConfirmed);
  const responded = requests.filter((b) => b.respondedAt !== null);
  const fastResponses = responded.filter(
    (b) => b.respondedAt! - b.createdAt <= 15 * 60_000,
  ).length;

  // ----- Chuyến hoàn thành và bị huỷ -----
  const byStatus = (list: typeof trips, status: string) =>
    list.filter((t) => t.trip.status === status);
  const completed = byStatus(periodTrips, "COMPLETED");
  const cancelled = byStatus(periodTrips, "CANCELLED");
  const finished = periodTrips.filter((t) =>
    ["COMPLETED", "CANCELLED", "EXPIRED"].includes(t.trip.status),
  );

  // ----- Chất lượng ghép -----
  const matched = requests.filter((b) => isActiveBooking(b.status));
  const previousMatched = previousRequests.filter((b) => isActiveBooking(b.status));
  const overlap = average(matched.map((b) => b.overlapPercent)) ?? 0;
  const previousOverlap = average(previousMatched.map((b) => b.overlapPercent));
  const detour = average(matched.map((b) => b.detourKm)) ?? 0;
  const previousDetour = average(previousMatched.map((b) => b.detourKm));
  const overlapSeries = (() => {
    const groups = Array.from({ length: BUCKETS }, () => [] as number[]);
    for (const b of matched) groups[bucketOf(b.createdAt)].push(b.overlapPercent);
    let last = overlap;
    // Khoảng không có đặt chỗ giữ giá trị của khoảng trước để biểu đồ không tụt về 0.
    return groups.map((group) => (last = round1(average(group) ?? last)));
  })();

  const kpis: OverviewKpi[] = [
    {
      key: "TOTAL_USERS",
      value: totalNow,
      delta: percentChange(totalNow, totalBefore),
      deltaUnit: "PERCENT",
      series: Array.from({ length: BUCKETS }, (_, i) => {
        const bucketEnd = start + (i + 1) * bucketSize;
        return joinedAt.filter((ms) => ms <= bucketEnd).length;
      }),
      secondaryValue: totalNow - totalBefore,
    },
    {
      key: "ACTIVE_DRIVERS",
      value: tripsPerDriver.size,
      delta: percentChange(tripsPerDriver.size, previousDrivers),
      deltaUnit: "PERCENT",
      series: distinctPerBucket(periodTrips, (t) => t.departure, (t) => t.trip.driverId),
      secondaryValue: percent(repeatDrivers, tripsPerDriver.size),
    },
    {
      key: "ACTIVE_PASSENGERS",
      value: passengers,
      delta: percentChange(passengers, previousPassengers),
      deltaUnit: "PERCENT",
      series: distinctPerBucket(rides, (b) => b.createdAt, (b) => b.passengerId),
      secondaryValue: passengers > 0 ? round1(rides.length / passengers / (rangeDays / 7)) : null,
    },
    {
      key: "TRIPS_TODAY",
      value: today.length,
      delta: percentChange(today.length, departuresOn(todayStart - DAY).length),
      deltaUnit: "PERCENT",
      series: Array.from(
        { length: BUCKETS },
        (_, i) => departuresOn(todayStart - (BUCKETS - 1 - i) * DAY).length,
      ),
      secondaryValue: peakHour ?? null,
    },
    {
      key: "CONFIRMED_BOOKINGS",
      value: confirmed.length,
      delta: percentChange(confirmed.length, previousRequests.filter(isConfirmed).length),
      deltaUnit: "PERCENT",
      series: countSeries(confirmed.map((b) => b.createdAt)),
      secondaryValue: percent(fastResponses, responded.length),
    },
    {
      key: "COMPLETED_TRIPS",
      value: completed.length,
      delta: percentChange(completed.length, byStatus(previousTrips, "COMPLETED").length),
      deltaUnit: "PERCENT",
      series: countSeries(completed.map((t) => t.departure)),
      secondaryValue: percent(completed.length, finished.length),
    },
    {
      key: "CANCELLED_TRIPS",
      value: cancelled.length,
      delta: percentChange(cancelled.length, byStatus(previousTrips, "CANCELLED").length),
      deltaUnit: "PERCENT",
      series: countSeries(cancelled.map((t) => t.departure)),
      secondaryValue: percent(cancelled.length, periodTrips.length),
    },
    {
      key: "AVERAGE_MATCH_RATE",
      value: round1(overlap),
      delta: previousOverlap === null ? null : round1(overlap - previousOverlap),
      deltaUnit: "POINTS",
      series: overlapSeries,
      secondaryValue: null,
    },
  ];

  const dailyTrips = Array.from({ length: rangeDays }, (_, i) => {
    const dayStart = todayStart - (rangeDays - 1 - i) * DAY;
    const departures = departuresOn(dayStart);
    return {
      date: vnDateKey(dayStart),
      posted: departures.length,
      completed: departures.filter((t) => t.trip.status === "COMPLETED").length,
    };
  });

  // Lượt tìm chuyến chưa được ghi lại ở đâu, nên hai bậc đầu là số ước lượng từ số yêu cầu.
  const matchedSearches = Math.round(requests.length * 3.6);
  const funnel = {
    searches: Math.round(matchedSearches * 1.24),
    matchedSearches,
    bookingRequests: requests.length,
    approvedBookings: confirmed.length,
  };

  const pending = [
    ...store.driverVerifications.filter((d) => d.status === "PENDING"),
    ...store.vehicleVerifications.filter((d) => d.status === "PENDING"),
  ];
  const openViolations = store.violations.filter((v) => !v.isForgiven);
  const openReports = store.reports.filter((r) => r.status === "OPEN");
  const violationsPerDriver = new Map<string, number>();
  for (const v of openViolations) {
    violationsPerDriver.set(v.driverId, (violationsPerDriver.get(v.driverId) ?? 0) + 1);
  }
  const usersToReview = members.filter(
    (u) =>
      (violationsPerDriver.get(u.id) ?? 0) >= 2 ||
      u.ratingAsPassenger < 3.5 ||
      (u.driverProfile !== null && u.ratingAsDriver < 3.5),
  ).length;

  return {
    generatedAt: new Date(now).toISOString(),
    rangeDays,
    kpis,
    dailyTrips,
    funnel,
    matching: {
      averageOverlapPercent: round1(overlap),
      overlapDeltaPoints: previousOverlap === null ? null : round1(overlap - previousOverlap),
      averageDetourKm: round1(detour),
      detourDeltaKm: previousDetour === null ? null : round1(detour - previousDetour),
    },
    safety: {
      pendingVerifications: pending.length,
      overdueVerifications: pending.filter((d) => now - Date.parse(d.createdAt) > DAY).length,
      openViolations: openViolations.length,
      passengerReportViolations: openViolations.filter(
        (v) => v.violationType === "PASSENGER_REPORT",
      ).length,
      usersToReview,
      openReports: openReports.length,
      overdueReports: openReports.filter((r) => overdueHours(r, now) !== null).length,
      unresolvedSos: store.sosEvents.filter((e) => e.resolvedAt === null).length,
    },
  };
}
