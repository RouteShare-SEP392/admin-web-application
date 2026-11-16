"use client";

import { Card, EmptyState, PageHeader } from "@/components/ui/misc";

export function PayoutsView() {
  return <>
    <PageHeader title="Chi trả tài xế" />
    <Card><EmptyState title="Chưa khả dụng" description="Hệ thống yêu cầu rút và duyệt chi chưa được kết nối." /></Card>
  </>;
}
