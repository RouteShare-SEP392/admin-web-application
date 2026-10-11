import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/misc";
import { DriverProfileView } from "./view";

export const metadata: Metadata = { title: "Hồ sơ tài xế" };

export default function DriverProfilePage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DriverProfileView />
    </Suspense>
  );
}
