"use client";

import { Card, EmptyState, PageHeader } from "@/components/ui/misc";
import type { AdminModule } from "@/lib/admin-modules";
import { OperationalRecords } from "./operational-records";
import { FileClock, LifeBuoy } from "lucide-react";

export function AdminModuleDesign({ module }: { module: AdminModule }) {
  const connected = ["bookings", "payments", "reviews", "notifications"].includes(module.slug);
  return <>
    <PageHeader title={module.title} />
    {connected ? <OperationalRecords section={module.slug} /> : <Card className="overflow-hidden"><div className="grid md:grid-cols-[240px_minmax(0,1fr)]"><div className="flex min-h-64 items-center justify-center bg-gray-50">{module.slug === "support" ? <LifeBuoy className="size-16 stroke-1 text-brand-300" aria-hidden /> : <FileClock className="size-16 stroke-1 text-brand-300" aria-hidden />}</div><div className="flex items-center p-6"><EmptyState title="Chưa khả dụng" description={module.slug === "support" ? "Kênh tiếp nhận và xử lý yêu cầu hỗ trợ chưa được kết nối." : "Nhật ký quản trị tổng hợp chưa được kết nối."} /></div></div></Card>}
  </>;
}
