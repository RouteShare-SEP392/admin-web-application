"use client";
import { RecurringTemplates } from "@/components/trip-operations/recurring-templates";
import { RecurringTemplateChanges } from "@/components/trip-operations/recurring-template-changes";
import { useState } from "react";
import Link from "next/link";
import { TripChangeAudit } from "@/components/trip-operations/trip-change-audit";
import { RecurringBatchAudit } from "@/components/trip-operations/recurring-batch-audit";
import { RecurringWorkAudit } from "@/components/trip-operations/recurring-work-audit";
import { useSearchParams } from "next/navigation";
import { CalendarDays, FileClock, GitCompareArrows, Layers, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/ui/misc";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
export function TripOperationsView() {
  const params = useSearchParams();
  const [driverId, setDriverId] = useState("");
  const [applied, setApplied] = useState("");
  const [error, setError] = useState("");
  const [section, setSection] = useState("templates");
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
      <PageHeader title="Lịch định kỳ & thay đổi" />
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Mã tài xế"
          placeholder="Mã tài xế (tùy chọn)"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="max-w-md"
        />
        <Button variant="secondary"
          onClick={() => {
            const id = driverId.trim();
            if (id && !/^[0-9a-f-]{36}$/i.test(id)) {
              setError("Mã tài xế không hợp lệ.");
              return;
            }
            setError("");
            setApplied(id);
          }}
        >
          Lọc
        </Button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Tra cứu lịch định kỳ">{[{ id: "templates", title: "Mẫu định kỳ", icon: CalendarDays }, { id: "changes", title: "Thay đổi chuyến", icon: GitCompareArrows }, { id: "history", title: "Lịch sử mẫu", icon: FileClock }, { id: "work", title: "Thực thi tác vụ", icon: ListChecks }, { id: "batches", title: "Đợt đăng chuyến", icon: Layers }].map(({ id, title, icon: Icon }) => <button key={id} type="button" aria-pressed={section === id} onClick={() => setSection(id)} className={`rs-settings-tab flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${section === id ? "bg-white font-semibold text-brand-800 shadow-sm ring-1 ring-line" : "text-muted hover:bg-white"}`}><Icon className="size-4" aria-hidden />{title}</button>)}</nav><div key={`${section}-${applied}-${templateId}`} className="rs-record-enter min-w-0">
      {section === "templates" ? <RecurringTemplates
        key={`templates-${applied}-${templateId}`}
        filter={filter}
      /> : section === "changes" ? <TripChangeAudit
        key={`changes-${applied}-${templateId}`}
        filter={filter}
      /> : section === "history" ? <RecurringTemplateChanges /> : section === "work" ? <RecurringWorkAudit /> : <RecurringBatchAudit
        key={`batches-${applied}-${templateId}`}
        filter={filter}
      />}
      </div></div>
    </div>
  );
}
