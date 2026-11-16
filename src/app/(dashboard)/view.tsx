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
  ArrowUpRight,
  Compass,
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

      <section className="rs-hero relative mb-7 overflow-hidden rounded-3xl bg-brand-900 p-6 text-white sm:p-8">
        <div className="relative z-10 max-w-xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-brand-100"><Compass className="size-3.5" aria-hidden /> ROUTESHARE / VẬN HÀNH</span>
          <h2 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">Mỗi hành trình,<br /><span className="text-accent">đều được kết nối.</span></h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-100">Một góc nhìn cho chuyến đi, con người và những việc cần bạn xử lý.</p>
          <Link href="/trips" className="rs-button mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-brand-900">Khám phá chuyến đi <ArrowUpRight className="size-4" aria-hidden /></Link>
        </div>
        <div className="rs-route-art pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] opacity-75 md:block" aria-hidden="true">
          <svg viewBox="0 0 480 280" className="h-full w-full" fill="none">
            <path d="M-40 230H150Q190 230 190 190V100Q190 60 230 60H510M50-30V110Q50 150 90 150H340Q380 150 380 190V310" stroke="white" strokeOpacity=".08" strokeWidth="32" />
            <path d="M-40 230H150Q190 230 190 190V100Q190 60 230 60H510M50-30V110Q50 150 90 150H340Q380 150 380 190V310" stroke="white" strokeOpacity=".16" strokeDasharray="4 8" />
            <path className="rs-route-line" d="M80 230H150Q190 230 190 190V100Q190 60 230 60H390" stroke="#c8f25a" strokeWidth="3" strokeLinecap="round" />
            <circle cx="80" cy="230" r="12" fill="#143d2e" stroke="#c8f25a" strokeWidth="3" />
            <circle cx="80" cy="230" r="4" fill="#c8f25a" />
            <circle cx="390" cy="60" r="18" fill="#c8f25a" fillOpacity=".16" />
            <circle cx="390" cy="60" r="7" fill="#c8f25a" />
          </svg>
          <span className="absolute right-8 bottom-8 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-brand-100 backdrop-blur">Chia sẻ hành trình. Kết nối cộng đồng.</span>
        </div>
      </section>

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
          <div className="rs-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    <Card className="rs-stat-tile relative overflow-hidden p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="rs-stat-icon inline-flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
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
