"use client";

import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { USER_DETAIL } from "@/lib/graphql";
import { USER_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { Dialog } from "./ui/dialog";
import { Avatar, ErrorState, TableSkeleton } from "./ui/misc";
import { StatusBadge } from "./ui/badge";
import { buttonClass } from "./ui/button";

export function UserQuickView({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, loading, error, refetch } = useQuery(USER_DETAIL, { variables: { id }, fetchPolicy: "network-only" });
  const user = data?.adminUser;
  return <Dialog open onClose={onClose} title="Hồ sơ nhanh" footer={<Link href={`/users/${id}`} className={buttonClass()}>Mở hồ sơ đầy đủ<ArrowUpRight className="size-4" aria-hidden /></Link>}>
    {loading && !user ? <TableSkeleton /> : error ? <ErrorState error={error} onRetry={() => void refetch()} /> : user ? <div className="space-y-6">
      <div className="flex items-center gap-4"><Avatar name={user.fullName} src={user.avatarUrl} size="lg" /><div className="min-w-0"><h2 className="mb-2 text-xl font-semibold">{user.fullName}</h2><StatusBadge meta={USER_STATUS[user.status]} /></div></div>
      <div className="space-y-3 border-y border-line py-4 text-sm text-muted"><p className="flex items-center gap-2 break-all"><Mail className="size-4 shrink-0" aria-hidden />{user.email ?? "Chưa có email"}</p><p className="flex items-center gap-2"><Phone className="size-4 shrink-0" aria-hidden />{user.phone ?? "Chưa có số điện thoại"}</p><p>Tham gia {formatDate(user.createdAt)}</p></div>
      <dl className="grid grid-cols-2 gap-4"><div><dt className="text-xs text-muted">Chuyến đã đi</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{user.totalRidesAsPassenger}</dd></div><div><dt className="text-xs text-muted">Chuyến đã chở</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{user.totalRidesAsDriver}</dd></div></dl>
    </div> : <p className="text-sm text-muted">Không tìm thấy người dùng.</p>}
  </Dialog>;
}
