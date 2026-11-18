"use client";

import { Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { Banknote, ClipboardCheck, Landmark } from "lucide-react";

export function PayoutsView() {
  return <>
    <PageHeader title="Chi trả tài xế" />
    <Card className="overflow-hidden"><div className="grid lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]"><aside className="bg-gray-50 p-6"><h2 className="text-sm font-semibold">Quy trình dự kiến</h2><ol className="mt-6 space-y-6">{[{ icon: Landmark, title: "Tài xế yêu cầu rút" }, { icon: ClipboardCheck, title: "ADMIN xét duyệt" }, { icon: Banknote, title: "Nhà cung cấp xử lý chi" }].map(({ icon: Icon, title }, index) => <li key={title} className="flex items-center gap-3 text-sm text-muted"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white"><Icon className="size-4" aria-hidden /></span><span><span className="mr-2 text-xs">0{index + 1}</span>{title}</span></li>)}</ol></aside><div className="flex min-h-72 items-center p-6"><EmptyState title="Chưa khả dụng" description="Yêu cầu rút và duyệt chi chưa được kết nối. Duyệt yêu cầu không đồng nghĩa chuyển tiền thành công." /></div></div></Card>
  </>;
}
