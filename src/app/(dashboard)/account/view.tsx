"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuditLogTable } from "@/components/audit-log-table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  Avatar,
  Card,
  CardHeader,
  ErrorState,
  Fact,
  PageHeader,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { AUDIT_LOGS, CHANGE_PASSWORD, ME } from "@/lib/graphql";
import { USER_ROLE } from "@/lib/labels";
import { isExistingApiMocked } from "@/lib/mock-mode";
import { errorMessage, formatDate } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  // Tải lại toàn trang để xoá cache Apollo của phiên vừa đăng xuất.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}

export function AccountView() {
  const { data, loading, error, refetch } = useQuery(ME);
  const me = data?.me;

  return (
    <>
      <PageHeader
        title="Tài khoản của tôi"
        description="Thông tin đăng nhập của bạn và các thao tác bạn đã thực hiện gần đây."
      />

      {!me ? (
        <Card>
          {loading ? <TableSkeleton rows={3} /> : <ErrorState error={error} onRetry={() => refetch()} />}
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-4 border-b border-line p-5">
              <Avatar name={me.fullName} src={me.avatarUrl} size="lg" />
              <div>
                <p className="text-lg font-semibold">{me.fullName}</p>
                <Badge tone="active">{USER_ROLE[me.role]}</Badge>
              </div>
            </div>
            <dl className="divide-y divide-line px-5 py-2">
              <Fact label="Email">{me.email ?? "—"}</Fact>
              <Fact label="Số điện thoại">{me.phone ?? "—"}</Fact>
              <Fact label="Tạo tài khoản ngày">{formatDate(me.createdAt)}</Fact>
              <Fact label="Phiên đăng nhập">Tự hết hạn sau 7 ngày</Fact>
            </dl>
            <div className="border-t border-line p-5">
              <Button variant="secondary" onClick={logout}>
                <LogOut className="size-4" aria-hidden />
                Đăng xuất
              </Button>
            </div>
          </Card>

          <ChangePasswordCard />

          <RecentActivityCard adminId={me.id} />
        </div>
      )}
    </>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD);
  const notify = useToast();

  const tooShort = next.length > 0 && next.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== next;
  const ready =
    current.length > 0 && next.length >= MIN_PASSWORD_LENGTH && confirm === next;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setFormError(null);
    try {
      await changePassword({
        variables: { input: { currentPassword: current, newPassword: next } },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      notify("Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.");
    } catch (cause) {
      setFormError(errorMessage(cause));
    }
  }

  return (
    <Card>
      <CardHeader
        title="Đổi mật khẩu"
        description={
          isExistingApiMocked()
            ? "Đang chạy dữ liệu mẫu: mật khẩu mới chỉ có hiệu lực tới khi khởi động lại máy chủ."
            : undefined
        }
      />
      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <Field label="Mật khẩu hiện tại" htmlFor="current-password">
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </Field>
        <Field
          label="Mật khẩu mới"
          htmlFor="new-password"
          hint={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`}
          error={tooShort ? `Mật khẩu mới cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.` : null}
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        </Field>
        <Field
          label="Nhập lại mật khẩu mới"
          htmlFor="confirm-password"
          error={mismatch ? "Hai lần nhập mật khẩu mới chưa khớp." : null}
        >
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>

        {formError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={!ready || loading}>
          {loading ? "Đang đổi…" : "Đổi mật khẩu"}
        </Button>
      </form>
    </Card>
  );
}

function RecentActivityCard({ adminId }: { adminId: string }) {
  const { data, loading, error, refetch } = useQuery(AUDIT_LOGS, {
    variables: { input: { actorId: adminId, page: 1, pageSize: 5 } },
  });
  const result = data?.adminAuditLogs;

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Thao tác gần đây của tôi"
        action={
          <Link href="/audit-log" className={buttonClass("secondary", "sm")}>
            Xem toàn bộ nhật ký
          </Link>
        }
      />
      {!result && loading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : !result ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : result.items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">Bạn chưa thực hiện thao tác nào.</p>
      ) : (
        <AuditLogTable entries={result.items} showActor={false} />
      )}
    </Card>
  );
}
