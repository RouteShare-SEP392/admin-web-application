"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import { PersonCell } from "@/components/person-cell";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination, Table, Td, Th, Tr } from "@/components/ui/table";
import { USERS } from "@/lib/graphql";
import { USER_ROLE, USER_STATUS, VERIFICATION_STATUS } from "@/lib/labels";
import type { UserRole, UserStatus } from "@/lib/types";
import { useUrlSearchText, useUrlState } from "@/lib/use-url-state";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;
const ROLE_OPTIONS = ["USER", "ADMIN"] as const satisfies readonly UserRole[];
const STATUS_OPTIONS = [
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
] as const satisfies readonly UserStatus[];

export function UsersView() {
  // Bộ lọc nằm trên URL: /users?q=...&role=...&status=...&page=...
  const url = useUrlState();
  const role = url.getOption("role", ROLE_OPTIONS);
  const status = url.getOption("status", STATUS_OPTIONS);
  const page = url.getPage();
  const debouncedSearch = url.getText("q");
  const [search, setSearch] = useUrlSearchText(debouncedSearch, (q) =>
    url.setParams({ q, page: null }),
  );

  const { data, previousData, loading, error, refetch } = useQuery(USERS, {
    variables: {
      input: {
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: role || undefined,
        status: status || undefined,
      },
    },
  });
  // Giữ trang cũ trên màn hình trong lúc tải trang mới để bảng không nhấp nháy.
  const result = (data ?? previousData)?.adminUsers;

  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Tra cứu tài khoản hành khách, tài xế và quản trị viên."
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
              aria-label="Tìm người dùng"
              placeholder="Tìm theo họ tên, email, số điện thoại"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Vai trò"
            value={role}
            onChange={(event) => url.setParams({ role: event.target.value, page: null })}
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">{USER_ROLE.USER}</option>
            <option value="ADMIN">{USER_ROLE.ADMIN}</option>
          </Select>
          <Select
            aria-label="Trạng thái"
            value={status}
            onChange={(event) => url.setParams({ status: event.target.value, page: null })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">{USER_STATUS.ACTIVE.label}</option>
            <option value="SUSPENDED">{USER_STATUS.SUSPENDED.label}</option>
            <option value="DEACTIVATED">{USER_STATUS.DEACTIVATED.label}</option>
          </Select>
        </div>

        {!result && loading ? (
          <TableSkeleton />
        ) : !result ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : result.items.length === 0 ? (
          <EmptyState
            title="Không có người dùng phù hợp"
            description="Thử đổi từ khoá hoặc bộ lọc."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Người dùng</Th>
                  <Th>Số điện thoại</Th>
                  <Th>Vai trò</Th>
                  <Th>Hồ sơ tài xế</Th>
                  <Th>Trạng thái</Th>
                  <Th>Ngày tham gia</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <PersonCell
                        person={{ ...user, phone: null }}
                        href={`/users/${user.id}`}
                      />
                    </Td>
                    <Td className="whitespace-nowrap tabular-nums">
                      {user.phone ?? <span className="text-muted">Chưa có</span>}
                      {user.phone && !user.isPhoneVerified ? (
                        <span className="ml-1.5 text-xs text-amber-700">(chưa xác thực)</span>
                      ) : null}
                    </Td>
                    <Td>{USER_ROLE[user.role]}</Td>
                    <Td>
                      {user.driverProfile ? (
                        <StatusBadge
                          meta={VERIFICATION_STATUS[user.driverProfile.verificationStatus]}
                        />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge meta={USER_STATUS[user.status]} />
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDate(user.createdAt)}
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
