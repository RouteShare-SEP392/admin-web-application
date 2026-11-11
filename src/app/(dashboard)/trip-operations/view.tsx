"use client";
import { RecurringTemplates } from "@/components/trip-operations/recurring-templates";
import { RecurringTemplateChanges } from "@/components/trip-operations/recurring-template-changes";
import { useState } from "react";
import Link from "next/link";
import { TripChangeAudit } from "@/components/trip-operations/trip-change-audit";
import { RecurringBatchAudit } from "@/components/trip-operations/recurring-batch-audit";
import { RecurringWorkAudit } from "@/components/trip-operations/recurring-work-audit";
import { useSearchParams } from "next/navigation";
export function TripOperationsView() {
  const params = useSearchParams();
  const [driverId, setDriverId] = useState("");
  const [applied, setApplied] = useState("");
  const [error, setError] = useState("");
  const templateId = params.get("templateId") ?? undefined;
  const filter = {
    ...(applied ? { driverId: applied } : {}),
    ...(templateId ? { templateId } : {}),
  };
  return (
    <div className="space-y-5">
      <Link href="/trips" className="text-brand-700">
        ← Danh sách chuyến
      </Link>
      <h1 className="text-2xl font-bold">Theo dõi thay đổi chuyến</h1>
      <div className="flex gap-3">
        <input
          aria-label="Mã tài xế"
          placeholder="Mã tài xế (tùy chọn)"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="border border-line rounded-xl p-3 bg-white min-w-80"
        />
        <button
          onClick={() => {
            const id = driverId.trim();
            if (id && !/^[0-9a-f-]{36}$/i.test(id)) {
              setError("Mã tài xế không hợp lệ.");
              return;
            }
            setError("");
            setApplied(id);
          }}
          className="rounded-xl border border-line px-4"
        >
          Lọc
        </button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <RecurringTemplates
        key={`templates-${applied}-${templateId}`}
        filter={filter}
      />
      <TripChangeAudit
        key={`changes-${applied}-${templateId}`}
        filter={filter}
      />
      <RecurringTemplateChanges
        key={`template-changes-${applied}-${templateId}`}
        filter={filter}
      />
      <RecurringWorkAudit />
      <RecurringBatchAudit
        key={`batches-${applied}-${templateId}`}
        filter={filter}
      />
    </div>
  );
}
