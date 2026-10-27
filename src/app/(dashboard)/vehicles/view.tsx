"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { PersonCell } from "@/components/person-cell";
import { Badge, StatusBadge } from "@/components/ui/badge";
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
import { VEHICLES } from "@/lib/graphql";
import { VEHICLE_TYPE, VERIFICATION_STATUS } from "@/lib/labels";
import type { VehicleType, VerificationStatus } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;
const TYPE_OPTIONS = Object.keys(VEHICLE_TYPE) as VehicleType[];
const STATUS_OPTIONS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const satisfies readonly VerificationStatus[];

/** Tra cứu mọi phương tiện đã đăng ký, không chỉ những xe đang chờ duyệt. */
export function VehiclesView() {
  // Bộ lọc nằm trên URL: /vehicles?q=...&type=...&status=...&page=...
  const url = useUrlState();
  const vehicleType = url.getOption("type", TYPE_OPTIONS);
  const status = url.getOption("status", STATUS_OPTIONS);
  const page = url.getPage();
  const query = url.getText("q");
  const [search, setSearch] = useUrlSearchText(query, (q) => url.setParams({ q, page: null }));

  const { data, previousData, loading, error, refetch } = useQuery(VEHICLES, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        search: query || undefined,
        vehicleType: vehicleType || undefined,
        verificationStatus: status || undefined,
      },
    },
  });
  const result = (data ?? previousData)?.adminVehicles;

  return (
    <>
      <PageHeader
        title="Phương tiện"
        description="Mọi xe tài xế đã đăng ký. Tra theo biển số để biết xe thuộc về ai và đã được duyệt chưa."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Tìm phương tiện"
              placeholder="Tìm theo biển số, hãng xe, dòng xe, chủ xe"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Loại xe"
            value={vehicleType}
            onChange={(event) => url.setParams({ type: event.target.value, page: null })}
          >
            <option value="">Tất cả loại xe</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {VEHICLE_TYPE[option]}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Trạng thái duyệt"
            value={status}
            onChange={(event) => url.setParams({ status: event.target.value, page: null })}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {VERIFICATION_STATUS[option].label}
              </option>
            ))}
          </Select>
        </div>

        {!result && loading ? (
          <TableSkeleton />
        ) : !result ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : result.items.length === 0 ? (
          <EmptyState
            title="Không có phương tiện phù hợp"
            description="Thử đổi từ khoá hoặc bộ lọc."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Phương tiện</Th>
                  <Th>Biển số</Th>
                  <Th>Chủ xe</Th>
                  <Th>Giấy tờ</Th>
                  <Th>Sử dụng</Th>
                  <Th>Đăng ký ngày</Th>
                  <Th className="text-right">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((vehicle) => (
                  <Tr key={vehicle.id}>
                    <Td>
                      <p className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted">
                        {VEHICLE_TYPE[vehicle.vehicleType]} · {vehicle.color}
                        {vehicle.year ? ` · ${vehicle.year}` : ""}
                      </p>
                    </Td>
                    <Td className="font-medium whitespace-nowrap tabular-nums">
                      {vehicle.plateNumber}
                    </Td>
                    <Td>
                      <PersonCell
                        person={vehicle.driverProfile.user}
                        href={`/users/${vehicle.driverProfile.user.id}`}
                      />
                    </Td>
                    <Td>
                      <StatusBadge meta={VERIFICATION_STATUS[vehicle.verificationStatus]} />
                    </Td>
                    <Td>
                      {vehicle.isActive ? (
                        <Badge tone="good">Đang dùng</Badge>
                      ) : (
                        <Badge tone="neutral">Tạm ngưng</Badge>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDate(vehicle.createdAt)}
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/verifications/drivers/${vehicle.driverProfile.id}`}
                        className={buttonClass("secondary", "sm")}
                      >
                        Xem giấy tờ
                      </Link>
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
    </>
  );
}
