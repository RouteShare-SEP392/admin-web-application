import type {
  Booking,
  BookingStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Report,
  ReportStatus,
  SosEvent,
  User,
} from "@/lib/types";
import { recordAudit } from "./audit";
import {
  fail,
  normalize,
  paginate,
  requireReason,
  type MockContext,
  type PageInput,
} from "./resolvers";
import {
  getStore,
  type MockBooking,
  type MockPayment,
  type MockReport,
  type MockSosEvent,
} from "./store";

/**
 * Resolver cho các module vận hành backend chưa có: đặt chỗ, thanh toán,
 * báo cáo, SOS và quản lý quản trị viên.
 */

// Phí nền tảng được chốt theo từng đặt chỗ; dữ liệu mẫu dùng chung một mức.
const PLATFORM_FEE_PERCENT = 10;
const WISHLIST_DISCOUNT_PERCENT = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function userById(id: string): User {
  const user = getStore().users.find((u) => u.id === id);
  if (!user) fail("Không tìm thấy người dùng.", "NOT_FOUND");
  return user;
}

function toPayment(payment: MockPayment, booking: Booking): Payment {
  return {
    id: payment.id,
    amount: booking.totalAmount,
    platformFee: booking.platformFee,
    netAmount: booking.driverEarnings,
    method: payment.method,
    status: payment.status,
    transactionReference: payment.transactionReference,
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
    createdAt: new Date(payment.createdAt).toISOString(),
    settlementStatus: payment.settlementStatus,
    settledAt: payment.settledAt ? new Date(payment.settledAt).toISOString() : null,
    payer: booking.passenger,
    payee: booking.trip.driver!,
    booking,
  };
}

/** Dựng đặt chỗ đầy đủ từ bản rút gọn, gồm phần tính tiền theo công thức trong tài liệu kiến trúc. */
function toBooking(booking: MockBooking): Booking {
  const store = getStore();
  const trip = store.trips.find((t) => t.id === booking.tripId)!;
  const stops = [...trip.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  // Dữ liệu mẫu không lưu chặng của khách: khách trùng tuyến thấp xuống sớm một điểm dừng.
  const leavesEarly = stops.length > 2 && booking.overlapPercent < 80;

  const baseAmount = booking.amount;
  // Khoảng một phần chín số đặt chỗ được tài xế giảm giá theo danh sách khách quen.
  const discountPercent =
    baseAmount > 0 && Number(booking.id.slice(-4)) % 9 === 0 ? WISHLIST_DISCOUNT_PERCENT : 0;
  const discountAmount = Math.round((baseAmount * discountPercent) / 100);
  const totalAmount = baseAmount - discountAmount;
  // Phí tính trên giá gốc và trừ vào phần của tài xế; giảm giá do tài xế chịu.
  const platformFee = Math.round((baseAmount * PLATFORM_FEE_PERCENT) / 100);
  const responded = booking.respondedAt ? new Date(booking.respondedAt).toISOString() : null;
  const wasConfirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";

  const result: Booking = {
    id: booking.id,
    bookingCode: booking.code,
    status: booking.status,
    seatsBooked: booking.seats,
    fareStatus: booking.status === "COMPLETED" ? "FINALIZED" : "ESTIMATED",
    baseAmount,
    discountPercent,
    discountAmount,
    platformFee,
    totalAmount,
    driverEarnings: totalAmount - platformFee,
    cancellationReason:
      booking.status === "CANCELLED"
        ? trip.status === "CANCELLED"
          ? "Chuyến đi bị huỷ."
          : "Hành khách đổi kế hoạch."
        : null,
    requestedAt: new Date(booking.createdAt).toISOString(),
    confirmedAt: wasConfirmed ? responded : null,
    cancelledAt: booking.status === "CANCELLED" ? responded : null,
    completedAt: booking.status === "COMPLETED" ? trip.estimatedArrivalTime : null,
    passenger: userById(booking.passengerId),
    trip,
    pickupStop: stops[0],
    dropoffStop: stops[stops.length - (leavesEarly ? 2 : 1)],
    payment: null,
  };
  const payment = store.payments.find((p) => p.bookingId === booking.id);
  if (payment) result.payment = toPayment(payment, result);
  return result;
}

function toReport(report: MockReport): Report {
  const store = getStore();
  return {
    id: report.id,
    type: report.type,
    description: report.description,
    status: report.status,
    resolutionNote: report.resolutionNote,
    resolvedBy: report.resolvedById ? userById(report.resolvedById) : null,
    resolvedAt: report.resolvedAt,
    createdAt: report.createdAt,
    reporter: userById(report.reporterId),
    reportedUser: userById(report.reportedUserId),
    trip: store.trips.find((t) => t.id === report.tripId) ?? null,
  };
}

function toSosEvent(event: MockSosEvent): SosEvent {
  const store = getStore();
  return {
    id: event.id,
    latitude: event.latitude,
    longitude: event.longitude,
    triggeredAt: event.triggeredAt,
    resolvedAt: event.resolvedAt,
    resolvedBy: event.resolvedById ? userById(event.resolvedById) : null,
    notes: event.notes,
    user: userById(event.userId),
    trip: store.trips.find((t) => t.id === event.tripId) ?? null,
    emergencyContacts: store.emergencyContacts.filter((c) => c.userId === event.userId),
  };
}

export const operationsResolvers = {
  // ----- Đặt chỗ -----
  adminBookings({
    input,
  }: {
    input?: (PageInput & {
      search?: string | null;
      status?: BookingStatus | null;
      tripId?: string | null;
      passengerId?: string | null;
    }) | null;
  }) {
    const store = getStore();
    const search = normalize(input?.search);
    const tripCodes = new Map(store.trips.map((t) => [t.id, t.tripCode]));
    const names = new Map(store.users.map((u) => [u.id, u.fullName]));
    const matched = store.bookings
      .filter((booking) => {
        if (input?.status && booking.status !== input.status) return false;
        if (input?.tripId && booking.tripId !== input.tripId) return false;
        if (input?.passengerId && booking.passengerId !== input.passengerId) return false;
        if (!search) return true;
        return [
          booking.code,
          tripCodes.get(booking.tripId),
          names.get(booking.passengerId),
        ].some((value) => normalize(value).includes(search));
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    const page = paginate(matched, input);
    return { ...page, items: page.items.map(toBooking) };
  },

  adminBooking({ id }: { id: string }) {
    const booking = getStore().bookings.find((b) => b.id === id);
    if (!booking) fail("Không tìm thấy đặt chỗ.", "NOT_FOUND");
    return toBooking(booking);
  },

  // ----- Thanh toán -----
  adminPayments({
    input,
  }: {
    input?: (PageInput & {
      search?: string | null;
      status?: PaymentStatus | null;
      method?: PaymentMethod | null;
    }) | null;
  }) {
    const store = getStore();
    const search = normalize(input?.search);
    const bookingsById = new Map(store.bookings.map((b) => [b.id, b]));
    const names = new Map(store.users.map((u) => [u.id, u.fullName]));
    const matched = store.payments
      .filter((payment) => {
        if (input?.status && payment.status !== input.status) return false;
        if (input?.method && payment.method !== input.method) return false;
        if (!search) return true;
        const booking = bookingsById.get(payment.bookingId)!;
        return [
          booking.code,
          payment.transactionReference,
          names.get(booking.passengerId),
        ].some((value) => normalize(value).includes(search));
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    // Tổng hợp tính trên toàn bộ kết quả lọc, không chỉ trang đang xem.
    const all = matched.map((payment) =>
      toPayment(payment, toBooking(bookingsById.get(payment.bookingId)!)),
    );
    const paid = all.filter((p) => p.status === "PAID");
    const summary = {
      paidAmount: paid.reduce((sum, p) => sum + p.amount, 0),
      platformFee: paid.reduce((sum, p) => sum + p.platformFee, 0),
      pendingAmount: all
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0),
      failedCount: all.filter((p) => p.status === "FAILED").length,
    };
    return { ...paginate(all, input), summary };
  },

  // ----- Báo cáo -----
  adminReports({
    input,
  }: {
    input?: (PageInput & { search?: string | null; status?: ReportStatus | null }) | null;
  }) {
    const search = normalize(input?.search);
    const items = getStore()
      .reports.filter((report) => !input?.status || report.status === input.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toReport)
      .filter(
        (report) =>
          !search ||
          [report.type, report.reporter.fullName, report.reportedUser.fullName].some((value) =>
            normalize(value).includes(search),
          ),
      );
    return paginate(items, input);
  },

  adminReport({ id }: { id: string }) {
    const report = getStore().reports.find((r) => r.id === id);
    if (!report) fail("Không tìm thấy báo cáo.", "NOT_FOUND");
    return toReport(report);
  },

  adminUpdateReportStatus(
    {
      input,
    }: { input: { reportId: string; status: ReportStatus; note?: string | null } },
    ctx: MockContext,
  ) {
    const report = getStore().reports.find((r) => r.id === input.reportId);
    if (!report) fail("Không tìm thấy báo cáo.", "NOT_FOUND");
    if (report.status === "RESOLVED" || report.status === "REJECTED") {
      fail("Báo cáo này đã được đóng.");
    }
    if (input.status === "OPEN" || input.status === report.status) {
      fail("Trạng thái mới không hợp lệ.");
    }
    const closing = input.status === "RESOLVED" || input.status === "REJECTED";
    const note = closing ? requireReason(input.note, "Ghi chú xử lý") : null;
    report.status = input.status;
    if (closing) {
      report.resolutionNote = note;
      report.resolvedById = ctx.adminId;
      report.resolvedAt = new Date().toISOString();
    }
    const outcome = {
      UNDER_REVIEW: "Nhận xử lý",
      RESOLVED: "Đã giải quyết",
      REJECTED: "Bác bỏ",
      OPEN: "",
    }[input.status];
    recordAudit(
      ctx.adminId,
      "REPORT_UPDATED",
      {
        type: "REPORT",
        id: report.id,
        label: `Báo cáo về ${userById(report.reportedUserId).fullName}`,
      },
      note ? `${outcome}: ${note}` : outcome,
    );
    return toReport(report);
  },

  // ----- SOS -----
  adminSosEvents({
    input,
  }: {
    input?: (PageInput & { resolved?: boolean | null }) | null;
  }) {
    const items = getStore()
      .sosEvents.filter(
        (event) =>
          typeof input?.resolved !== "boolean" ||
          (event.resolvedAt !== null) === input.resolved,
      )
      // Sự cố chưa xử lý luôn nằm trên cùng, sau đó mới theo thời gian.
      .sort(
        (a, b) =>
          Number(a.resolvedAt !== null) - Number(b.resolvedAt !== null) ||
          b.triggeredAt.localeCompare(a.triggeredAt),
      )
      .map(toSosEvent);
    return paginate(items, input);
  },

  adminResolveSosEvent(
    { input }: { input: { sosEventId: string; notes: string } },
    ctx: MockContext,
  ) {
    const event = getStore().sosEvents.find((e) => e.id === input.sosEventId);
    if (!event) fail("Không tìm thấy sự cố.", "NOT_FOUND");
    if (event.resolvedAt) fail("Sự cố này đã được xử lý.");
    const notes = requireReason(input.notes, "Ghi chú xử lý");
    event.resolvedAt = new Date().toISOString();
    event.resolvedById = ctx.adminId;
    event.notes = notes;
    recordAudit(
      ctx.adminId,
      "SOS_RESOLVED",
      { type: "SOS", id: event.id, label: `SOS của ${userById(event.userId).fullName}` },
      notes,
    );
    return toSosEvent(event);
  },

  // ----- Quản trị viên -----
  adminCreateAdmin(
    { input }: { input: { fullName: string; email: string; password: string } },
    ctx: MockContext,
  ) {
    const store = getStore();
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    if (fullName.length < 2) fail("Họ tên cần ít nhất 2 ký tự.");
    if (!EMAIL_PATTERN.test(email)) fail("Email không hợp lệ.");
    if (store.users.some((u) => u.email?.toLowerCase() === email)) {
      fail("Email này đã được dùng cho một tài khoản khác.");
    }
    if (input.password.length < 8) fail("Mật khẩu cần ít nhất 8 ký tự.");

    const now = new Date().toISOString();
    const admins = store.users.filter((u) => u.role === "ADMIN").length;
    const user: User = {
      id: `a0000000-0000-4000-8000-${String(admins + 1).padStart(12, "0")}`,
      fullName,
      email,
      phone: null,
      avatarUrl: null,
      bio: null,
      dateOfBirth: null,
      gender: null,
      role: "ADMIN",
      status: "ACTIVE",
      isPhoneVerified: false,
      isIdentityVerified: false,
      isDriverApproved: false,
      ratingAsDriver: 5,
      ratingAsPassenger: 5,
      totalRidesAsDriver: 0,
      totalRidesAsPassenger: 0,
      createdAt: now,
      updatedAt: now,
      driverProfile: null,
    };
    store.users.push(user);
    store.credentials[user.id] = input.password;
    recordAudit(ctx.adminId, "ADMIN_CREATED", { type: "USER", id: user.id, label: fullName });
    return user;
  },
};
