"use client";

import { useQuery } from "@apollo/client/react";
import {
  Car,
  ChevronRight,
  IdCard,
  Route,
  UserCheck,
  Users,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
        description="Không gian vận hành RouteShare"
        action={<Button variant="secondary" disabled={loading} onClick={() => void refetch()}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />Làm mới</Button>}
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
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line xl:grid-cols-4">
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

          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card>
              <CardHeader
                title="Người dùng mới"
                description="Số tài khoản đăng ký mỗi ngày trong 7 ngày qua"
              />
              <SignupsChart days={stats.signupsByDay} />
            </Card>

            <Card>
              <CardHeader title="Hàng chờ xét duyệt" action={<span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{formatNumber(stats.pendingDriverVerifications + stats.pendingVehicleVerifications)}</span>} />
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
              </ul>
              <div className="m-5 rounded-xl bg-gray-50 p-4"><p className="text-xs font-medium text-muted">Tra cứu nhanh</p><div className="mt-3 flex flex-wrap gap-2">{[["/trips", "Chuyến đi"], ["/users", "Người dùng"], ["/journey-history", "Lịch sử"]].map(([href, label]) => <Link key={href} href={href} className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium transition-colors hover:border-brand-300 hover:text-brand-700">{label}</Link>)}</div></div>
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
    <div className="relative min-w-0 overflow-hidden bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="inline-flex size-8 items-center justify-center text-brand-700">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </div>
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
        className="rs-task-link group flex min-h-16 items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-brand-50/60"
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
        <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-1" aria-hidden />
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
    <div className="min-w-0 p-5">
      <div className="flex h-56 items-end gap-2 border-b border-line pt-10 sm:gap-3">
        {days.map((day, index) => (
          <button type="button" key={day.date} aria-label={`${dayLabel(day.date)}: ${day.count} người dùng mới`} className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-t outline-offset-2 hover:z-10 focus-visible:z-10">
            <span aria-hidden="true" className={`pointer-events-none absolute bottom-full z-20 mb-2 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${index === 0 ? "left-0" : index === days.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
              {dayLabel(day.date)}: {day.count} người dùng
            </span>
            <span aria-hidden="true"
              className="rs-chart-bar w-full max-w-10 rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400 transition-colors group-hover:from-brand-900 group-hover:to-brand-500"
              style={{ height: `${(day.count / max) * 100}%`, minHeight: day.count > 0 ? 4 : 0 }}
            />
          </button>
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
        <li key={row.status} className="grid grid-cols-[6rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm sm:grid-cols-[7rem_minmax(0,1fr)_4rem] sm:gap-3">
          <span className="text-muted">{TRIP_STATUS[row.status].label}</span>
          <span className="rs-status-bar h-3 rounded-full bg-gradient-to-r from-brand-700 to-brand-400" style={{ width: `${(row.count / max) * 100}%` }} />
          <span className="text-right font-medium tabular-nums">{formatNumber(row.count)}</span>
        </li>
      ))}
    </ul>
  );
}
