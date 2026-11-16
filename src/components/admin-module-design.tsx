"use client";

import { Card, EmptyState, PageHeader } from "@/components/ui/misc";
import type { AdminModule } from "@/lib/admin-modules";
import { OperationalRecords } from "./operational-records";

export function AdminModuleDesign({ module }: { module: AdminModule }) {
  const connected = ["bookings", "payments", "reviews", "notifications"].includes(module.slug);
  return <>
    <PageHeader title={module.title} />
    {connected ? <OperationalRecords section={module.slug} /> : <Card><EmptyState title="Chưa khả dụng" description="Phân hệ này chưa được kết nối." /></Card>}
  </>;
}
