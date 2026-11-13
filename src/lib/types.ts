// Kiểu dữ liệu phản chiếu schema GraphQL của backend (Backend/src/schema.gql)
// cùng các kiểu admin đề xuất trong src/server/mock/schema.ts.

export type UserRole = "ADMIN" | "USER";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type VerificationStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";
export type DriverVerificationType = "IDENTITY_CARD" | "DRIVER_LICENSE";
export type VehicleVerificationType = "VEHICLE_REGISTRATION";
export type VehicleType = "CAR_4_SEATS" | "CAR_7_SEATS" | "MOTORBIKE";
export type TripStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";
export type StopType = "ORIGIN" | "INTERMEDIATE_STOP" | "DESTINATION";
export type LuggageCapacity = "NO_LUGGAGE" | "SMALL" | "MEDIUM" | "LARGE";
export type ViolationType =
  | "NO_SHOW_WITH_PASSENGERS"
  | "EXPIRED_WITHOUT_PASSENGERS"
  | "LATE_CANCELLATION"
  | "PASSENGER_REPORT";
export type PenaltyAction =
  | "NONE"
  | "WARNING_SENT"
  | "SUSPENDED_24H"
  | "SUSPENDED_72H"
  | "REVOKED_DRIVER_LICENSE";

export interface User {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  isDriverApproved: boolean;
  ratingAsDriver: number;
  ratingAsPassenger: number;
  totalRidesAsDriver: number;
  totalRidesAsPassenger: number;
  createdAt: string;
  updatedAt: string;
  driverProfile: DriverProfile | null;
}

export interface DriverProfile {
  id: string;
  bio: string | null;
  experienceYears: number;
  noShowStrikeCount: number;
  rejectionReason: string | null;
  suspendedUntil: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  vehicles: Vehicle[] | null;
  verifications: DriverVerification[] | null;
}

export interface DriverVerification {
  id: string;
  type: DriverVerificationType;
  licenseClass: string | null;
  documentNumber: string;
  frontPhotoUrl: string;
  backPhotoUrl: string | null;
  status: VerificationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: User | null;
  createdAt: string;
  updatedAt: string;
  driverProfile: DriverProfile;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  color: string;
  year: number | null;
  plateNumber: string;
  vehicleType: VehicleType;
  seatCapacity: number;
  photoUrl: string | null;
  comfortFeatures: string[] | null;
  isActive: boolean;
  verificationStatus: VerificationStatus;
  rejectReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  driverProfile: DriverProfile;
  verifications: VehicleVerification[] | null;
}

export interface VehicleVerification {
  id: string;
  documentType: VehicleVerificationType;
  documentNumber: string;
  frontPhotoUrl: string;
  backPhotoUrl: string | null;
  status: VerificationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: User | null;
  createdAt: string;
  updatedAt: string;
  vehicle: Vehicle;
}

export interface TripStop {
  id: string;
  stopName: string;
  stopAddress: string;
  stopType: StopType;
  sequenceOrder: number;
  latitude: number;
  longitude: number;
  plannedArrivalTime: string;
  plannedDepartureTime: string;
}

export interface TripPricing {
  id: string;
  baseCostPerKm: number;
  totalEstimatedFare: number;
}

export interface Trip {
  id: string;
  /** Mã ngắn để đọc và tra cứu, ví dụ RS-4821 (trường đề xuất). */
  tripCode: string;
  status: TripStatus;
  driverId: string;
  driver: User | null;
  vehicleId: string;
  vehicle: Vehicle | null;
  departureTime: string;
  estimatedArrivalTime: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalSeatsOffered: number;
  availableSeats: number;
  /** Số ghế đã có khách giữ hoặc đã đi (trường đề xuất). */
  bookedSeats: number;
  /** Tỷ lệ trùng tuyến trung bình của các khách trên chuyến, 0-100 (trường đề xuất). */
  averageMatchPercent: number | null;
  /** Tổng chi phí các khách chia sẻ cho chuyến (trường đề xuất). */
  sharedCostTotal: number | null;
  isInstantBooking: boolean;
  luggageAllowed: LuggageCapacity;
  driverNotes: string | null;
  routePolyline: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  pricing: TripPricing | null;
  stops: TripStop[];
  actualStartedAt?: string | null;
  actualCompletedAt?: string | null;
  originalDepartureTime?: string | null;
  bookings?: TripBookingMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface TripBookingMilestone {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone?: string | null;
  seatsBooked: number;
  pickupLabel: string;
  plannedPickupTime: string;
  arrivedAt?: string | null;
  boardedAt?: string | null;
  dropoffLabel: string;
  plannedDropoffTime: string;
  alightedAt?: string | null;
  status: string;
  totalAmount?: string | null;
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED";

export type PaymentMethod = "MOMO" | "VNPAY" | "VIETQR" | "CASH";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "FAILED"
  | "CANCELLED";
export type SettlementStatus = "PENDING" | "PROCESSING" | "SETTLED" | "FAILED" | "CANCELLED";
export type ReportStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

/**
 * Một đặt chỗ nhìn từ phía quản trị. Tên trường bám theo bảng bookings trong
 * DBML (kiểu đề xuất, backend chưa có module đặt chỗ).
 */
export interface Booking {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  seatsBooked: number;
  /** ESTIMATED cho tới khi chuyến kết thúc và giá được chốt. */
  fareStatus: "ESTIMATED" | "FINALIZED";
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  platformFee: number;
  totalAmount: number;
  driverEarnings: number;
  cancellationReason: string | null;
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  passenger: User;
  trip: Trip;
  pickupStop: TripStop;
  dropoffStop: TripStop;
  payment: Payment | null;
}

/** Một lần thanh toán sau chuyến (bảng payments, kèm trạng thái đối soát từ settlements). */
export interface Payment {
  id: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference: string | null;
  paidAt: string | null;
  createdAt: string;
  /** null với tiền mặt: khách đưa thẳng cho tài xế, không có khoản cần chuyển. */
  settlementStatus: SettlementStatus | null;
  settledAt: string | null;
  payer: User;
  payee: User;
  booking: Booking;
}

export interface PaymentSummary {
  paidAmount: number;
  platformFee: number;
  pendingAmount: number;
  failedCount: number;
}

/** Báo cáo của người dùng về một người dùng khác (bảng reports). */
export interface Report {
  id: string;
  type: string;
  description: string;
  status: ReportStatus;
  /** Ghi chú xử lý của quản trị viên (trường đề xuất, DBML chưa có). */
  resolutionNote: string | null;
  resolvedBy: User | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter: User;
  reportedUser: User;
  trip: Trip | null;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

/** Một lần người dùng bấm nút khẩn cấp trong chuyến (bảng sos_events). */
export interface SosEvent {
  id: string;
  latitude: number;
  longitude: number;
  triggeredAt: string;
  resolvedAt: string | null;
  resolvedBy: User | null;
  notes: string | null;
  user: User;
  trip: Trip | null;
  emergencyContacts: EmergencyContact[];
}

export interface DriverViolation {
  id: string;
  driverId: string;
  tripId: string;
  violationType: ViolationType;
  penaltyAction: PenaltyAction;
  affectedPassengersCount: number;
  penaltyUntil: string | null;
  isForgiven: boolean;
  forgivenBy: string | null;
  forgivenReason: string | null;
  createdAt: string;
  driver: User;
  trip: Trip | null;
}

/** Cấu hình hệ thống có kiểu (type AppSettings của backend). */
export interface AppSettings {
  platformFeePercent: number;
  minCostPerKm: number;
  maxCostPerKm: number;
  repeatPassengerDiscountMaxPercent: number;
  defaultSearchRadiusMeters: number;
  maxSearchRadiusMeters: number;
  minDepartureLeadMinutes: number;
  tripEditCutoffMinutes: number;
  tripScheduleChangeToleranceMinutes: number;
  maxWaypointDistanceMeters: number;
  maxStopWaitMinutes: number;
  recurringPassengerPriorityMinutes: number;
  recurringDriverCheckLocalTime: string;
  recurringDriverReminderLeadMinutes: number;
  activeUploadSeconds: number;
  activeStationarySeconds: number;
  activeViewerPollSeconds: number;
  activeGpsMaxAgeSeconds: number;
  activeGpsFutureSkewSeconds: number;
  activeGpsAccuracyMeters: number;
  activeProximityMeters: number;
  activeOffRouteMeters: number;
  activePassedPickupMeters: number;
}

/** Các trường số admin chỉnh được qua updateSystemSettings (maxSearchRadiusMeters chỉ đọc). */
export type NumericSettingKey = Exclude<
  keyof AppSettings,
  "recurringDriverCheckLocalTime" | "maxSearchRadiusMeters"
>;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type AuditAction =
  | "DRIVER_DOCUMENT_APPROVED"
  | "DRIVER_DOCUMENT_REJECTED"
  | "VEHICLE_DOCUMENT_APPROVED"
  | "VEHICLE_DOCUMENT_REJECTED"
  | "USER_SUSPENDED"
  | "USER_UNSUSPENDED"
  | "TRIP_CANCELLED"
  | "VIOLATION_FORGIVEN"
  | "SETTING_UPDATED"
  | "DATA_EXPORTED"
  | "PASSWORD_CHANGED"
  | "REPORT_UPDATED"
  | "SOS_RESOLVED"
  | "ADMIN_CREATED";

export type AuditTargetType =
  | "USER"
  | "DRIVER_PROFILE"
  | "TRIP"
  | "VIOLATION"
  | "SETTING"
  | "EXPORT"
  | "ACCOUNT"
  | "REPORT"
  | "SOS";

/** Một dòng nhật ký thao tác của quản trị viên (kiểu đề xuất). */
export interface AuditLog {
  id: string;
  action: AuditAction;
  actor: User;
  targetType: AuditTargetType;
  /** id của đối tượng bị tác động, dùng để dẫn link; null khi không có trang tương ứng. */
  targetId: string | null;
  targetLabel: string;
  /** Lý do, giá trị cũ và mới, hoặc phạm vi xuất dữ liệu. */
  detail: string | null;
  createdAt: string;
}

export type OverviewKpiKey =
  | "TOTAL_USERS"
  | "ACTIVE_DRIVERS"
  | "ACTIVE_PASSENGERS"
  | "TRIPS_TODAY"
  | "CONFIRMED_BOOKINGS"
  | "COMPLETED_TRIPS"
  | "CANCELLED_TRIPS"
  | "AVERAGE_MATCH_RATE";

export interface OverviewKpi {
  key: OverviewKpiKey;
  value: number;
  /** Thay đổi so với kỳ liền trước; null khi kỳ trước không có dữ liệu. */
  delta: number | null;
  deltaUnit: "PERCENT" | "POINTS";
  /** Giá trị theo từng khoảng thời gian trong kỳ, cũ trước mới sau. */
  series: number[];
  /** Số liệu phụ hiển thị dưới biểu đồ nhỏ; ý nghĩa tuỳ theo key. */
  secondaryValue: number | null;
}

export interface OperationsOverview {
  generatedAt: string;
  rangeDays: number;
  kpis: OverviewKpi[];
  dailyTrips: { date: string; posted: number; completed: number }[];
  funnel: {
    searches: number;
    matchedSearches: number;
    bookingRequests: number;
    approvedBookings: number;
  };
  matching: {
    averageOverlapPercent: number;
    overlapDeltaPoints: number | null;
    averageDetourKm: number;
    detourDeltaKm: number | null;
  };
  safety: {
    pendingVerifications: number;
    overdueVerifications: number;
    openViolations: number;
    passengerReportViolations: number;
    usersToReview: number;
    openReports: number;
    overdueReports: number;
    unresolvedSos: number;
  };
}
