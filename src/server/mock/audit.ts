import type { AuditAction, AuditLog, AuditTargetType } from "@/lib/types";
import { getStore } from "./store";

interface AuditTarget {
  type: AuditTargetType;
  id: string | null;
  label: string;
}

/**
 * Ghi một dòng nhật ký thao tác quản trị. Mọi mutation của lớp mock gọi hàm này
 * sau khi thay đổi dữ liệu thành công, để trang Nhật ký phản ánh đúng việc đã làm.
 */
export function recordAudit(
  adminId: string,
  action: AuditAction,
  target: AuditTarget,
  detail: string | null = null,
): AuditLog {
  const store = getStore();
  // Ở chế độ mock một phần, id trong JWT thật không có trong dữ liệu mẫu.
  const actor =
    store.users.find((u) => u.id === adminId) ?? store.users.find((u) => u.role === "ADMIN")!;
  const entry: AuditLog = {
    id: `al000000-0000-4000-8000-${String(store.auditLogs.length + 1).padStart(12, "0")}`,
    action,
    actor,
    targetType: target.type,
    targetId: target.id,
    targetLabel: target.label,
    detail,
    createdAt: new Date().toISOString(),
  };
  store.auditLogs.push(entry);
  return entry;
}
