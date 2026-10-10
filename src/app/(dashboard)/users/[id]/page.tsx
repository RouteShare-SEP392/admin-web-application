import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { UserDetailView } from "./view";

export const metadata: Metadata = { title: "Chi tiết người dùng" };

export default function UserDetailPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <UserDetailView />
    </Suspense>
  );
}
