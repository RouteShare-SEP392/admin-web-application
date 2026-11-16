import { Card, EmptyState, PageHeader } from "@/components/ui/misc";

export function ViolationsView() {
  return <><PageHeader title="Vi phạm tài xế" /><Card><EmptyState title="Chưa khả dụng" description="Tra cứu và xử lý vi phạm chưa được kết nối." /></Card></>;
}
