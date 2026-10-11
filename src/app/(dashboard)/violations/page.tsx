import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { ViolationsView } from "./view";

export const metadata: Metadata = { title: "Vi phạm tài xế" };

export default function ViolationsPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ViolationsView />
    </Suspense>
  );
}
