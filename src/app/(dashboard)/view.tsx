"use client";

import { useQuery } from "@apollo/client/react";
import { Download, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DailyTripsChart } from "@/components/dashboard/daily-trips-chart";
import {
  BookingFunnelCard,
  MatchingQualityCard,
  SafetyQueueCard,
} from "@/components/dashboard/insight-cards";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { RecentTrips } from "@/components/dashboard/recent-trips";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, ErrorState, MockBadge, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { OPERATIONS_OVERVIEW, type RecentTripFilter } from "@/lib/graphql";
import { isProposedApiMocked } from "@/lib/mock-mode";
import { useUrlState } from "@/lib/use-url-state";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

const RANGES = [7, 14, 30] as const;
type RangeDays = (typeof RANGES)[number];
const RANGE_PARAMS = ["7", "14", "30"] as const;
const TRIP_FILTERS = [
  "lowMatch",
  "hasViolation",
  "today",
] as const satisfies readonly RecentTripFilter[];

export function DashboardView() {
  // Kỳ và bộ lọc chuyến nằm trên URL: /?range=30&filter=lowMatch
  const url = useUrlState();
  const rangeDays = (Number(url.getOption("range", RANGE_PARAMS)) || 14) as RangeDays;
  const tripFilter = url.getOption("filter", TRIP_FILTERS) || "all";
  const [exporting, setExporting] = useState(false);
  const notify = useToast();

  const { data, previousData, loading, error, refetch } = useQuery(OPERATIONS_OVERVIEW, {
    variables: { rangeDays },
  });
  // Giữ số liệu của kỳ cũ trên màn hình trong lúc tải kỳ mới.
  const overview = (data ?? previousData)?.adminOperationsOverview;

  /** Tải file CSV theo đúng kỳ và bộ lọc chuyến đang chọn trên trang. */
  async function exportCsv() {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/export/trips?rangeDays=${rangeDays}&filter=${tripFilter}`,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        notify(payload?.message ?? "Không xuất được dữ liệu. Vui lòng thử lại.", "error");
        return;
      }
      const fileName =
        /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ??
        "routeshare-chuyen-di.csv";
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      notify(
        `Đã xuất ${formatNumber(Number(response.headers.get("x-row-count") ?? 0))} chuyến ra file CSV.`,
      );
    } catch {
      notify("Không kết nối được máy chủ. Vui lòng thử lại.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Tổng quan vận hành</h1>
            {isProposedApiMocked() ? <MockBadge /> : null}
          </div>
          <p className="mt-1 text-sm text-muted">
            {overview
              ? `Cập nhật ${formatDateTime(overview.generatedAt)} · múi giờ GMT+7`
              : "Đang tải số liệu…"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-lg bg-gray-100 p-1"
            role="group"
            aria-label="Khoảng thời gian"
          >
            {RANGES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={rangeDays === option}
                onClick={() => url.setParams({ range: option === 14 ? null : option })}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  rangeDays === option
                    ? "bg-white text-brand-800 shadow-sm"
                    : "text-muted hover:text-ink",
                )}
              >
                {option} ngày
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={exportCsv} disabled={exporting}>
            <Download className="size-4" aria-hidden />
            {exporting ? "Đang xuất…" : "Xuất CSV"}
          </Button>
          <Link href="/reports" className={buttonClass("primary")}>
            <ShieldAlert className="size-4" aria-hidden />
            Xem báo cáo an toàn
          </Link>
        </div>
      </div>

      {!overview && loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : !overview ? (
        <Card>
          <ErrorState error={error} onRetry={() => refetch()} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overview.kpis.map((kpi) => (
              <KpiTile key={kpi.key} kpi={kpi} rangeDays={overview.rangeDays} />
            ))}
          </div>

          <DailyTripsChart days={overview.dailyTrips} />

          <div className="grid gap-6 lg:grid-cols-3">
            <BookingFunnelCard funnel={overview.funnel} />
            <MatchingQualityCard matching={overview.matching} />
            <SafetyQueueCard safety={overview.safety} />
          </div>

          <RecentTrips
            filter={tripFilter}
            onFilterChange={(next) => url.setParams({ filter: next === "all" ? null : next })}
          />
        </div>
      )}
    </>
  );
}
