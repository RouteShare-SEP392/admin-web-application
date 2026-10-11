import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { DriverVerificationsView } from "./view";

export const metadata: Metadata = { title: "Duyệt hồ sơ tài xế" };

export default function DriverVerificationsPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DriverVerificationsView />
    </Suspense>
  );
}
