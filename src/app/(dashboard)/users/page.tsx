import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { UsersView } from "./view";

export const metadata: Metadata = { title: "Người dùng" };

export default function UsersPage() {
  // View đọc bộ lọc từ URL nên cần ranh giới Suspense khi trang được dựng sẵn.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <UsersView />
    </Suspense>
  );
}
