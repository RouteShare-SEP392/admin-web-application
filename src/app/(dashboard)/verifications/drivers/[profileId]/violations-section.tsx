"use client";

import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useState } from "react";
import {
  ForgiveViolationDialog,
  type ForgivableViolation,
} from "@/components/forgive-violation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, ErrorState, TableSkeleton } from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { isSuspended, STRIKES_TO_REVOKE } from "@/lib/driver-rules";
import { DRIVER_PROFILE, USER_VIOLATIONS } from "@/lib/graphql";
import { PENALTY_ACTION, VIOLATION_TYPE } from "@/lib/labels";
import type { DriverProfile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 5;

/**
 * Vi phạm của tài xế ngay trong trang hồ sơ: số lần bỏ chuyến so với ngưỡng
 * thu hồi, thời hạn tạm khoá, và danh sách vi phạm kèm thao tác tha.
 */
export function ViolationsSection({
  userId,
  driverName,
  profile,
}: {
  /** id của users: vi phạm được ghi theo tài khoản tài xế. */
  userId: string;
  driverName: string;
  profile: Pick<DriverProfile, "noShowStrikeCount" | "suspendedUntil">;
}) {
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<ForgivableViolation | null>(null);
  const { data, previousData, loading, error, refetch } = useQuery(USER_VIOLATIONS, {
    variables: { input: { driverId: userId, page, pageSize: PAGE_SIZE } },
  });
  const result = (data ?? previousData)?.adminDriverViolations;
  const suspended = isSuspended(profile);

  return (
    <Card>
      <CardHeader
        title="Vi phạm"
        description={`Bỏ chuyến ${profile.noShowStrikeCount}/${STRIKES_TO_REVOKE} lần. Lần thứ ${STRIKES_TO_REVOKE} sẽ thu hồi quyền tài xế.`}
        action={
          suspended ? (
            <Badge tone="bad">Tạm khoá đến {formatDateTime(profile.suspendedUntil)}</Badge>
          ) : (
            <Badge tone="good">Không bị tạm khoá</Badge>
          )
        }
      />

      {!result && loading ? (
        <TableSkeleton />
      ) : !result ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : result.items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">Tài xế này chưa có vi phạm nào.</p>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Vi phạm</Th>
                <Th>Chuyến</Th>
                <Th>Hình phạt</Th>
                <Th>Tình trạng</Th>
                <Th className="text-right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((violation) => (
                <Tr key={violation.id}>
                  <Td className="min-w-48">
                    <p className="font-medium">{VIOLATION_TYPE[violation.violationType]}</p>
                    <p className="text-xs text-muted">
                      Ghi nhận {formatDateTime(violation.createdAt)}
                      {violation.affectedPassengersCount > 0
                        ? ` · ${violation.affectedPassengersCount} hành khách bị ảnh hưởng`
                        : ""}
                    </p>
                  </Td>
                  <Td>
                    {violation.trip ? (
                      <Link
                        href={`/trips/${violation.trip.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {violation.trip.tripCode}
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <p>{PENALTY_ACTION[violation.penaltyAction]}</p>
                    {violation.penaltyUntil ? (
                      <p className="text-xs text-muted">
                        đến {formatDateTime(violation.penaltyUntil)}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    {violation.isForgiven ? (
                      <Badge tone="neutral">Đã tha</Badge>
                    ) : (
                      <Badge tone="bad">Còn hiệu lực</Badge>
                    )}
                    {violation.forgivenReason ? (
                      <p className="mt-1 max-w-48 text-xs text-muted">{violation.forgivenReason}</p>
                    ) : null}
                  </Td>
                  <Td className="text-right">
                    {violation.isForgiven ? null : (
                      <Button variant="secondary" size="sm" onClick={() => setTarget(violation)}>
                        {violation.penaltyAction === "REVOKED_DRIVER_LICENSE"
                          ? "Tha và khôi phục quyền"
                          : "Tha vi phạm"}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            onPageChange={setPage}
          />
        </>
      )}

      <ForgiveViolationDialog
        violation={target}
        driverName={driverName}
        // Tha vi phạm đổi số lần bỏ chuyến, thời hạn tạm khoá và có thể cả trạng thái hồ sơ.
        refetchQueries={[USER_VIOLATIONS, DRIVER_PROFILE]}
        onClose={() => setTarget(null)}
      />
    </Card>
  );
}
