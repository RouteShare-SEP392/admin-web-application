"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useState } from "react";
import { PersonCell } from "@/components/person-cell";
import { TripRoute } from "@/components/trip-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { FORGIVE_VIOLATION, VIOLATIONS } from "@/lib/graphql";
import { PENALTY_ACTION, VIOLATION_TYPE } from "@/lib/labels";
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { ViolationType } from "@/lib/types";
import { useUrlState } from "@/lib/use-url-state";
import { errorMessage, formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;
const TYPE_OPTIONS = Object.keys(VIOLATION_TYPE) as ViolationType[];
const FORGIVEN_OPTIONS = ["open", "forgiven"] as const;

export function ViolationsView() {
  // Bộ lọc nằm trên URL: /violations?type=...&state=...&page=...
  const url = useUrlState();
  const violationType = url.getOption("type", TYPE_OPTIONS);
  const forgiven = url.getOption("state", FORGIVEN_OPTIONS);
  const page = url.getPage();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [forgiveError, setForgiveError] = useState<string | null>(null);
  const notify = useToast();

  const { data, previousData, loading, error, refetch } = useQuery(VIOLATIONS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        violationType: violationType || undefined,
        isForgiven: forgiven === "" ? undefined : forgiven === "forgiven",
      },
    },
  });
  const [forgive, { loading: forgiving }] = useMutation(FORGIVE_VIOLATION, {
    // Tha vi phạm có thể làm bản ghi rơi khỏi danh sách đang lọc.
    refetchQueries: [VIOLATIONS],
  });

  const result = (data ?? previousData)?.adminDriverViolations;
  const target = result?.items.find((item) => item.id === targetId) ?? null;

  function closeDialog() {
    setTargetId(null);
    setForgiveError(null);
  }

  async function handleForgive(reason: string) {
    if (!target) return;
    setForgiveError(null);
    try {
      await forgive({ variables: { input: { violationId: target.id, reason } } });
      notify(`Đã tha vi phạm của ${target.driver.fullName}.`);
      closeDialog();
    } catch (cause) {
      setForgiveError(errorMessage(cause));
    }
  }

  return (
    <>
      <PageHeader
        title="Vi phạm tài xế"
        description="Vi phạm do hệ thống tự ghi nhận khi tài xế bỏ chuyến, huỷ sát giờ hoặc bị báo cáo."
        mocked={isProposedApiMocked()}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <Select
            aria-label="Loại vi phạm"
            value={violationType}
            onChange={(event) => url.setParams({ type: event.target.value, page: null })}
          >
            <option value="">Tất cả loại vi phạm</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {VIOLATION_TYPE[option]}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Tình trạng xử lý"
            value={forgiven}
            onChange={(event) => url.setParams({ state: event.target.value, page: null })}
          >
            <option value="">Tất cả tình trạng</option>
            <option value="open">Còn hiệu lực</option>
            <option value="forgiven">Đã tha</option>
          </Select>
        </div>

        {!result && loading ? (
          <TableSkeleton />
        ) : !result ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : result.items.length === 0 ? (
          <EmptyState title="Không có vi phạm phù hợp" description="Thử đổi bộ lọc." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Tài xế</Th>
                  <Th>Vi phạm</Th>
                  <Th>Chuyến đi</Th>
                  <Th>Hình phạt</Th>
                  <Th>Tình trạng</Th>
                  <Th className="text-right">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((violation) => (
                  <Tr key={violation.id}>
                    <Td>
                      <PersonCell
                        person={violation.driver}
                        href={`/users/${violation.driver.id}`}
                      />
                    </Td>
                    <Td className="min-w-52">
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
                        <Link href={`/trips/${violation.trip.id}`} className="block hover:text-brand-700">
                          <TripRoute stops={violation.trip.stops} />
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <p>{PENALTY_ACTION[violation.penaltyAction]}</p>
                      {violation.penaltyUntil ? (
                        <p className="text-xs whitespace-nowrap text-muted">
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
                        <p className="mt-1 max-w-48 text-xs text-muted">
                          {violation.forgivenReason}
                        </p>
                      ) : null}
                    </Td>
                    <Td className="text-right">
                      {violation.isForgiven ? null : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setTargetId(violation.id)}
                        >
                          Tha vi phạm
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
              onPageChange={(next) => url.setParams({ page: next === 1 ? null : next })}
            />
          </>
        )}
      </Card>

      <ReasonDialog
        open={target !== null}
        onClose={closeDialog}
        title={target ? `Tha vi phạm của ${target.driver.fullName}?` : ""}
        description={
          target
            ? `${VIOLATION_TYPE[target.violationType]}. Vi phạm được tha sẽ không còn tính vào số lần bỏ chuyến của tài xế.`
            : undefined
        }
        reasonLabel="Lý do tha"
        confirmLabel="Tha vi phạm"
        busy={forgiving}
        error={forgiveError}
        onConfirm={handleForgive}
      />
    </>
  );
}
