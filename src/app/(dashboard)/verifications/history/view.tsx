"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PersonCell } from "@/components/person-cell";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { DRIVER_VERIFICATION_HISTORY, VEHICLE_VERIFICATION_HISTORY } from "@/lib/graphql";
import { DRIVER_DOCUMENT_TYPE, VEHICLE_TYPE, VERIFICATION_STATUS } from "@/lib/labels";
import type { VerificationStatus } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";
import { cn, formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;
const TABS = [
  { key: "drivers", label: "Giấy tờ tài xế" },
  { key: "vehicles", label: "Giấy tờ xe" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const RESULT_OPTIONS = ["APPROVED", "REJECTED"] as const satisfies readonly VerificationStatus[];

interface Reviewed {
  status: VerificationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: { fullName: string } | null;
}

/** Hồ sơ đã được duyệt hoặc từ chối, để rà soát lại quyết định cũ. */
export function VerificationHistoryView() {
  // Bộ lọc nằm trên URL: /verifications/history?tab=vehicles&result=REJECTED&q=...&page=...
  const url = useUrlState();
  const tab: TabKey = url.getOption("tab", ["vehicles"] as const) || "drivers";
  const result = url.getOption("result", RESULT_OPTIONS);
  const page = url.getPage();
  const query = url.getText("q");
  const [search, setSearch] = useUrlSearchText(query, (q) => url.setParams({ q, page: null }));

  const variables = {
    input: {
      page,
      pageSize: PAGE_SIZE,
      statuses: result ? [result] : [...RESULT_OPTIONS],
      search: query || undefined,
    },
  };
  const drivers = useQuery(DRIVER_VERIFICATION_HISTORY, { variables, skip: tab !== "drivers" });
  const vehicles = useQuery(VEHICLE_VERIFICATION_HISTORY, {
    variables,
    skip: tab !== "vehicles",
  });
  const active = tab === "drivers" ? drivers : vehicles;
  const driverPage = (drivers.data ?? drivers.previousData)?.adminDriverVerifications;
  const vehiclePage = (vehicles.data ?? vehicles.previousData)?.adminVehicleVerifications;
  const current = tab === "drivers" ? driverPage : vehiclePage;

  return (
    <>
      <PageHeader
        title="Lịch sử xét duyệt"
        description="Giấy tờ đã được phê duyệt hoặc từ chối, mới xử lý xếp trước."
      />

      <div
        className="mb-4 inline-flex rounded-lg bg-gray-100 p-1"
        role="group"
        aria-label="Loại giấy tờ"
      >
        {TABS.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={tab === option.key}
            onClick={() =>
              url.setParams({ tab: option.key === "drivers" ? null : option.key, page: null })
            }
            className={cn(
              "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
              tab === option.key
                ? "bg-white text-brand-800 shadow-sm"
                : "text-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Tìm trong lịch sử xét duyệt"
              placeholder={
                tab === "drivers"
                  ? "Tìm theo tên, email, số điện thoại, số giấy tờ"
                  : "Tìm theo biển số, hãng xe, chủ xe"
              }
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Kết quả xét duyệt"
            value={result}
            onChange={(event) => url.setParams({ result: event.target.value, page: null })}
          >
            <option value="">Mọi kết quả</option>
            <option value="APPROVED">{VERIFICATION_STATUS.APPROVED.label}</option>
            <option value="REJECTED">{VERIFICATION_STATUS.REJECTED.label}</option>
          </Select>
        </div>

        {!current && active.loading ? (
          <TableSkeleton />
        ) : !current ? (
          <ErrorState error={active.error} onRetry={() => active.refetch()} />
        ) : current.items.length === 0 ? (
          <EmptyState
            title="Không có hồ sơ phù hợp"
            description="Thử đổi từ khoá hoặc bộ lọc kết quả."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{tab === "drivers" ? "Tài xế" : "Phương tiện"}</Th>
                  <Th>{tab === "drivers" ? "Giấy tờ" : "Chủ xe"}</Th>
                  <Th>Kết quả</Th>
                  <Th>Người duyệt</Th>
                  <Th>Thời điểm</Th>
                  <Th className="text-right">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {tab === "drivers"
                  ? driverPage?.items.map((doc) => (
                      <HistoryRow
                        key={doc.id}
                        reviewed={doc}
                        profileId={doc.driverProfile.id}
                        first={
                          <PersonCell
                            person={doc.driverProfile.user}
                            href={`/verifications/drivers/${doc.driverProfile.id}`}
                          />
                        }
                        second={
                          <>
                            {DRIVER_DOCUMENT_TYPE[doc.type]}
                            {doc.licenseClass ? ` hạng ${doc.licenseClass}` : ""}
                          </>
                        }
                      />
                    ))
                  : vehiclePage?.items.map((doc) => (
                      <HistoryRow
                        key={doc.id}
                        reviewed={doc}
                        profileId={doc.vehicle.driverProfile.id}
                        first={
                          <>
                            <p className="font-medium">
                              {doc.vehicle.make} {doc.vehicle.model} ·{" "}
                              <span className="tabular-nums">{doc.vehicle.plateNumber}</span>
                            </p>
                            <p className="text-xs text-muted">
                              {VEHICLE_TYPE[doc.vehicle.vehicleType]} · {doc.vehicle.color}
                            </p>
                          </>
                        }
                        second={<PersonCell person={doc.vehicle.driverProfile.user} />}
                      />
                    ))}
              </tbody>
            </Table>
            <Pagination
              page={current.page}
              pageSize={current.pageSize}
              total={current.total}
              onPageChange={(next) => url.setParams({ page: next === 1 ? null : next })}
            />
          </>
        )}
      </Card>
    </>
  );
}

function HistoryRow({
  reviewed,
  profileId,
  first,
  second,
}: {
  reviewed: Reviewed;
  profileId: string;
  first: ReactNode;
  second: ReactNode;
}) {
  return (
    <Tr>
      <Td>{first}</Td>
      <Td>{second}</Td>
      <Td>
        <StatusBadge meta={VERIFICATION_STATUS[reviewed.status]} />
        {reviewed.rejectReason ? (
          <p className="mt-1 max-w-64 text-xs text-muted">{reviewed.rejectReason}</p>
        ) : null}
      </Td>
      <Td className="whitespace-nowrap">{reviewed.reviewedBy?.fullName ?? "—"}</Td>
      <Td className="whitespace-nowrap text-muted">{formatDateTime(reviewed.reviewedAt)}</Td>
      <Td className="text-right">
        <Link
          href={`/verifications/drivers/${profileId}`}
          className={buttonClass("secondary", "sm")}
        >
          Xem hồ sơ
        </Link>
      </Td>
    </Tr>
  );
}
