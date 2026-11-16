import { Card, CardHeader, EmptyState } from "@/components/ui/misc";

export function RecurringSettings() {
  return <Card><CardHeader title="Cấu hình đăng ký định kỳ" /><EmptyState title="Chưa khả dụng" description="Backend chưa hỗ trợ các cấu hình đăng ký định kỳ này." /></Card>;
}
