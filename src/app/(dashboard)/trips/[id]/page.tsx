import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { TripDetailView } from "./view";

export const metadata: Metadata = { title: "Chi tiết chuyến đi" };

export default function TripDetailPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TripDetailView />
    </Suspense>
  );
}
