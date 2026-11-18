"use client";

import { useQuery } from "@apollo/client/react";
import { ArrowUpRight, Eye, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PersonCell } from "@/components/person-cell";
import { UserQuickView } from "@/components/user-quick-view";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Pagination } from "@/components/ui/table";
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
  const [previewId, setPreviewId] = useState<string | null>(null);
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
            <div className="grid gap-5 bg-gray-50/50 p-5 md:grid-cols-2 2xl:grid-cols-3" aria-label="Danh bạ người dùng">{result.items.map((user) => <article key={user.id} className="rs-record-enter min-w-0 overflow-hidden rounded-xl border border-line bg-white"><div className="flex items-center justify-between gap-2 border-b border-line/70 px-5 py-3"><span className="text-xs text-muted">{USER_ROLE[user.role]}</span><StatusBadge meta={USER_STATUS[user.status]} /></div><div className="p-5"><PersonCell person={{ ...user, phone: null }} href={`/users/${user.id}`} /><p className="mt-5 text-sm tabular-nums">{user.phone ?? "Chưa có số điện thoại"}{user.phone && !user.isPhoneVerified ? <span className="ml-2 text-xs text-amber-700">Chưa xác thực</span> : null}</p><div className="mt-4 flex min-h-8 flex-wrap items-center gap-2 text-xs text-muted"><ShieldCheck className="size-4" aria-hidden />{user.driverProfile ? <StatusBadge meta={VERIFICATION_STATUS[user.driverProfile.verificationStatus]} /> : "Chưa đăng ký tài xế"}</div><p className="mt-3 text-xs text-muted">Tham gia {formatDate(user.createdAt)}</p></div><footer className="flex items-center justify-between border-t border-line/70 px-4 py-2"><Button variant="ghost" size="sm" onClick={() => setPreviewId(user.id)} aria-label={`Xem nhanh ${user.fullName}`}><Eye className="size-4" aria-hidden />Xem nhanh</Button><Link href={`/users/${user.id}`} className="inline-flex items-center gap-1.5 p-2 text-xs font-medium text-brand-700">Hồ sơ<ArrowUpRight className="size-3.5" aria-hidden /></Link></footer></article>)}</div>
            <Pagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
      {previewId ? <UserQuickView key={previewId} id={previewId} onClose={() => setPreviewId(null)} /> : null}
    </>
  );
}
