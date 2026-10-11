import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { VehiclesView } from "./view";

export const metadata: Metadata = { title: "Phương tiện" };

export default function VehiclesPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <VehiclesView />
    </Suspense>
  );
}
