import type {
  DriverVerificationType,
  LuggageCapacity,
  PenaltyAction,
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
