"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BackLink } from "@/components/back-link";
import { DocumentCard, Row } from "@/components/document-card";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ReasonDialog } from "@/components/ui/dialog";
import {
  Avatar,
  Card,
  ErrorState,
  TableSkeleton,
} from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import {
  DRIVER_PROFILE,
  PENDING_COUNTS,
  REVIEW_DRIVER_VERIFICATION,
  REVIEW_VEHICLE_VERIFICATION,
} from "@/lib/graphql";
import { documentsToResubmit, isSuspended, vehicleApprovalBlocker } from "@/lib/driver-rules";
import { DRIVER_DOCUMENT_TYPE, VEHICLE_TYPE, VERIFICATION_STATUS } from "@/lib/labels";
import type { DriverVerificationType, VerificationStatus } from "@/lib/types";
import { errorMessage, formatDate, formatDateTime } from "@/lib/utils";
import { ViolationsSection } from "./violations-section";

const DRIVER_DOCUMENT_ORDER: DriverVerificationType[] = ["IDENTITY_CARD", "DRIVER_LICENSE"];

/** Các bản nộp, mới trước: bản đầu là bản đang xét, phần còn lại là lịch sử. */
function newestFirst<T extends { createdAt: string }>(docs: T[]): T[] {
  return [...docs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Giấy tờ đang được xử lý: thuộc tài xế hay thuộc một chiếc xe. */
interface ReviewTarget {
  kind: "driver" | "vehicle";
  id: string;
  label: string;
}

/**
 * Toàn bộ giấy tờ và phương tiện của một tài xế trên một trang, để quản trị
 * viên đối chiếu và duyệt một lượt thay vì đi qua hai hàng chờ riêng.
 */
export function DriverProfileView() {
  const { profileId } = useParams<{ profileId: string }>();
  const { data, loading, error, refetch } = useQuery(DRIVER_PROFILE, {
    variables: { id: profileId },
  });
  const refetchAfterReview = {
    refetchQueries: [DRIVER_PROFILE, PENDING_COUNTS],
    awaitRefetchQueries: true,
  };
  const [reviewDriverDoc] = useMutation(REVIEW_DRIVER_VERIFICATION, refetchAfterReview);
  const [reviewVehicleDoc] = useMutation(REVIEW_VEHICLE_VERIFICATION, refetchAfterReview);
  const notify = useToast();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<ReviewTarget | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const profile = data?.adminDriverProfile;
  const back = <BackLink href="/verifications/drivers" label="Hồ sơ tài xế chờ duyệt" />;

  if (!profile) {
    return (
      <>
        {back}
        <Card>
          {loading ? <TableSkeleton /> : <ErrorState error={error} onRetry={() => refetch()} />}
        </Card>
      </>
    );
  }

  const { user } = profile;
  const driverDocs = profile.verifications ?? [];
  const vehicles = profile.vehicles ?? [];
  const pendingCount =
    driverDocs.filter((doc) => doc.status === "PENDING").length +
    vehicles.flatMap((v) => v.verifications ?? []).filter((doc) => doc.status === "PENDING")
      .length;
  const toResubmit = documentsToResubmit(driverDocs);
  const suspended = isSuspended(profile);

  /** Gửi kết quả xét duyệt; trả về thông báo lỗi nếu thất bại. */
  async function review(
    target: ReviewTarget,
    status: VerificationStatus,
    rejectionReason?: string,
  ): Promise<string | null> {
    setBusyId(target.id);
    try {
      const variables = { input: { verificationId: target.id, status, rejectionReason } };
      if (target.kind === "driver") await reviewDriverDoc({ variables });
      else await reviewVehicleDoc({ variables });
      notify(
        status === "APPROVED"
          ? `Đã phê duyệt ${target.label}.`
          : `Đã từ chối ${target.label}.`,
      );
      return null;
    } catch (cause) {
      return errorMessage(cause);
    } finally {
      setBusyId(null);
    }
  }

  async function approve(target: ReviewTarget) {
    const failure = await review(target, "APPROVED");
    if (failure) notify(failure, "error");
  }

  async function confirmReject(reason: string) {
    if (!rejecting) return;
    setRejectError(null);
    const failure = await review(rejecting, "REJECTED", reason);
    if (failure) setRejectError(failure);
    else setRejecting(null);
  }

  return (
    <>
      {back}

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{user.fullName}</h1>
              <StatusBadge meta={VERIFICATION_STATUS[profile.verificationStatus]} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {[user.phone, user.email].filter(Boolean).join(" · ") || "Chưa có thông tin liên hệ"}
            </p>
            <p className="mt-1 text-sm text-muted">
              Sinh ngày {formatDate(user.dateOfBirth)} · {profile.experienceYears} năm kinh nghiệm
              lái xe · đăng ký làm tài xế ngày {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href={`/users/${user.id}`} className={buttonClass("secondary", "sm")}>
            Xem tài khoản
          </Link>
          <p className="text-sm text-muted">
            {pendingCount > 0
              ? `${pendingCount} giấy tờ đang chờ duyệt`
              : toResubmit.length > 0
                ? `Chờ tài xế nộp lại ${toResubmit.map((type) => DRIVER_DOCUMENT_TYPE[type]).join(", ")}`
                : "Không còn giấy tờ nào chờ duyệt"}
          </p>
        </div>
      </Card>

      {profile.verificationStatus === "REJECTED" && profile.rejectionReason ? (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-semibold">Hồ sơ đang bị từ chối.</span> {profile.rejectionReason}
        </p>
      ) : null}

      {suspended ? (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Đang tạm khoá quyền đăng chuyến</span> đến{" "}
          {formatDateTime(profile.suspendedUntil)} do bỏ chuyến. Xem và tha vi phạm ở mục Vi phạm
          bên dưới.
        </p>
      ) : null}

      <section aria-labelledby="driver-documents">
        <h2 id="driver-documents" className="mb-3 text-lg font-semibold">
          Giấy tờ tài xế
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {DRIVER_DOCUMENT_ORDER.map((type) => {
            const [doc = null, ...previous] = newestFirst(
              driverDocs.filter((d) => d.type === type),
            );
            const target: ReviewTarget | null = doc && {
              kind: "driver",
              id: doc.id,
              label: `${DRIVER_DOCUMENT_TYPE[type].toLowerCase()} của ${user.fullName}`,
            };
            return (
              <DocumentCard
                key={type}
                title={DRIVER_DOCUMENT_TYPE[type]}
                document={doc}
                previous={previous}
                facts={
                  doc?.licenseClass ? <Row label="Hạng bằng lái">{doc.licenseClass}</Row> : null
                }
                busy={busyId === doc?.id}
                onApprove={target ? () => approve(target) : undefined}
                onReject={target ? () => setRejecting(target) : undefined}
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="driver-vehicles" className="mt-8">
        <h2 id="driver-vehicles" className="mb-3 text-lg font-semibold">
          Phương tiện ({vehicles.length})
        </h2>
        {vehicles.length === 0 ? (
          <Card className="px-5 py-6 text-sm text-muted">Tài xế chưa đăng ký xe nào.</Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {vehicles.map((vehicle) => {
              const [doc = null, ...previous] = newestFirst(vehicle.verifications ?? []);
              const target: ReviewTarget | null = doc && {
                kind: "vehicle",
                id: doc.id,
                label: `giấy đăng ký xe ${vehicle.plateNumber}`,
              };
              return (
                <DocumentCard
                  key={vehicle.id}
                  title={`${vehicle.make} ${vehicle.model} · ${vehicle.plateNumber}`}
                  document={doc}
                  previous={previous}
                  facts={
                    <>
                      <Row label="Loại xe">
                        {VEHICLE_TYPE[vehicle.vehicleType]} · {vehicle.seatCapacity} chỗ
                      </Row>
                      <Row label="Màu và năm sản xuất">
                        {vehicle.color}
                        {vehicle.year ? ` · ${vehicle.year}` : ""}
                      </Row>
                    </>
                  }
                  busy={busyId === doc?.id}
                  approveBlockedReason={vehicleApprovalBlocker(driverDocs, vehicle.vehicleType)}
                  onApprove={target ? () => approve(target) : undefined}
                  onReject={target ? () => setRejecting(target) : undefined}
                />
              );
            })}
          </div>
        )}
      </section>

      <section aria-label="Vi phạm của tài xế" className="mt-8">
        <ViolationsSection userId={user.id} driverName={user.fullName} profile={profile} />
      </section>

      <ReasonDialog
        open={rejecting !== null}
        onClose={() => {
          setRejecting(null);
          setRejectError(null);
        }}
        title="Từ chối giấy tờ này?"
        description={
          rejecting ? `Bạn đang từ chối ${rejecting.label}. Tài xế sẽ thấy lý do bạn nhập.` : undefined
        }
        reasonLabel="Lý do từ chối"
        confirmLabel="Xác nhận từ chối"
        danger
        busy={busyId !== null}
        error={rejectError}
        onConfirm={confirmReject}
      />
    </>
  );
}
