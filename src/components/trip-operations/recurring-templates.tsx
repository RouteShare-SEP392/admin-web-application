"use client";
import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import {
  RECURRING_TEMPLATE_AUDIT,
  type AuditFilter,
} from "@/lib/trip-operations.graphql";
import { isExistingApiMocked } from "@/lib/mock-mode";
const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export function RecurringTemplates({ filter }: { filter: AuditFilter }) {
  const [after, setAfter] = useState<string>();
  const mocked = isExistingApiMocked();
  const { data, loading, error, refetch } = useQuery(RECURRING_TEMPLATE_AUDIT, {
    variables: { filter: { ...filter, first: 20, after } },
    skip: mocked,
    fetchPolicy: "network-only",
  });
  const page = data?.adminRecurringTemplates;
  if (mocked) return null;
  return (
    <section className="rounded-2xl border border-line bg-white p-5 space-y-4">
      <h2 className="font-semibold text-lg">Mẫu lịch định kỳ</h2>
      <p className="text-sm text-muted">
        Mẫu lịch không đồng nghĩa đã đăng chuyến. Tài xế xác nhận riêng từng đợt
        7 ngày.
      </p>
      {loading && <p>Đang tải…</p>}
      {error && (
        <button onClick={() => void refetch()} className="text-red-700">
          Không tải được mẫu lịch. Thử lại
        </button>
      )}
      {!loading && !error && !page?.items.length && <p>Chưa có mẫu lịch.</p>}
      {page?.items.map((t) => (
        <div key={t.id} className="border-t border-line pt-3 space-y-1">
          <p className="font-semibold">
            {t.ownerName} · {t.localTime} ·{" "}
            {t.weekdays.map((d) => days[d]).join(", ")}
          </p>
          <p>
            {t.originName} → {t.destinationName}
          </p>
          <p className="text-sm text-muted">
            Phiên bản {t.version} · {t.occurrenceCount} ngày đã tạo chuyến
          </p>
          <Link
            className="text-brand-700 text-sm"
            href={`/trip-operations?templateId=${t.id}`}
          >
            Xem các đợt và thay đổi của lịch →
          </Link>
        </div>
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
