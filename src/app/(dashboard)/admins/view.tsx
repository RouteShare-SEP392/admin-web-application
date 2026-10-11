"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { UserPlus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { PersonCell } from "@/components/person-cell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, ReasonDialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/components/ui/misc";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { CREATE_ADMIN, ME, SUSPEND_USER, UNSUSPEND_USER, USERS } from "@/lib/graphql";
import { USER_STATUS } from "@/lib/labels";
import { isProposedApiMocked } from "@/lib/mock-mode";
import { errorMessage, formatDate } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;
// Số quản trị viên luôn ít, nên lấy hết trong một trang.
const ADMIN_LIST = { input: { role: "ADMIN" as const, page: 1, pageSize: 100 } };

export function AdminsView() {
  const { data, loading, error, refetch } = useQuery(USERS, { variables: ADMIN_LIST });
  const { data: meData } = useQuery(ME);
  const [suspend, { loading: suspending }] = useMutation(SUSPEND_USER);
  const [unsuspend, { loading: unsuspending }] = useMutation(UNSUSPEND_USER);
  const notify = useToast();

  const [creating, setCreating] = useState(false);
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  const admins = data?.adminUsers.items;
  const myId = meData?.me.id;
  const suspendTarget = admins?.find((admin) => admin.id === suspendId) ?? null;

  async function handleSuspend(reason: string) {
    if (!suspendTarget) return;
    setSuspendError(null);
    try {
      await suspend({ variables: { input: { userId: suspendTarget.id, reason } } });
      notify(`Đã khoá quản trị viên ${suspendTarget.fullName}.`);
      setSuspendId(null);
    } catch (cause) {
      setSuspendError(errorMessage(cause));
    }
  }

  async function handleUnsuspend(userId: string, fullName: string) {
    try {
      await unsuspend({ variables: { userId } });
      notify(`Đã mở khoá quản trị viên ${fullName}.`);
    } catch (cause) {
      notify(errorMessage(cause), "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Quản trị viên"
        description="Những tài khoản đăng nhập được vào trang quản trị. Mọi quản trị viên hiện có cùng quyền."
        mocked={isProposedApiMocked()}
        action={
          <Button onClick={() => setCreating(true)}>
            <UserPlus className="size-4" aria-hidden />
            Thêm quản trị viên
          </Button>
        }
      />

      <Card>
        {!admins && loading ? (
          <TableSkeleton rows={3} />
        ) : !admins ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : admins.length === 0 ? (
          <EmptyState title="Chưa có quản trị viên nào" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Quản trị viên</Th>
                <Th>Trạng thái</Th>
                <Th>Tạo ngày</Th>
                <Th className="text-right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const isMe = admin.id === myId;
                return (
                  <Tr key={admin.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <PersonCell person={admin} />
                        {isMe ? <Badge tone="active">Bạn</Badge> : null}
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge meta={USER_STATUS[admin.status]} />
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDate(admin.createdAt)}
                    </Td>
                    <Td className="text-right">
                      {isMe ? (
                        <span className="text-sm text-muted">Không tự khoá được</span>
                      ) : admin.status === "ACTIVE" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSuspendId(admin.id)}
                        >
                          Khoá
                        </Button>
                      ) : admin.status === "SUSPENDED" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={unsuspending}
                          onClick={() => handleUnsuspend(admin.id, admin.fullName)}
                        >
                          Mở khoá
                        </Button>
                      ) : null}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {creating ? <CreateAdminDialog onClose={() => setCreating(false)} /> : null}

      <ReasonDialog
        open={suspendTarget !== null}
        onClose={() => {
          setSuspendId(null);
          setSuspendError(null);
        }}
        title={suspendTarget ? `Khoá quản trị viên ${suspendTarget.fullName}?` : ""}
        description="Người này sẽ không đăng nhập được vào trang quản trị cho đến khi được mở khoá."
        reasonLabel="Lý do khoá"
        confirmLabel="Khoá tài khoản"
        danger
        busy={suspending}
        error={suspendError}
        onConfirm={handleSuspend}
      />
    </>
  );
}

function CreateAdminDialog({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createAdmin, { loading }] = useMutation(CREATE_ADMIN, {
    refetchQueries: [USERS],
    awaitRefetchQueries: true,
  });
  const notify = useToast();
  const formId = useId();

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const ready =
    fullName.trim().length >= 2 && email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setFormError(null);
    try {
      await createAdmin({
        variables: { input: { fullName: fullName.trim(), email: email.trim(), password } },
      });
      notify(`Đã thêm quản trị viên ${fullName.trim()}.`);
      onClose();
    } catch (cause) {
      setFormError(errorMessage(cause));
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Thêm quản trị viên"
      description="Người mới đăng nhập bằng email và mật khẩu ban đầu bạn đặt, rồi tự đổi mật khẩu ở trang Tài khoản của tôi."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Quay lại
          </Button>
          <Button type="submit" form={formId} disabled={!ready || loading}>
            {loading ? "Đang thêm…" : "Thêm quản trị viên"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Họ tên" htmlFor="admin-name">
          <Input
            id="admin-name"
            autoComplete="off"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Email đăng nhập" htmlFor="admin-email">
          <Input
            id="admin-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field
          label="Mật khẩu ban đầu"
          htmlFor="admin-password"
          hint={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự. Gửi cho người mới qua kênh riêng.`}
          error={tooShort ? `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.` : null}
        >
          <Input
            id="admin-password"
            type="text"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {formError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
