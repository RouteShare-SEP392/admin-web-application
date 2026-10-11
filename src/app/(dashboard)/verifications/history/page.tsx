import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { VerificationHistoryView } from "./view";

export const metadata: Metadata = { title: "Lịch sử xét duyệt" };

export default function VerificationHistoryPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <VerificationHistoryView />
    </Suspense>
  );
}
