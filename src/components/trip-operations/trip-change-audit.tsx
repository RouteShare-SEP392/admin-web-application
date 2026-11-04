"use client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import Link from "next/link";
import { TRIP_CHANGES, type AuditFilter } from "@/lib/trip-operations.graphql";
import { isExistingApiMocked } from "@/lib/mock-mode";
import { formatDateTime } from "@/lib/utils";
const reasons: Record<string, string> = {
  RETIME: "Đổi giờ trong ngưỡng",
  DRIVER_CANCELLED: "Tài xế hủy chuyến",
  DRIVER_ROUTE_CHANGED: "Thay đổi tuyến",
  DRIVER_SCHEDULE_CHANGED: "Đổi giờ vượt ngưỡng",
};
export function TripChangeAudit({
  tripId,
  filter = {},
}: {
  tripId?: string;
  filter?: AuditFilter;
}) {
  const [after, setAfter] = useState<string>();
  const mock = isExistingApiMocked();
  const { data, loading, error, refetch } = useQuery(TRIP_CHANGES, {
    variables: {
      filter: { ...filter, ...(tripId ? { tripId } : {}), first: 20, after },
    },
    skip: mock,
    fetchPolicy: "network-only",
  });
  const page = data?.adminTripChanges;
  if (mock)
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        Lịch sử thay đổi dùng API thật. Chọn chế độ API missing hoặc off để xem
        dữ liệu backend.
      </p>
    );
  return (
    <section className="rounded-2xl border border-line bg-white p-5 space-y-4">
      <h2 className="font-semibold text-lg">Lịch sử sửa và hủy chuyến</h2>
      <p className="text-sm text-muted">
        Dữ liệu hỗ trợ kiểm tra sau thao tác; không tự kết luận vi phạm.
      </p>
      {loading && <p>Đang tải…</p>}
      {error && (
        <button onClick={() => void refetch()} className="text-red-700">
          Không tải được lịch sử. Thử lại
        </button>
      )}
      {!loading && !error && !page?.items.length && (
        <p className="text-muted">Chưa có thay đổi được ghi nhận.</p>
      )}
      {page?.items.map((item) => (
        <details key={item.id} className="border-t border-line pt-4">
          <summary className="cursor-pointer">
            <span className="font-semibold">
              {reasons[item.reasonCode] ?? item.reasonCode}
            </span>
            <span className="text-muted ml-2 text-sm">
              {item.actorName} · {formatDateTime(item.createdAt)}
            </span>
            <p className="mt-1 text-sm">
              {item.affectedBookings} đặt chỗ bị ảnh hưởng ·{" "}
              {item.confirmedBookings} đã xác nhận
            </p>
          </summary>
          <div className="mt-3 grid gap-2 text-sm">
            <p>
              Giờ cũ: {formatDateTime(item.previousDepartureTime)} → Giờ mới:{" "}
              {formatDateTime(item.currentDepartureTime)}
            </p>
            <p>
              Giờ đăng gốc: {formatDateTime(item.originalDepartureTime)}
              {item.toleranceMinutes != null
                ? ` · Ngưỡng áp dụng: ${item.toleranceMinutes} phút`
                : ""}
            </p>
            {item.explanation && <p>Lý do thêm: {item.explanation}</p>}
            <p>
              Phiên bản {item.revision} · Mã thao tác {item.id}
            </p>
            <p>
              {item.inboxCount} thông báo đã lưu · {item.providerAcceptedCount}{" "}
              push được nhà cung cấp tiếp nhận · {item.pushFailedCount} lỗi/hết
              hạn
            </p>
            <p className="text-muted">
              Nhà cung cấp tiếp nhận không đồng nghĩa điện thoại đã nhận hoặc
              người dùng đã đọc.
            </p>
            <div className="flex gap-4 text-brand-700">
              <Link href={`/trips/${item.tripId}`}>Chuyến gốc →</Link>
              {item.replacementTripId && (
                <Link href={`/trips/${item.replacementTripId}`}>
                  Chuyến thay thế →
                </Link>
              )}
              {item.templateId && (
                <Link href={`/trip-operations?templateId=${item.templateId}`}>
                  Lịch định kỳ {item.localDate} →
                </Link>
              )}
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
