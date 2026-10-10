"use client";

import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import { useState } from "react";
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
import { isProposedApiMocked } from "@/lib/mock-mode";
import type { UserRole, UserStatus } from "@/lib/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export function UsersView() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());

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
        mocked={isProposedApiMocked()}
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
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            aria-label="Vai trò"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as UserRole | "");
              setPage(1);
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">{USER_ROLE.USER}</option>
            <option value="ADMIN">{USER_ROLE.ADMIN}</option>
          </Select>
          <Select
            aria-label="Trạng thái"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as UserStatus | "");
              setPage(1);
            }}
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
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
