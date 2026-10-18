"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Lock, LockOpen, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BackLink } from "@/components/back-link";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { ReasonDialog } from "@/components/ui/dialog";
import {
  Avatar,
  Card,
  CardHeader,
  ErrorState,
  Fact,
  MockBadge,
  TableSkeleton,
} from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { BookingsCard, PostedTripsCard, ViolationsCard } from "./activity";
import { SUSPEND_USER, UNSUSPEND_USER, USER_DETAIL } from "@/lib/graphql";
import {
  DRIVER_DOCUMENT_TYPE,
  GENDER,
  USER_ROLE,
  USER_STATUS,
  VEHICLE_TYPE,
  VERIFICATION_STATUS,
} from "@/lib/labels";
import { isExistingApiMocked } from "@/lib/mock-mode";
import { errorMessage, formatDate, formatDateTime } from "@/lib/utils";

export function UserDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(USER_DETAIL, { variables: { id } });
  const [suspend, { loading: suspending }] = useMutation(SUSPEND_USER);
  const [unsuspend, { loading: unsuspending }] = useMutation(UNSUSPEND_USER);
  const notify = useToast();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  const user = data?.adminUser;

  if (!user) {
    return (
      <>
        <BackLink href="/users" label="Danh sách người dùng" />
        <Card>
          {loading ? <TableSkeleton /> : <ErrorState error={error} onRetry={() => refetch()} />}
        </Card>
      </>
    );
  }

  const profile = user.driverProfile;

  async function handleSuspend(reason: string) {
    setSuspendError(null);
    try {
      await suspend({ variables: { input: { userId: id, reason } } });
      setSuspendOpen(false);
      notify(`Đã khoá tài khoản ${user!.fullName}.`);
    } catch (cause) {
      setSuspendError(errorMessage(cause));
    }
  }

  async function handleUnsuspend() {
    try {
      await unsuspend({ variables: { userId: id } });
      notify(`Đã mở khoá tài khoản ${user!.fullName}.`);
    } catch (cause) {
      notify(errorMessage(cause), "error");
    }
  }

  return (
    <>
      <BackLink href="/users" label="Danh sách người dùng" />

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{user.fullName}</h1>
              <StatusBadge meta={USER_STATUS[user.status]} />
              {user.role === "ADMIN" ? <Badge tone="active">{USER_ROLE.ADMIN}</Badge> : null}
              {isExistingApiMocked() ? <MockBadge /> : null}
            </div>
            <p className="mt-1 text-sm text-muted">
              Tham gia ngày {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        {user.role === "ADMIN" ? null : user.status === "ACTIVE" ? (
          <Button variant="danger" onClick={() => setSuspendOpen(true)}>
            <Lock className="size-4" aria-hidden />
            Khoá tài khoản
          </Button>
        ) : user.status === "SUSPENDED" ? (
          <Button variant="secondary" onClick={handleUnsuspend} disabled={unsuspending}>
            <LockOpen className="size-4" aria-hidden />
            {unsuspending ? "Đang mở khoá…" : "Mở khoá tài khoản"}
          </Button>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Thông tin tài khoản" />
          <dl className="divide-y divide-line px-5 py-2">
            <Fact label="Email">{user.email ?? "—"}</Fact>
            <Fact label="Số điện thoại">
              {user.phone ?? "—"}
              {user.phone ? (
                <span className="ml-2 font-normal text-muted">
                  ({user.isPhoneVerified ? "đã xác thực" : "chưa xác thực"})
                </span>
              ) : null}
            </Fact>
            <Fact label="Ngày sinh">{formatDate(user.dateOfBirth)}</Fact>
            <Fact label="Giới tính">{user.gender ? GENDER[user.gender] : "—"}</Fact>
            <Fact label="Vai trò">{USER_ROLE[user.role]}</Fact>
            <Fact label="Danh tính">
              {user.isIdentityVerified ? "Đã xác minh" : "Chưa xác minh"}
            </Fact>
            <Fact label="Cập nhật lần cuối">{formatDateTime(user.updatedAt)}</Fact>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Hoạt động" />
          <dl className="divide-y divide-line px-5 py-2">
            <Fact label="Chuyến đã đi (hành khách)">{user.totalRidesAsPassenger}</Fact>
            <Fact label="Điểm đánh giá (hành khách)">
              <Rating value={user.ratingAsPassenger} />
            </Fact>
            <Fact label="Chuyến đã chở (tài xế)">{user.totalRidesAsDriver}</Fact>
            <Fact label="Điểm đánh giá (tài xế)">
              {profile ? <Rating value={user.ratingAsDriver} /> : "—"}
            </Fact>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Hồ sơ tài xế"
            action={
              profile ? (
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge meta={VERIFICATION_STATUS[profile.verificationStatus]} />
                  <Link
                    href={`/verifications/drivers/${profile.id}`}
                    className={buttonClass("secondary", "sm")}
                  >
                    Mở hồ sơ và giấy tờ
                  </Link>
                </div>
              ) : undefined
            }
          />
          {!profile ? (
            <p className="px-5 py-6 text-sm text-muted">
              Người dùng này chưa đăng ký làm tài xế.
            </p>
          ) : (
            <div className="grid gap-x-8 gap-y-6 px-5 py-4 lg:grid-cols-3">
              <dl className="divide-y divide-line">
                <Fact label="Kinh nghiệm lái xe">{profile.experienceYears} năm</Fact>
                <Fact label="Số lần bỏ chuyến">{profile.noShowStrikeCount}</Fact>
                <Fact label="Duyệt lúc">{formatDateTime(profile.verifiedAt)}</Fact>
                <Fact label="Tạm khoá đến">{formatDateTime(profile.suspendedUntil)}</Fact>
                {profile.rejectionReason ? (
                  <Fact label="Lý do từ chối">{profile.rejectionReason}</Fact>
                ) : null}
              </dl>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Giấy tờ</h3>
                {profile.verifications?.length ? (
                  <ul className="space-y-2">
                    {profile.verifications.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"
                      >
                        <span>
                          {DRIVER_DOCUMENT_TYPE[doc.type]}
                          {doc.licenseClass ? ` hạng ${doc.licenseClass}` : ""}
                        </span>
                        <StatusBadge meta={VERIFICATION_STATUS[doc.status]} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Chưa nộp giấy tờ.</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Phương tiện</h3>
                {profile.vehicles?.length ? (
                  <ul className="space-y-2">
                    {profile.vehicles.map((vehicle) => (
                      <li
                        key={vehicle.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="font-medium">
                            {vehicle.make} {vehicle.model}
                          </span>
                          <span className="block text-xs text-muted">
                            {vehicle.plateNumber} · {VEHICLE_TYPE[vehicle.vehicleType]}
                          </span>
                        </span>
                        <StatusBadge meta={VERIFICATION_STATUS[vehicle.verificationStatus]} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Chưa đăng ký xe.</p>
                )}
              </section>
            </div>
          )}
        </Card>

        {profile ? <PostedTripsCard userId={user.id} /> : null}
        {user.role === "USER" ? <BookingsCard userId={user.id} /> : null}
        {profile ? <ViolationsCard userId={user.id} /> : null}
      </div>

      <ReasonDialog
        open={suspendOpen}
        onClose={() => {
          setSuspendOpen(false);
          setSuspendError(null);
        }}
        title={`Khoá tài khoản ${user.fullName}?`}
        description="Người dùng sẽ không thể đăng nhập, đặt chỗ hay đăng chuyến cho đến khi được mở khoá."
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

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
      {value.toFixed(2)}
    </span>
  );
}
