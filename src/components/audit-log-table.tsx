import Link from "next/link";
import { AUDIT_ACTION } from "@/lib/labels";
import type { AuditLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { PersonCell } from "./person-cell";
import { StatusBadge } from "./ui/badge";
import { Table, Td, Th, Tr } from "./ui/table";

/** Trang của đối tượng bị tác động; null khi không có trang nào để dẫn tới. */
function targetHref(entry: AuditLog): string | null {
  switch (entry.targetType) {
    case "USER":
      return entry.targetId ? `/users/${entry.targetId}` : null;
    case "DRIVER_PROFILE":
      return entry.targetId ? `/verifications/drivers/${entry.targetId}` : null;
    case "TRIP":
      return entry.targetId ? `/trips/${entry.targetId}` : null;
    case "VIOLATION":
      return "/violations";
    case "SETTING":
      return "/settings";
    case "REPORT":
      return entry.targetId ? `/reports/${entry.targetId}` : null;
    case "SOS":
      return "/sos";
    default:
      return null;
  }
}

/** Bảng nhật ký dùng ở trang Nhật ký và ở mục hoạt động gần đây của trang Tài khoản. */
export function AuditLogTable({
  entries,
  showActor = true,
}: {
  entries: AuditLog[];
  /** Ẩn cột người thực hiện khi mọi dòng đều của cùng một người. */
  showActor?: boolean;
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Thời điểm</Th>
          {showActor ? <Th>Người thực hiện</Th> : null}
          <Th>Hành động</Th>
          <Th>Đối tượng</Th>
          <Th>Chi tiết</Th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const href = targetHref(entry);
          return (
            <Tr key={entry.id}>
              <Td className="whitespace-nowrap text-muted tabular-nums">
                {formatDateTime(entry.createdAt)}
              </Td>
              {showActor ? (
                <Td>
                  <PersonCell person={entry.actor} />
                </Td>
              ) : null}
              <Td>
                <StatusBadge meta={AUDIT_ACTION[entry.action]} />
              </Td>
              <Td className="min-w-48">
                {href ? (
                  <Link href={href} className="font-medium hover:text-brand-700 hover:underline">
                    {entry.targetLabel}
                  </Link>
                ) : (
                  <span className="font-medium">{entry.targetLabel}</span>
                )}
              </Td>
              <Td className="max-w-80 text-sm text-muted">{entry.detail ?? "—"}</Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
