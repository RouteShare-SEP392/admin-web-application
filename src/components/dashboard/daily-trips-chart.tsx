import { Card } from "@/components/ui/misc";
import type { OperationsOverview } from "@/lib/types";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** "2026-10-10" -> { weekday: "T7", short: "10/10", day: "10" } */
function describeDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return {
    weekday: WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()],
    short: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
    day: date.slice(8, 10),
  };
}

/** Cột ghép đôi theo ngày: số chuyến đã đăng và số chuyến hoàn thành. */
export function DailyTripsChart({ days }: { days: OperationsOverview["dailyTrips"] }) {
  const max = Math.max(...days.map((day) => day.posted), 1);
  // Kỳ 30 ngày quá dày để ghi thứ, nên ghi ngày trong tháng.
  const compact = days.length > 14;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="font-semibold">Chuyến mỗi ngày</h2>
          <p className="mt-0.5 text-sm text-muted">
            Đã đăng so với hoàn thành · {days.length} ngày gần nhất, theo ngày khởi hành
          </p>
        </div>
        <ul className="flex items-center gap-4 text-sm">
          <li className="flex items-center gap-1.5 font-medium">
            <span className="size-3 rounded-sm bg-brand-600" aria-hidden />
            Hoàn thành
          </li>
          <li className="flex items-center gap-1.5 text-muted">
            <span className="size-3 rounded-sm bg-gray-300" aria-hidden />
            Đã đăng
          </li>
        </ul>
      </div>

      <div className="overflow-x-auto px-5 pt-8 pb-5">
        <div
          className="flex h-52 items-end border-b border-line"
          style={{ minWidth: days.length * 26 }}
          aria-hidden
        >
          {days.map((day) => {
            const label = describeDate(day.date);
            return (
              <div
                key={day.date}
                className="group relative flex h-full flex-1 items-end justify-center gap-0.5"
              >
                <span className="pointer-events-none absolute -top-7 z-10 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {label.weekday} {label.short} · đăng {day.posted} · hoàn thành {day.completed}
                </span>
                <span
                  className="w-1/4 max-w-4 rounded-t bg-gray-300"
                  style={{ height: `${(day.posted / max) * 100}%` }}
                />
                <span
                  className="w-1/4 max-w-4 rounded-t bg-brand-600 transition-colors group-hover:bg-brand-800"
                  style={{ height: `${(day.completed / max) * 100}%` }}
                />
              </div>
            );
          })}
        </div>
        <div
          className="mt-2 flex text-xs text-muted tabular-nums"
          style={{ minWidth: days.length * 26 }}
          aria-hidden
        >
          {days.map((day) => {
            const label = describeDate(day.date);
            return (
              <span key={day.date} className="flex-1 text-center">
                {compact ? label.day : label.weekday}
              </span>
            );
          })}
        </div>

        <table className="sr-only">
          <caption>Số chuyến đã đăng và hoàn thành theo ngày khởi hành</caption>
          <thead>
            <tr>
              <th scope="col">Ngày</th>
              <th scope="col">Đã đăng</th>
              <th scope="col">Hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <td>{describeDate(day.date).short}</td>
                <td>{day.posted}</td>
                <td>{day.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
