import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { DashboardView } from "./view";

export const metadata: Metadata = { title: "Tổng quan" };

export default function DashboardPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
