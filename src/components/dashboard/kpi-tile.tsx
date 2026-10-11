import { Card } from "@/components/ui/misc";
import type { OverviewKpi, OverviewKpiKey } from "@/lib/types";
import { cn, formatDecimal, formatNumber, formatSigned } from "@/lib/utils";

interface KpiMeta {
  label: string;
  /** Chỉ số mà tăng lên là xấu (ví dụ số chuyến bị huỷ). */
  lowerIsBetter?: boolean;
  /** Chỉ số nổi bật được tô màu thay vì màu chữ thường. */
  emphasis?: "good" | "warn";
  value?: (value: number) => string;
  note: (secondary: number | null, rangeDays: number) => string;
}

const hour = (value: number) => `${String(value % 24).padStart(2, "0")}:00`;

const KPI_META: Record<OverviewKpiKey, KpiMeta> = {
  TOTAL_USERS: {
    label: "Tổng người dùng",
    note: (n, range) => `+${formatNumber(n ?? 0)} trong ${range} ngày`,
  },
  ACTIVE_DRIVERS: {
    label: "Tài xế hoạt động",
    note: (n) => (n === null ? "chưa có chuyến trong kỳ" : `${formatDecimal(n)}% đăng từ 2 chuyến`),
  },
  ACTIVE_PASSENGERS: {
    label: "Khách hoạt động",
    note: (n) =>
      n === null ? "chưa có đặt chỗ trong kỳ" : `${formatDecimal(n)} chuyến / khách / tuần`,
  },
  TRIPS_TODAY: {
    label: "Chuyến hôm nay",
    note: (n) => (n === null ? "chưa có chuyến hôm nay" : `cao điểm ${hour(n)}–${hour(n + 2)}`),
  },
  CONFIRMED_BOOKINGS: {
    label: "Đặt chỗ đã xác nhận",
    note: (n) =>
      n === null ? "chưa có yêu cầu trong kỳ" : `${formatDecimal(n)}% phản hồi dưới 15 phút`,
  },
  COMPLETED_TRIPS: {
    label: "Chuyến hoàn thành",
    note: (n) =>
      n === null ? "chưa có chuyến kết thúc" : `${formatDecimal(n)}% trên chuyến đã kết thúc`,
  },
  CANCELLED_TRIPS: {
    label: "Chuyến bị huỷ",
    lowerIsBetter: true,
    emphasis: "warn",
    note: (n) => (n === null ? "chưa có chuyến trong kỳ" : `${formatDecimal(n)}% tổng số chuyến`),
  },
  AVERAGE_MATCH_RATE: {
    label: "Tỷ lệ trùng tuyến",
    emphasis: "good",
    value: (value) => `${formatDecimal(value)}%`,
    note: () => "mục tiêu nội bộ 85%",
  },
};

export function KpiTile({ kpi, rangeDays }: { kpi: OverviewKpi; rangeDays: number }) {
  const meta = KPI_META[kpi.key];
  const warn = meta.emphasis === "warn";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted">{meta.label}</p>
        <DeltaBadge
          delta={kpi.delta}
          suffix={kpi.deltaUnit === "POINTS" ? " điểm" : "%"}
          lowerIsBetter={meta.lowerIsBetter}
          title={
            kpi.key === "TRIPS_TODAY" ? "So với hôm qua" : `So với ${rangeDays} ngày trước đó`
          }
        />
      </div>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tracking-tight tabular-nums",
          warn && "text-orange-700",
          meta.emphasis === "good" && "text-brand-700",
        )}
      >
        {meta.value ? meta.value(kpi.value) : formatNumber(kpi.value)}
      </p>
      <Sparkline series={kpi.series} warn={warn} />
      <p className="mt-3 text-sm text-muted">{meta.note(kpi.secondaryValue, rangeDays)}</p>
    </Card>
  );
}

/** Nhãn mức thay đổi: xanh khi thay đổi có lợi, cam khi bất lợi, xám khi không đổi. */
export function DeltaBadge({
  delta,
  suffix,
  lowerIsBetter = false,
  title,
}: {
  delta: number | null;
  suffix: string;
  lowerIsBetter?: boolean;
  title?: string;
}) {
  if (delta === null) {
    return (
      <span
        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-muted"
        title="Kỳ trước không có dữ liệu để so sánh"
      >
        —
      </span>
    );
  }
  const favorable = lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <span
      title={title}
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums",
        delta === 0
          ? "bg-gray-100 text-muted"
          : favorable
            ? "bg-brand-50 text-brand-700"
            : "bg-orange-50 text-orange-700",
      )}
    >
      {formatSigned(delta, suffix)}
    </span>
  );
}

/** Biểu đồ cột nhỏ cho xu hướng trong kỳ; cột cuối (gần nhất) được tô đậm. */
function Sparkline({ series, warn }: { series: number[]; warn: boolean }) {
  const max = Math.max(...series, 1);
  return (
    <div className="mt-3 flex h-8 items-end gap-0.5" aria-hidden>
      {series.map((value, index) => (
        <span
          key={index}
          className={cn(
            "flex-1 rounded-t-sm",
            index === series.length - 1
              ? warn
                ? "bg-orange-600"
                : "bg-brand-600"
              : "bg-gray-200",
          )}
          style={{ height: `${Math.max((value / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}
