/**
 * Quy tắc hồ sơ tài xế mà trang quản trị cần biết trước khi gọi API, để báo
 * cho quản trị viên ngay trên giao diện thay vì chờ backend từ chối.
 * Backend vẫn là nơi kiểm tra cuối cùng.
 */
import type {
  DriverProfile,
  DriverVerification,
  DriverVerificationType,
  DriverViolation,
  VehicleType,
} from "./types";
import { formatDateTime } from "./utils";

/** Số lần bỏ chuyến thì bị thu hồi quyền tài xế. */
export const STRIKES_TO_REVOKE = 3;

/** Hạng GPLX lái được từng loại xe; khớp DriversService.checkLicenseCompatibility. */
const LICENSE_CLASSES: Record<VehicleType, readonly string[]> = {
  MOTORBIKE: ["A1", "A2", "A"],
  CAR_4_SEATS: ["B1", "B2", "B", "C", "D", "E"],
  CAR_7_SEATS: ["B1", "B2", "B", "C", "D", "E"],
};

type LicenseDoc = Pick<DriverVerification, "type" | "status" | "licenseClass">;
type SubmittedDoc = Pick<DriverVerification, "type" | "status" | "createdAt">;

/**
 * Lý do chưa thể duyệt xe: tài xế chưa có GPLX đúng hạng được duyệt.
 * Trả về null khi duyệt được. Câu chữ giống thông báo lỗi của backend.
 */
export function vehicleApprovalBlocker(
  driverDocs: LicenseDoc[] | null | undefined,
  vehicleType: VehicleType,
): string | null {
  const allowed = LICENSE_CLASSES[vehicleType];
  const hasLicense = (driverDocs ?? []).some(
    (doc) =>
      doc.type === "DRIVER_LICENSE" &&
      doc.status === "APPROVED" &&
      doc.licenseClass !== null &&
      allowed.includes(doc.licenseClass),
  );
  if (hasLicense) return null;
  return vehicleType === "MOTORBIKE"
    ? "Tài xế chưa có Giấy phép lái xe máy (A1/A2/A) được duyệt để phê duyệt phương tiện này."
    : "Tài xế chưa có Giấy phép lái xe ô tô (B1/B2/B/C/D/E) được duyệt để phê duyệt phương tiện này.";
}

/** Tài xế đang bị tạm khoá quyền đăng chuyến. */
export function isSuspended(
  profile: Pick<DriverProfile, "suspendedUntil">,
  now: number = Date.now(),
): boolean {
  return profile.suspendedUntil !== null && Date.parse(profile.suspendedUntil) > now;
}

/**
 * Loại giấy tờ mà bản nộp gần nhất bị từ chối: tài xế cần nộp lại. Hồ sơ vẫn ở
 * PENDING trong lúc này, nên trạng thái hồ sơ một mình không nói lên điều đó.
 */
export function documentsToResubmit(
  docs: SubmittedDoc[] | null | undefined,
): DriverVerificationType[] {
  const latest = new Map<DriverVerificationType, SubmittedDoc>();
  for (const doc of docs ?? []) {
    const current = latest.get(doc.type);
    if (!current || doc.createdAt > current.createdAt) latest.set(doc.type, doc);
  }
  return [...latest.values()].filter((doc) => doc.status === "REJECTED").map((doc) => doc.type);
}

/** Hồ sơ tài xế sau khi tha vi phạm, đủ để nói hệ quả cho quản trị viên. */
export type ProfileAfterForgive = Pick<
  DriverProfile,
  "noShowStrikeCount" | "suspendedUntil" | "verificationStatus"
>;

/** Câu nói hệ quả của việc tha một vi phạm lên hồ sơ tài xế. */
export function forgiveOutcome(
  violation: Pick<DriverViolation, "violationType" | "penaltyAction">,
  profile: ProfileAfterForgive | null,
): string {
  if (violation.violationType !== "NO_SHOW_WITH_PASSENGERS" || !profile) {
    return "Vi phạm này không tính vào số lần bỏ chuyến nên hồ sơ không thay đổi.";
  }
  const parts = [`Còn ${profile.noShowStrikeCount} lần bỏ chuyến`];
  parts.push(
    isSuspended(profile)
      ? `vẫn tạm khoá đến ${formatDateTime(profile.suspendedUntil)}`
      : "không còn tạm khoá",
  );
  if (violation.penaltyAction === "REVOKED_DRIVER_LICENSE") {
    parts.push(
      profile.verificationStatus === "APPROVED"
        ? "đã khôi phục quyền tài xế"
        : "quyền tài xế chưa được khôi phục vì còn vi phạm thu hồi khác hoặc CCCD, GPLX chưa được duyệt",
    );
  }
  return `${parts.join(", ")}.`;
}
