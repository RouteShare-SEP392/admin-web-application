import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { BookingDetailView } from "./view";

export const metadata: Metadata = { title: "Chi tiết đặt chỗ" };

export default function Page() {
  // View đọc tham số động của đường dẫn nên cần ranh giới Suspense.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <BookingDetailView />
    </Suspense>
  );
}
