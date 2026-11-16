import { Card, CardHeader, EmptyState } from "@/components/ui/misc";

export function RecurringWorkAudit() {
  return <Card><CardHeader title="Xử lý lịch và đăng ký định kỳ" /><EmptyState title="Chưa khả dụng" description="Backend chưa cung cấp lịch sử xử lý và thay đổi đăng ký định kỳ." /></Card>;
}
