import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { AdminsView } from "./view";

export const metadata: Metadata = { title: "Quản trị viên" };

export default function Page() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminsView />
    </Suspense>
  );
}
