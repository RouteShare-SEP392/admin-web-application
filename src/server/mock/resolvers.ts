import { GraphQLError } from "graphql";
import type {
  DriverProfile,
  TripStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
  ViolationType,
} from "@/lib/types";
import { getStore } from "./store";

export interface MockContext {
  adminId: string;
}

interface PageInput {
  page?: number | null;
  pageSize?: number | null;
}

interface ReviewInput {
  verificationId: string;
  status: VerificationStatus;
  rejectionReason?: string | null;
}

const VN_OFFSET_MS = 7 * 3_600_000;

function fail(message: string, code = "BAD_REQUEST"): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

function paginate<T>(items: T[], input?: PageInput | null) {
  const pageSize = Math.min(Math.max(input?.pageSize ?? 10, 1), 100);
  const page = Math.max(input?.page ?? 1, 1);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

function requireReason(reason: string | null | undefined, label: string): string {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 5) fail(`${label} cần ít nhất 5 ký tự.`);
  return trimmed;
}

function newestFirst<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Ngày YYYY-MM-DD theo giờ Việt Nam. */
function vnDateKey(ms: number): string {
  return new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
}

function assertReviewable(input: ReviewInput, currentStatus: VerificationStatus) {
  if (input.status !== "APPROVED" && input.status !== "REJECTED") {
    fail("Chỉ có thể phê duyệt hoặc từ chối hồ sơ.");
  }
  if (currentStatus !== "PENDING") fail("Hồ sơ này đã được xử lý.");
  return input.status === "REJECTED"
    ? requireReason(input.rejectionReason, "Lý do từ chối")
    : null;
}

/** Hồ sơ tài xế được duyệt khi cả CCCD và GPLX đều được duyệt. */
function syncDriverProfile(profile: DriverProfile, now: string) {
  const docs = profile.verifications ?? [];
  const rejected = docs.find((d) => d.status === "REJECTED");
  const approvedTypes = new Set(
    docs.filter((d) => d.status === "APPROVED").map((d) => d.type),
  );
  if (rejected) {
    profile.verificationStatus = "REJECTED";
    profile.rejectionReason = rejected.rejectReason;
  } else if (approvedTypes.size === 2) {
    profile.verificationStatus = "APPROVED";
    profile.rejectionReason = null;
    profile.verifiedAt = now;
  } else {
    profile.verificationStatus = "PENDING";
  }
  profile.updatedAt = now;
  profile.user.isDriverApproved = profile.verificationStatus === "APPROVED";
  profile.user.isIdentityVerified = approvedTypes.has("IDENTITY_CARD");
}

export const rootValue = {
  // ----- API backend đã có -----
  me(_: unknown, ctx: MockContext) {
    const store = getStore();
    return (
      store.users.find((u) => u.id === ctx.adminId) ??
      store.users.find((u) => u.role === "ADMIN")
    );
  },

  adminPendingDriverVerifications() {
    return getStore()
      .driverVerifications.filter((d) => d.status === "PENDING")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  adminPendingVehicleVerifications() {
    return getStore()
      .vehicleVerifications.filter((d) => d.status === "PENDING")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  adminReviewDriverVerification({ input }: { input: ReviewInput }, ctx: MockContext) {
    const store = getStore();
    const doc = store.driverVerifications.find((d) => d.id === input.verificationId);
    if (!doc) fail("Không tìm thấy hồ sơ xác thực.", "NOT_FOUND");
    const reason = assertReviewable(input, doc.status);
    const now = new Date().toISOString();
    doc.status = input.status;
    doc.rejectReason = reason;
    doc.reviewedAt = now;
    doc.reviewedBy = store.users.find((u) => u.id === ctx.adminId) ?? null;
    doc.updatedAt = now;
    syncDriverProfile(doc.driverProfile, now);
    return doc;
  },

  adminReviewVehicleVerification({ input }: { input: ReviewInput }, ctx: MockContext) {
    const store = getStore();
    const doc = store.vehicleVerifications.find((d) => d.id === input.verificationId);
    if (!doc) fail("Không tìm thấy hồ sơ phương tiện.", "NOT_FOUND");
    const reason = assertReviewable(input, doc.status);
    const now = new Date().toISOString();
    doc.status = input.status;
    doc.rejectReason = reason;
    doc.reviewedAt = now;
    doc.reviewedBy = store.users.find((u) => u.id === ctx.adminId) ?? null;
    doc.updatedAt = now;
    doc.vehicle.verificationStatus = input.status;
    doc.vehicle.rejectReason = reason;
    doc.vehicle.isActive = input.status === "APPROVED";
    doc.vehicle.verifiedAt = input.status === "APPROVED" ? now : null;
    doc.vehicle.updatedAt = now;
    return doc;
  },

  // ----- API admin đề xuất -----
  adminDashboardStats() {
    const store = getStore();
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    const members = store.users.filter((u) => u.role === "USER");

    const statuses: TripStatus[] = [
      "PUBLISHED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "EXPIRED",
      "DRAFT",
    ];
    const tripsByStatus = statuses.map((status) => ({
      status,
      count: store.trips.filter((t) => t.status === status).length,
    }));

    const signupsByDay = Array.from({ length: 7 }, (_, i) => {
      const date = vnDateKey(now - (6 - i) * 86_400_000);
      return {
        date,
        count: members.filter((u) => vnDateKey(Date.parse(u.createdAt)) === date)
          .length,
      };
    });

    return {
      totalUsers: members.length,
      newUsersLast7Days: members.filter((u) => Date.parse(u.createdAt) >= weekAgo)
        .length,
      approvedDrivers: members.filter((u) => u.isDriverApproved).length,
      pendingDriverVerifications: store.driverVerifications.filter(
        (d) => d.status === "PENDING",
      ).length,
      pendingVehicleVerifications: store.vehicleVerifications.filter(
        (d) => d.status === "PENDING",
      ).length,
      activeTrips: store.trips.filter(
        (t) => t.status === "PUBLISHED" || t.status === "IN_PROGRESS",
      ).length,
      openViolations: store.violations.filter((v) => !v.isForgiven).length,
      tripsByStatus,
      signupsByDay,
    };
  },

  adminUsers({
    input,
  }: {
    input?: (PageInput & {
      search?: string | null;
      role?: UserRole | null;
      status?: UserStatus | null;
    }) | null;
  }) {
    const search = normalize(input?.search);
    const items = newestFirst(getStore().users).filter((u) => {
      if (input?.role && u.role !== input.role) return false;
      if (input?.status && u.status !== input.status) return false;
      if (!search) return true;
      return [u.fullName, u.email, u.phone].some((v) => normalize(v).includes(search));
    });
    return paginate(items, input);
  },

  adminUser({ id }: { id: string }) {
    const user = getStore().users.find((u) => u.id === id);
    if (!user) fail("Không tìm thấy người dùng.", "NOT_FOUND");
    return user;
  },

  adminSuspendUser({ input }: { input: { userId: string; reason: string } }) {
    const user = getStore().users.find((u) => u.id === input.userId);
    if (!user) fail("Không tìm thấy người dùng.", "NOT_FOUND");
    requireReason(input.reason, "Lý do khoá");
    if (user.role === "ADMIN") fail("Không thể khoá tài khoản quản trị.");
    if (user.status !== "ACTIVE") fail("Chỉ có thể khoá tài khoản đang hoạt động.");
    user.status = "SUSPENDED";
    user.updatedAt = new Date().toISOString();
    return user;
  },

  adminUnsuspendUser({ userId }: { userId: string }) {
    const user = getStore().users.find((u) => u.id === userId);
    if (!user) fail("Không tìm thấy người dùng.", "NOT_FOUND");
    if (user.status !== "SUSPENDED") fail("Tài khoản này không bị khoá.");
    user.status = "ACTIVE";
    user.updatedAt = new Date().toISOString();
    return user;
  },

  adminTrips({
    input,
  }: {
    input?: (PageInput & { search?: string | null; status?: TripStatus | null }) | null;
  }) {
    const search = normalize(input?.search);
    const items = getStore()
      .trips.filter((t) => {
        if (input?.status && t.status !== input.status) return false;
        if (!search) return true;
        return [t.driver?.fullName, ...t.stops.map((s) => s.stopName)].some((v) =>
          normalize(v).includes(search),
        );
      })
      .sort((a, b) => b.departureTime.localeCompare(a.departureTime));
    return paginate(items, input);
  },

  adminTrip({ id }: { id: string }) {
    const trip = getStore().trips.find((t) => t.id === id);
    if (!trip) fail("Không tìm thấy chuyến đi.", "NOT_FOUND");
    return trip;
  },

  adminCancelTrip(
    { input }: { input: { tripId: string; reason: string } },
    ctx: MockContext,
  ) {
    const trip = getStore().trips.find((t) => t.id === input.tripId);
    if (!trip) fail("Không tìm thấy chuyến đi.", "NOT_FOUND");
    const reason = requireReason(input.reason, "Lý do huỷ");
    if (trip.status !== "PUBLISHED") fail("Chỉ có thể huỷ chuyến đang mở đặt chỗ.");
    trip.status = "CANCELLED";
    trip.cancellationReason = reason;
    trip.cancelledBy = ctx.adminId;
    trip.availableSeats = 0;
    trip.updatedAt = new Date().toISOString();
    return trip;
  },

  adminDriverViolations({
    input,
  }: {
    input?: (PageInput & {
      violationType?: ViolationType | null;
      isForgiven?: boolean | null;
    }) | null;
  }) {
    const items = newestFirst(getStore().violations).filter((v) => {
      if (input?.violationType && v.violationType !== input.violationType) return false;
      if (typeof input?.isForgiven === "boolean" && v.isForgiven !== input.isForgiven)
        return false;
      return true;
    });
    return paginate(items, input);
  },

  adminForgiveViolation(
    { input }: { input: { violationId: string; reason: string } },
    ctx: MockContext,
  ) {
    const violation = getStore().violations.find((v) => v.id === input.violationId);
    if (!violation) fail("Không tìm thấy vi phạm.", "NOT_FOUND");
    const reason = requireReason(input.reason, "Lý do tha");
    if (violation.isForgiven) fail("Vi phạm này đã được tha.");
    violation.isForgiven = true;
    violation.forgivenBy = ctx.adminId;
    violation.forgivenReason = reason;
    const profile = violation.driver.driverProfile;
    if (profile && violation.violationType === "NO_SHOW_WITH_PASSENGERS") {
      profile.noShowStrikeCount = Math.max(profile.noShowStrikeCount - 1, 0);
    }
    return violation;
  },

  adminSystemSettings() {
    return getStore().settings;
  },

  adminUpdateSystemSetting({
    input,
  }: {
    input: { settingKey: string; settingValue: string };
  }) {
    const store = getStore();
    const setting = store.settings.find((s) => s.settingKey === input.settingKey);
    if (!setting) fail("Không tìm thấy cấu hình.", "NOT_FOUND");
    const value = Number(input.settingValue);
    if (input.settingValue.trim() === "" || !Number.isFinite(value) || value < 0) {
      fail("Giá trị phải là số không âm.");
    }
    const current = (key: string) =>
      Number(store.settings.find((s) => s.settingKey === key)?.settingValue);
    if (input.settingKey === "PLATFORM_FEE_PERCENT" && value > 100) {
      fail("Phí nền tảng không được vượt quá 100%.");
    }
    if (input.settingKey === "MIN_COST_PER_KM" && value > current("MAX_COST_PER_KM")) {
      fail("Giá sàn không được lớn hơn giá trần.");
    }
    if (input.settingKey === "MAX_COST_PER_KM" && value < current("MIN_COST_PER_KM")) {
      fail("Giá trần không được nhỏ hơn giá sàn.");
    }
    setting.settingValue = String(value);
    setting.updatedAt = new Date().toISOString();
    return setting;
  },
};
