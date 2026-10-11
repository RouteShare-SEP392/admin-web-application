import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { BookingsView } from "./view";

export const metadata: Metadata = { title: "Đặt chỗ" };

export default function Page() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <BookingsView />
    </Suspense>
  );
}
