import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/misc";
import type { OperationsOverview } from "@/lib/types";
import { cn, formatDecimal, formatNumber } from "@/lib/utils";
import { DeltaBadge } from "./kpi-tile";

/** Phễu từ lượt tìm chuyến đến đặt chỗ được tài xế duyệt. */
export function BookingFunnelCard({ funnel }: { funnel: OperationsOverview["funnel"] }) {
  const steps = [
    { label: "Lượt tìm chuyến", value: funnel.searches, bar: "bg-gray-300" },
    { label: "Có kết quả trùng tuyến", value: funnel.matchedSearches, bar: "bg-brand-200" },
    { label: "Gửi yêu cầu đặt chỗ", value: funnel.bookingRequests, bar: "bg-brand-400" },
    { label: "Được tài xế duyệt", value: funnel.approvedBookings, bar: "bg-brand-600" },
  ];
  const top = Math.max(funnel.searches, 1);
  const conversion = (funnel.approvedBookings / top) * 100;

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">Tỷ lệ chuyển đổi đặt chỗ</h2>
        <p className="text-xl font-semibold text-brand-700 tabular-nums">
          {formatDecimal(conversion)}%
        </p>
      </div>
      <ol className="mt-4 space-y-4">
        {steps.map((step) => (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted">{step.label}</span>
              <span className="font-semibold tabular-nums">{formatNumber(step.value)}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-gray-100">
              <div
                className={cn("h-full rounded-full", step.bar)}
                style={{ width: `${(step.value / top) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-subtle">
        Hai bậc đầu là số ước lượng: hệ thống chưa ghi lại lượt tìm chuyến.
      </p>
    </Card>
  );
}

export function MatchingQualityCard({
  matching,
}: {
  matching: OperationsOverview["matching"];
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Chất lượng ghép tuyến</h2>
      <div className="mt-4 space-y-5">
        <div className="flex items-center gap-4">
          <OverlapRing percent={matching.averageOverlapPercent} />
          <div>
            <p className="font-medium">Trùng tuyến trung bình</p>
            <p className="text-sm text-muted">
              Phần lộ trình của tài xế mà khách thực sự đi cùng
            </p>
            <div className="mt-1.5">
              <DeltaBadge
                delta={matching.overlapDeltaPoints}
                suffix=" điểm"
                title="So với kỳ liền trước"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-full border-[6px] border-orange-100 leading-none">
            <span className="text-lg font-semibold text-orange-700 tabular-nums">
              {formatDecimal(matching.averageDetourKm)}
            </span>
            <span className="mt-0.5 text-xs text-muted">km</span>
          </div>
          <div>
            <p className="font-medium">Đi vòng trung bình</p>
            <p className="text-sm text-muted">
              Quãng đường tài xế đi thêm để đón và trả mỗi khách
            </p>
            <div className="mt-1.5">
              <DeltaBadge
                delta={matching.detourDeltaKm}
                suffix=" km"
                lowerIsBetter
                title="So với kỳ liền trước"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Vòng tròn tiến độ cho một tỷ lệ phần trăm. */
function OverlapRing({ percent }: { percent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

  return (
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
        <circle cx={40} cy={40} r={radius} fill="none" strokeWidth={8} className="stroke-brand-100" />
        <circle
          cx={40}
          cy={40}
          r={radius}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="stroke-brand-600"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-brand-700 tabular-nums">
          {formatDecimal(Math.round(percent))}%
        </span>
      </div>
    </div>
  );
}

type QueueTone = "warn" | "bad" | "neutral";

const QUEUE_TONES: Record<QueueTone, { count: string; tag: string }> = {
  warn: { count: "bg-orange-50 text-orange-700", tag: "bg-orange-50 text-orange-700" },
  bad: { count: "bg-red-50 text-red-700", tag: "bg-red-50 text-red-700" },
  neutral: { count: "bg-gray-100 text-ink", tag: "bg-gray-100 text-muted" },
};

/** Các hàng đợi cần quản trị viên xử lý, mỗi dòng dẫn tới trang tương ứng. */
export function SafetyQueueCard({ safety }: { safety: OperationsOverview["safety"] }) {
  const overdue = safety.overdueVerifications > 0;
  const rows: {
    href: string;
    count: number;
    title: string;
    detail: string;
    tag: string;
    tone: QueueTone;
  }[] = [
    {
      href: "/verifications/drivers",
      count: safety.pendingVerifications,
      title: "Hồ sơ chờ duyệt",
      detail: overdue
        ? `${safety.overdueVerifications} hồ sơ chờ quá 24 giờ`
        : "giấy tờ tài xế và phương tiện",
      tag: overdue ? "Ưu tiên" : "Hàng đợi",
      tone: overdue ? "warn" : "neutral",
    },
    {
      href: "/violations",
      count: safety.openViolations,
      title: "Vi phạm còn hiệu lực",
      detail: `${safety.passengerReportViolations} do hành khách báo cáo`,
      tag: "Đang xử lý",
      tone: safety.openViolations > 0 ? "bad" : "neutral",
    },
    {
      href: "/violations",
      count: safety.usersToReview,
      title: "Tài xế cần xem xét",
      detail: "đánh giá dưới 3,5 hoặc vi phạm nhiều lần",
      tag: "Hàng đợi",
      tone: "neutral",
    },
  ];

  return (
    <Card className="border-orange-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <CircleAlert className="size-5 text-orange-600" aria-hidden />
          An toàn & kiểm duyệt
        </h2>
        <Link
          href="/verifications/drivers"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Mở hàng đợi
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((row) => (
          <li key={row.title}>
            <Link
              href={row.href}
              className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-brand-50/60"
            >
              <span
                className={cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold tabular-nums",
                  QUEUE_TONES[row.tone].count,
                )}
              >
                {formatNumber(row.count)}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-medium">{row.title}</span>
                <span className="block text-sm text-muted">{row.detail}</span>
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                  QUEUE_TONES[row.tone].tag,
                )}
              >
                {row.tag}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
