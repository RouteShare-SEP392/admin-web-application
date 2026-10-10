"use client";

import { useQuery } from "@apollo/client/react";
import {
  Car,
  ChevronRight,
  IdCard,
  Route,
  ShieldAlert,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui/misc";
import { DASHBOARD_STATS } from "@/lib/graphql";
import { TRIP_STATUS } from "@/lib/labels";
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { DashboardStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function DashboardView() {
  const { data, loading, error, refetch } = useQuery(DASHBOARD_STATS);
  const stats = data?.adminDashboardStats;

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Tình hình hoạt động của nền tảng và các việc đang chờ xử lý."
        mocked={isProposedApiMocked()}
      />

      {!stats && loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !stats ? (
        <Card>
          <ErrorState error={error} onRetry={() => refetch()} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={Users}
              label="Người dùng"
              value={stats.totalUsers}
              note={`+${formatNumber(stats.newUsersLast7Days)} trong 7 ngày qua`}
            />
            <StatTile
              icon={UserCheck}
              label="Tài xế đã duyệt"
              value={stats.approvedDrivers}
              note="Đủ điều kiện đăng chuyến"
            />
            <StatTile
              icon={Route}
              label="Chuyến đang hoạt động"
              value={stats.activeTrips}
              note="Đang mở đặt chỗ hoặc đang chạy"
            />
            <StatTile
              icon={IdCard}
              label="Hồ sơ chờ duyệt"
              value={stats.pendingDriverVerifications + stats.pendingVehicleVerifications}
              note="Giấy tờ tài xế và phương tiện"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <Card>
              <CardHeader
                title="Người dùng mới"
                description="Số tài khoản đăng ký mỗi ngày trong 7 ngày qua"
              />
              <SignupsChart days={stats.signupsByDay} />
            </Card>

            <Card>
              <CardHeader title="Việc cần xử lý" />
              <ul className="divide-y divide-line">
                <TaskLink
                  href="/verifications/drivers"
                  icon={IdCard}
                  label="Giấy tờ tài xế chờ duyệt"
                  count={stats.pendingDriverVerifications}
                />
                <TaskLink
                  href="/verifications/vehicles"
                  icon={Car}
                  label="Giấy tờ xe chờ duyệt"
                  count={stats.pendingVehicleVerifications}
                />
                <TaskLink
                  href="/violations"
                  icon={ShieldAlert}
                  label="Vi phạm còn hiệu lực"
                  count={stats.openViolations}
                />
              </ul>
            </Card>
          </div>

          <Card>
            <CardHeader title="Chuyến đi theo trạng thái" description="Tất cả chuyến đã tạo" />
            <TripStatusBars rows={stats.tripsByStatus} />
          </Card>
        </div>
      )}
    </>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </Card>
  );
}

function TaskLink({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-brand-50/60"
      >
        <Icon className="size-5 shrink-0 text-brand-700" aria-hidden />
        <span className="flex-1 font-medium">{label}</span>
        <span
          className={
            count > 0
              ? "rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-brand-900 tabular-nums"
              : "text-muted tabular-nums"
          }
        >
          {formatNumber(count)}
        </span>
        <ChevronRight className="size-4 text-subtle" aria-hidden />
      </Link>
    </li>
  );
}

/** Biểu đồ cột một chuỗi: giá trị hiện khi rê chuột hoặc focus, kèm bảng cho trình đọc màn hình. */
function SignupsChart({ days }: { days: DashboardStats["signupsByDay"] }) {
  const max = Math.max(...days.map((day) => day.count), 1);
  // "2026-10-10" -> "10/10"
  const dayLabel = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

  return (
    <div className="p-5">
      <div className="flex h-44 items-end gap-3 border-b border-line" aria-hidden>
        {days.map((day) => (
          <div key={day.date} className="group relative flex h-full flex-1 items-end justify-center">
            <span className="pointer-events-none absolute -top-1 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
              {dayLabel(day.date)}: {day.count} người dùng
            </span>
            <div
              className="w-full max-w-10 rounded-t bg-brand-600 transition-colors group-hover:bg-brand-800"
              style={{ height: `${(day.count / max) * 100}%`, minHeight: day.count > 0 ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 text-xs text-muted tabular-nums" aria-hidden>
        {days.map((day) => (
          <span key={day.date} className="flex-1 text-center">
            {dayLabel(day.date)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Người dùng mới theo ngày</caption>
        <thead>
          <tr>
            <th scope="col">Ngày</th>
            <th scope="col">Số người dùng mới</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <td>{dayLabel(day.date)}</td>
              <td>{day.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TripStatusBars({ rows }: { rows: DashboardStats["tripsByStatus"] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <ul className="space-y-3 p-5">
      {rows.map((row) => (
        <li key={row.status} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="text-muted">{TRIP_STATUS[row.status].label}</span>
          <span className="h-3 rounded-r bg-brand-600" style={{ width: `${(row.count / max) * 100}%` }} />
          <span className="text-right font-medium tabular-nums">{formatNumber(row.count)}</span>
        </li>
      ))}
    </ul>
  );
}
