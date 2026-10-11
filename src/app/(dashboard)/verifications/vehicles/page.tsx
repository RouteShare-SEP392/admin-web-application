import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { VehicleVerificationsView } from "./view";

export const metadata: Metadata = { title: "Duyệt giấy tờ xe" };

export default function VehicleVerificationsPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <VehicleVerificationsView />
    </Suspense>
  );
}
