import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { AuditLogView } from "./view";

export const metadata: Metadata = { title: "Nhật ký thao tác" };

export default function AuditLogPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AuditLogView />
    </Suspense>
  );
}
