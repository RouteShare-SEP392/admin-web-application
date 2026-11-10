"use client";
import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  RECURRING_TEMPLATE_CHANGES,
  type AuditFilter,
  type TemplateRevision,
} from "@/lib/trip-operations.graphql";
import { isExistingApiMocked } from "@/lib/mock-mode";

const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const local = (value: string) =>
  new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
function Revision({ value }: { value?: TemplateRevision | null }) {
  if (!value) return <p className="text-muted">Chưa có mẫu</p>;
  return (
    <div className="space-y-1 text-sm">
      <p className="font-semibold">Phiên bản {value.version}</p>
      <p>
        {value.originName} → {value.destinationName}
      </p>
      <p>
        {value.localTime} · {value.weekdays.map((day) => days[day]).join(", ")}
      </p>
      <p>
        Xe: {value.trip.vehicleId} · {value.trip.totalSeatsOffered} ghế
      </p>
      <p>
        {value.trip.costPerKm.toLocaleString("vi-VN")} đ/km · Duyệt{" "}
        {value.trip.isInstantBooking ? "tự động" : "thủ công"}
      </p>
      <p>
        Giới hạn nghỉ: {value.maxStopWaitMinutes} phút · Hành lang:{" "}
        {value.maxWaypointDistanceMeters} m
      </p>
      {value.trip.waypoints.map((stop, index) => (
        <p key={index}>
          Điểm nghỉ {index + 1}: {stop.stopName} ·{" "}
          {stop.plannedDepartureTime
            ? local(stop.plannedDepartureTime)
            : "Rời ngay khi đến"}
        </p>
      ))}
      {value.trip.driverNotes && <p>Ghi chú: {value.trip.driverNotes}</p>}
    </div>
  );
}
export function RecurringTemplateChanges({ filter }: { filter: AuditFilter }) {
  const [after, setAfter] = useState<string>();
  const mocked = isExistingApiMocked();
  const { data, loading, error, refetch } = useQuery(
    RECURRING_TEMPLATE_CHANGES,
    {
      variables: { filter: { ...filter, first: 20, after } },
      skip: mocked,
      fetchPolicy: "network-only",
    },
  );
  if (mocked) return null;
  const page = data?.adminRecurringTemplateChanges;
  return (
    <section className="rounded-2xl border border-line bg-white p-5 space-y-4">
      <h2 className="font-semibold text-lg">Lịch sử sửa mẫu định kỳ</h2>
      <p className="text-sm text-muted">
        Lưu người sửa, thời điểm và dữ liệu trước/sau. Thay đổi mẫu không sửa
        các chuyến đã đăng.
      </p>
      {loading && <p>Đang tải…</p>}
      {error && (
        <button onClick={() => void refetch()} className="text-red-700">
          Không tải được lịch sử. Thử lại
        </button>
      )}
      {!loading && !error && !page?.items.length && (
        <p>Chưa có lịch sử sửa mẫu.</p>
      )}
      {page?.items.map((item) => (
        <details key={item.id} className="border-t border-line pt-3">
          <summary className="cursor-pointer">
            {item.ownerName} · {local(item.createdAt)} ·{" "}
            {item.before ? "Sửa mẫu" : "Tạo mẫu"} · Phiên bản{" "}
            {item.after.version}
          </summary>
          <p className="text-sm text-muted my-2">Mẫu: {item.templateId}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Trước</h3>
              <Revision value={item.before} />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sau</h3>
              <Revision value={item.after} />
            </div>
          </div>
        </details>
      ))}
      <div className="flex gap-4">
        <button
          disabled={!after || loading}
          onClick={() => setAfter(undefined)}
          className="text-brand-700 disabled:opacity-40"
        >
          Về đầu
        </button>
        {page?.hasNextPage && page.endCursor && (
          <button
            disabled={loading}
            onClick={() => setAfter(page.endCursor ?? undefined)}
            className="text-brand-700"
          >
            Xem tiếp →
          </button>
        )}
      </div>
    </section>
  );
}
