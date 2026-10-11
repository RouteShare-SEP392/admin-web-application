import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { TripsView } from "./view";

export const metadata: Metadata = { title: "Chuyến đi" };

export default function TripsPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TripsView />
    </Suspense>
  );
}
