import type {
  AuditAction,
  BookingStatus,
  DriverVerificationType,
  LuggageCapacity,
  PaymentMethod,
  PaymentStatus,
  PenaltyAction,
  ReportStatus,
  ReportType,
  SettlementStatus,
  StopType,
  TripStatus,
  UserRole,
  UserStatus,
  VehicleType,
  VerificationStatus,
  ViolationType,
} from "./types";

/** Nhóm màu trạng thái dùng thống nhất trên toàn trang quản trị. */
export type Tone = "pending" | "good" | "bad" | "active" | "neutral";

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const VERIFICATION_STATUS: Record<VerificationStatus, StatusMeta> = {
  NOT_SUBMITTED: { label: "Chưa nộp", tone: "neutral" },
  PENDING: { label: "Chờ duyệt", tone: "pending" },
  APPROVED: { label: "Đã duyệt", tone: "good" },
  REJECTED: { label: "Từ chối", tone: "bad" },
};

export const USER_STATUS: Record<UserStatus, StatusMeta> = {
  ACTIVE: { label: "Hoạt động", tone: "good" },
  SUSPENDED: { label: "Bị khoá", tone: "bad" },
  DEACTIVATED: { label: "Đã vô hiệu", tone: "neutral" },
};

export const TRIP_STATUS: Record<TripStatus, StatusMeta> = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  PUBLISHED: { label: "Đang mở", tone: "active" },
  IN_PROGRESS: { label: "Đang chạy", tone: "active" },
  COMPLETED: { label: "Hoàn thành", tone: "good" },
  CANCELLED: { label: "Đã huỷ", tone: "bad" },
  EXPIRED: { label: "Hết hạn", tone: "neutral" },
};

export const BOOKING_STATUS: Record<BookingStatus, StatusMeta> = {
  PENDING: { label: "Chờ tài xế duyệt", tone: "pending" },
  CONFIRMED: { label: "Đã xác nhận", tone: "active" },
  REJECTED: { label: "Bị từ chối", tone: "bad" },
  CANCELLED: { label: "Đã huỷ", tone: "bad" },
  COMPLETED: { label: "Đã đi", tone: "good" },
  EXPIRED: { label: "Hết hạn", tone: "neutral" },
};

export const USER_ROLE: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  USER: "Người dùng",
};

export const DRIVER_DOCUMENT_TYPE: Record<DriverVerificationType, string> = {
  IDENTITY_CARD: "Căn cước công dân",
  DRIVER_LICENSE: "Giấy phép lái xe",
};

export const VEHICLE_TYPE: Record<VehicleType, string> = {
  CAR_4_SEATS: "Ô tô 4 chỗ",
  CAR_7_SEATS: "Ô tô 7 chỗ",
  MOTORBIKE: "Xe máy",
};

export const STOP_TYPE: Record<StopType, string> = {
  ORIGIN: "Điểm đi",
  INTERMEDIATE_STOP: "Điểm dừng",
  DESTINATION: "Điểm đến",
};

export const LUGGAGE: Record<LuggageCapacity, string> = {
  NO_LUGGAGE: "Không nhận hành lý",
  SMALL: "Hành lý nhỏ",
  MEDIUM: "Hành lý vừa",
  LARGE: "Hành lý lớn",
};

export const VIOLATION_TYPE: Record<ViolationType, string> = {
  NO_SHOW_WITH_PASSENGERS: "Bỏ chuyến khi đã có khách",
  EXPIRED_WITHOUT_PASSENGERS: "Chuyến hết hạn, không có khách",
  LATE_CANCELLATION: "Huỷ chuyến sát giờ",
  PASSENGER_REPORT: "Hành khách báo cáo",
};

export const PENALTY_ACTION: Record<PenaltyAction, string> = {
  NONE: "Không phạt",
  WARNING_SENT: "Cảnh cáo",
  SUSPENDED_24H: "Tạm khoá 24 giờ",
  SUSPENDED_72H: "Tạm khoá 72 giờ",
  REVOKED_DRIVER_LICENSE: "Thu hồi quyền tài xế",
};

export const GENDER: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export const AUDIT_ACTION: Record<AuditAction, StatusMeta> = {
  DRIVER_DOCUMENT_APPROVED: { label: "Duyệt giấy tờ tài xế", tone: "good" },
  DRIVER_DOCUMENT_REJECTED: { label: "Từ chối giấy tờ tài xế", tone: "bad" },
  VEHICLE_DOCUMENT_APPROVED: { label: "Duyệt giấy tờ xe", tone: "good" },
  VEHICLE_DOCUMENT_REJECTED: { label: "Từ chối giấy tờ xe", tone: "bad" },
  USER_SUSPENDED: { label: "Khoá tài khoản", tone: "bad" },
  USER_UNSUSPENDED: { label: "Mở khoá tài khoản", tone: "good" },
  TRIP_CANCELLED: { label: "Huỷ chuyến", tone: "bad" },
  VIOLATION_FORGIVEN: { label: "Tha vi phạm", tone: "neutral" },
  SETTING_UPDATED: { label: "Sửa cấu hình", tone: "active" },
  DATA_EXPORTED: { label: "Xuất dữ liệu", tone: "active" },
  PASSWORD_CHANGED: { label: "Đổi mật khẩu", tone: "neutral" },
  REPORT_UPDATED: { label: "Xử lý báo cáo", tone: "active" },
  SOS_RESOLVED: { label: "Xử lý SOS", tone: "good" },
  ADMIN_CREATED: { label: "Thêm quản trị viên", tone: "active" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  PENDING: { label: "Chờ thanh toán", tone: "pending" },
  PAID: { label: "Đã thanh toán", tone: "good" },
  PARTIALLY_REFUNDED: { label: "Hoàn một phần", tone: "neutral" },
  REFUNDED: { label: "Đã hoàn", tone: "neutral" },
  FAILED: { label: "Thất bại", tone: "bad" },
  CANCELLED: { label: "Đã huỷ", tone: "neutral" },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  MOMO: "MoMo",
  VNPAY: "VNPay",
  VIETQR: "VietQR",
  CASH: "Tiền mặt",
};

export const SETTLEMENT_STATUS: Record<SettlementStatus, StatusMeta> = {
  PENDING: { label: "Chờ chuyển", tone: "pending" },
  PROCESSING: { label: "Đang chuyển", tone: "active" },
  SETTLED: { label: "Đã chuyển", tone: "good" },
  FAILED: { label: "Chuyển lỗi", tone: "bad" },
  CANCELLED: { label: "Đã huỷ", tone: "neutral" },
};

export const REPORT_TYPE: Record<ReportType, string> = {
  UNSAFE_DRIVING: "Lái xe không an toàn",
  HARASSMENT: "Quấy rối",
  RUDE_BEHAVIOR: "Thái độ không phù hợp",
  LATE_ARRIVAL: "Đến trễ",
  NO_SHOW: "Không đến điểm đón",
  LATE_CANCELLATION: "Huỷ sát giờ",
  FARE_DISPUTE: "Tranh chấp tiền",
  WRONG_VEHICLE: "Xe không đúng mô tả",
  OTHER: "Khác",
};

export const REPORT_STATUS: Record<ReportStatus, StatusMeta> = {
  OPEN: { label: "Mới", tone: "pending" },
  UNDER_REVIEW: { label: "Đang xem xét", tone: "active" },
  RESOLVED: { label: "Đã giải quyết", tone: "good" },
  REJECTED: { label: "Bác bỏ", tone: "neutral" },
};
