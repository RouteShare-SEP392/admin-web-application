import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { ReportsView } from "./view";

export const metadata: Metadata = { title: "Báo cáo và khiếu nại" };

export default function Page() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ReportsView />
    </Suspense>
  );
}
