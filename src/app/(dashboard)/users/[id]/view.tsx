"use client";

import { useQuery } from "@apollo/client/react";
import { ArrowLeft, Lock, LockOpen, Mail, Phone, Star, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  Card,
  CardHeader,
  ErrorState,
  Fact,
  MockBadge,
  TableSkeleton,
} from "@/components/ui/misc";
import { USER_DETAIL } from "@/lib/graphql";
import {
  DRIVER_DOCUMENT_TYPE,
  GENDER,
  USER_ROLE,
  USER_STATUS,
  VEHICLE_TYPE,
  VERIFICATION_STATUS,
} from "@/lib/labels";
import { isExistingApiMocked } from "@/lib/mock-mode";
import { formatDate, formatDateTime } from "@/lib/utils";

export function UserDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(USER_DETAIL, { variables: { id } });

  const user = data?.adminUser;

  if (!user) {
    return (
      <>
        <BackLink />
        <Card>
          {loading ? <TableSkeleton /> : <ErrorState error={error} onRetry={() => refetch()} />}
        </Card>
      </>
    );
  }

  const profile = user.driverProfile;


  return (
    <>
      <BackLink />

      <section className="rs-profile-header relative mb-6 overflow-hidden rounded-2xl border border-line bg-white px-6 pb-6 pt-14">
        <div aria-hidden className="absolute inset-x-0 top-0 h-20 bg-brand-50" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{user.fullName}</h1>
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
          <Button variant="danger" disabled title="Khóa tài khoản thật chưa có API và cơ chế chặn phiên tương ứng">
            <Lock className="size-4" aria-hidden />
            Khoá tài khoản
          </Button>
        ) : user.status === "SUSPENDED" ? (
          <Button variant="secondary" disabled title="Mở khóa tài khoản thật chưa có API tương ứng">
            <LockOpen className="size-4" aria-hidden />
            Mở khoá tài khoản
          </Button>
        ) : null}
        </div>
        <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-4 text-sm text-muted"><span className="inline-flex items-center gap-2"><Mail className="size-4" aria-hidden />{user.email ?? "Chưa có email"}</span><span className="inline-flex items-center gap-2"><Phone className="size-4" aria-hidden />{user.phone ?? "Chưa có số điện thoại"}</span><span className="inline-flex items-center gap-2"><UserRound className="size-4" aria-hidden />{USER_ROLE[user.role]}</span></div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4"><div className="bg-white px-5 py-4"><p className="text-xs text-muted">Chuyến đã đi</p><p className="mt-2 text-2xl font-semibold tabular-nums">{user.totalRidesAsPassenger}</p></div><div className="bg-white px-5 py-4"><p className="text-xs text-muted">Đánh giá hành khách</p><div className="mt-2"><Rating value={user.ratingAsPassenger} /></div></div><div className="bg-white px-5 py-4"><p className="text-xs text-muted">Chuyến đã chở</p><p className="mt-2 text-2xl font-semibold tabular-nums">{user.totalRidesAsDriver}</p></div><div className="bg-white px-5 py-4"><p className="text-xs text-muted">Đánh giá tài xế</p><div className="mt-2">{profile ? <Rating value={user.ratingAsDriver} /> : "—"}</div></div></div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
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
          <CardHeader
            title="Hồ sơ tài xế"
            action={
              profile ? (
                <StatusBadge meta={VERIFICATION_STATUS[profile.verificationStatus]} />
              ) : undefined
            }
          />
          {!profile ? (
            <p className="px-5 py-6 text-sm text-muted">
              Người dùng này chưa đăng ký làm tài xế.
            </p>
          ) : (
            <div className="grid gap-x-8 gap-y-6 px-5 py-4 xl:grid-cols-2">
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
      </div>

    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/users"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand-700"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Danh sách người dùng
    </Link>
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
