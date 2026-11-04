"use client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import Link from "next/link";
import {
  RECURRING_ATTEMPTS,
  type AuditFilter,
} from "@/lib/trip-operations.graphql";
import { isExistingApiMocked } from "@/lib/mock-mode";
import { formatDateTime } from "@/lib/utils";
const states: Record<string, string> = {
  PUBLISHED: "Đã đăng",
  BLOCKED: "Bị chặn",
  FAILED: "Chưa hoàn tất",
  OMITTED: "Tài xế bỏ chọn",
  EXISTING: "Đã có chuyến",
  ELIGIBLE: "Hợp lệ",
};
export function RecurringBatchAudit({ filter = {} }: { filter?: AuditFilter }) {
  const [after, setAfter] = useState<string>();
  const mock = isExistingApiMocked();
  const { data, loading, error, refetch } = useQuery(RECURRING_ATTEMPTS, {
    variables: { filter: { ...filter, first: 20, after } },
    skip: mock,
    fetchPolicy: "network-only",
  });
  const page = data?.adminRecurringBatchAttempts;
  if (mock) return null;
  return (
    <section className="rounded-2xl border border-line bg-white p-5 space-y-4">
      <h2 className="text-lg font-semibold">Các lần xác nhận lịch định kỳ</h2>
      {loading && <p>Đang tải…</p>}
      {error && (
        <button onClick={() => void refetch()} className="text-red-700">
          Không tải được lịch. Thử lại
        </button>
      )}
      {!loading && !error && !page?.items.length && (
        <p className="text-muted">Chưa có lần đăng nào.</p>
      )}
      {page?.items.map((item) => (
        <details key={item.id} className="border-t border-line pt-4">
          <summary className="cursor-pointer">
            <span className="font-semibold">
              {states[item.state] ?? item.state} · {item.tripIds.length} chuyến
            </span>
            <span className="text-sm text-muted ml-2">
              {item.ownerName} · {formatDateTime(item.createdAt)}
            </span>
          </summary>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-muted">Mẫu lịch: {item.templateId}</p>
            {item.outcomes.map((row) => (
              <div key={row.localDate} className="rounded-xl bg-gray-50 p-3">
                <p>
                  {row.localDate} · {states[row.state] ?? row.state}
                </p>
                {row.reason && <p className="text-amber-800">{row.reason}</p>}
                {row.tripId && (
                  <Link
                    className="text-brand-700"
                    href={`/trips/${row.tripId}`}
                  >
                    Xem chuyến →
                  </Link>
                )}
              </div>
            ))}
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
