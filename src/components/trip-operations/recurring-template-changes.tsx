import { Card, CardHeader, EmptyState } from "@/components/ui/misc";

/** The Backend does not expose revision evidence; do not query a proposed contract. */
export function RecurringTemplateChanges() {
  return (
    <Card>
      <CardHeader title="Lịch sử sửa mẫu định kỳ" />
      <EmptyState
        title="Chưa khả dụng"
        description="Backend chưa cung cấp lịch sử phiên bản trước/sau của mẫu định kỳ."
      />
    </Card>
  );
}
