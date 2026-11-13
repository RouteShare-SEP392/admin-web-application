/**
 * Schema GraphQL của lớp mock.
 *
 * EXISTING_SDL: sao chép phần backend đã có (Backend/src/schema.gql) mà admin dùng.
 * PROPOSED_SDL: hợp đồng đề xuất cho các API admin backend CHƯA có. Khi backend
 * triển khai đúng tên và kiểu dưới đây, admin web chuyển sang API thật bằng
 * NEXT_PUBLIC_API_MOCK=off mà không phải sửa trang nào.
 */

export const EXISTING_SDL = /* GraphQL */ `
  scalar DateTime

  enum UserRole { ADMIN USER }
  enum UserStatus { ACTIVE DEACTIVATED SUSPENDED }
  enum Gender { FEMALE MALE OTHER }
  enum VerificationStatus { APPROVED NOT_SUBMITTED PENDING REJECTED }
  enum DriverVerificationType { DRIVER_LICENSE IDENTITY_CARD }
  enum VehicleVerificationType { VEHICLE_REGISTRATION }
  enum LicenseClass { A A1 A2 B B1 B2 C D E }
  enum VehicleType { CAR_4_SEATS CAR_7_SEATS MOTORBIKE }
  enum TripStatus { CANCELLED COMPLETED DRAFT EXPIRED IN_PROGRESS PUBLISHED }
  enum StopType { DESTINATION INTERMEDIATE_STOP ORIGIN }
  enum LuggageCapacity { LARGE MEDIUM NO_LUGGAGE SMALL }

  type User {
    id: ID!
    fullName: String!
    email: String
    phone: String
    avatarUrl: String
    bio: String
    dateOfBirth: String
    gender: Gender
    role: UserRole!
    status: UserStatus!
    isPhoneVerified: Boolean!
    isIdentityVerified: Boolean!
    isDriverApproved: Boolean!
    ratingAsDriver: Float!
    ratingAsPassenger: Float!
    totalRidesAsDriver: Int!
    totalRidesAsPassenger: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    driverProfile: DriverProfile
  }

  type DriverProfile {
    id: ID!
    bio: String
    experienceYears: Int!
    noShowStrikeCount: Int!
    rejectionReason: String
    suspendedUntil: DateTime
    verificationStatus: VerificationStatus!
    verifiedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    vehicles: [Vehicle!]
    verifications: [DriverVerification!]
  }

  type DriverVerification {
    id: ID!
    type: DriverVerificationType!
    licenseClass: LicenseClass
    documentNumber: String!
    frontPhotoUrl: String!
    backPhotoUrl: String
    status: VerificationStatus!
    rejectReason: String
    reviewedAt: DateTime
    reviewedBy: User
    createdAt: DateTime!
    updatedAt: DateTime!
    driverProfile: DriverProfile!
  }

  type Vehicle {
    id: ID!
    make: String!
    model: String!
    color: String!
    year: Int
    plateNumber: String!
    vehicleType: VehicleType!
    seatCapacity: Int!
    photoUrl: String
    comfortFeatures: [String!]
    isActive: Boolean!
    verificationStatus: VerificationStatus!
    rejectReason: String
    verifiedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    driverProfile: DriverProfile!
    verifications: [VehicleVerification!]
  }

  type VehicleVerification {
    id: ID!
    documentType: VehicleVerificationType!
    documentNumber: String!
    frontPhotoUrl: String!
    backPhotoUrl: String
    status: VerificationStatus!
    rejectReason: String
    reviewedAt: DateTime
    reviewedBy: User
    createdAt: DateTime!
    updatedAt: DateTime!
    vehicle: Vehicle!
  }

  type TripStop {
    id: ID!
    stopName: String!
    stopAddress: String!
    stopType: StopType!
    sequenceOrder: Int!
    latitude: Float!
    longitude: Float!
    plannedArrivalTime: DateTime!
    plannedDepartureTime: DateTime!
  }

  type TripPricing {
    id: ID!
    baseCostPerKm: Float!
    totalEstimatedFare: Float!
  }

  type Trip {
    id: ID!
    status: TripStatus!
    driverId: ID!
    driver: User
    vehicleId: ID!
    vehicle: Vehicle
    departureTime: DateTime!
    estimatedArrivalTime: DateTime!
    totalDistanceKm: Float!
    totalDurationMinutes: Int!
    totalSeatsOffered: Int!
    availableSeats: Int!
    isInstantBooking: Boolean!
    luggageAllowed: LuggageCapacity!
    driverNotes: String
    routePolyline: String
    cancellationReason: String
    cancelledBy: ID
    pricing: TripPricing
    stops: [TripStop]!
    actualStartedAt: DateTime
    actualCompletedAt: DateTime
    originalDepartureTime: DateTime
    bookings: [TripBookingMilestone!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TripBookingMilestone {
    id: ID!
    passengerId: ID!
    passengerName: String!
    passengerPhone: String
    seatsBooked: Int!
    pickupLabel: String!
    plannedPickupTime: DateTime!
    arrivedAt: DateTime
    boardedAt: DateTime
    dropoffLabel: String!
    plannedDropoffTime: DateTime!
    alightedAt: DateTime
    status: String!
    totalAmount: String
  }

  input AdminReviewDriverVerificationInput {
    verificationId: ID!
    status: VerificationStatus!
    rejectionReason: String
  }

  input AdminReviewVehicleVerificationInput {
    verificationId: ID!
    status: VerificationStatus!
    rejectionReason: String
  }

  type AppSettings {
    platformFeePercent: Float!
    minCostPerKm: Float!
    maxCostPerKm: Float!
    repeatPassengerDiscountMaxPercent: Int!
    defaultSearchRadiusMeters: Int!
    maxSearchRadiusMeters: Int!
    minDepartureLeadMinutes: Int!
    tripEditCutoffMinutes: Int!
    tripScheduleChangeToleranceMinutes: Int!
    maxWaypointDistanceMeters: Int!
    maxStopWaitMinutes: Int!
    recurringPassengerPriorityMinutes: Int!
    recurringDriverCheckLocalTime: String!
    recurringDriverReminderLeadMinutes: Int!
    activeUploadSeconds: Int!
    activeStationarySeconds: Int!
    activeViewerPollSeconds: Int!
    activeGpsMaxAgeSeconds: Int!
    activeGpsFutureSkewSeconds: Int!
    activeGpsAccuracyMeters: Int!
    activeProximityMeters: Int!
    activeOffRouteMeters: Int!
    activePassedPickupMeters: Int!
  }

  input UpdateSystemSettingsInput {
    platformFeePercent: Float
    minCostPerKm: Float
    maxCostPerKm: Float
    repeatPassengerDiscountMaxPercent: Int
    defaultSearchRadiusMeters: Int
    minDepartureLeadMinutes: Int
    tripEditCutoffMinutes: Int
    tripScheduleChangeToleranceMinutes: Int
    maxWaypointDistanceMeters: Int
    maxStopWaitMinutes: Int
    recurringPassengerPriorityMinutes: Int
    recurringDriverCheckLocalTime: String
    recurringDriverReminderLeadMinutes: Int
    activeUploadSeconds: Int
    activeStationarySeconds: Int
    activeViewerPollSeconds: Int
    activeGpsMaxAgeSeconds: Int
    activeGpsFutureSkewSeconds: Int
    activeGpsAccuracyMeters: Int
    activeProximityMeters: Int
    activeOffRouteMeters: Int
    activePassedPickupMeters: Int
  }

  type Query {
    me: User!
    adminSystemSettings: AppSettings!
    adminPendingDriverVerifications: [DriverVerification!]!
    adminPendingVehicleVerifications: [VehicleVerification!]!
  }

  type Mutation {
    updateSystemSettings(input: UpdateSystemSettingsInput!): AppSettings!
    adminReviewDriverVerification(input: AdminReviewDriverVerificationInput!): DriverVerification!
    adminReviewVehicleVerification(input: AdminReviewVehicleVerificationInput!): VehicleVerification!
  }
`;

export const PROPOSED_SDL = /* GraphQL */ `
  enum ViolationType {
    NO_SHOW_WITH_PASSENGERS
    EXPIRED_WITHOUT_PASSENGERS
    LATE_CANCELLATION
    PASSENGER_REPORT
  }

  enum PenaltyAction {
    NONE
    WARNING_SENT
    SUSPENDED_24H
    SUSPENDED_72H
    REVOKED_DRIVER_LICENSE
  }

  """
  Entity driver_violations đã có ở backend. Hai trường driver và trip hiện chưa
  được expose qua GraphQL, cần bổ sung @Field.
  """
  type DriverViolation {
    id: ID!
    driverId: ID!
    tripId: ID!
    violationType: ViolationType!
    penaltyAction: PenaltyAction!
    affectedPassengersCount: Int!
    penaltyUntil: DateTime
    isForgiven: Boolean!
    forgivenBy: ID
    forgivenReason: String
    createdAt: DateTime!
    driver: User!
    trip: Trip
  }

  # Bốn trường tóm tắt thêm vào type Trip cho bảng "Chuyến gần đây".
  # Ba trường sau cần module đặt chỗ để tính.
  extend type Trip {
    """Mã ngắn, duy nhất, để đọc và tra cứu. Ví dụ RS-4821"""
    tripCode: String!
    """Số ghế đang được giữ (PENDING, CONFIRMED) hoặc đã đi (COMPLETED)"""
    bookedSeats: Int!
    """Tỷ lệ trùng tuyến trung bình của các khách trên chuyến, 0-100"""
    averageMatchPercent: Float
    """Tổng chi phí các khách chia sẻ cho chuyến"""
    sharedCostTotal: Float
  }

  enum AdminOverviewKpiKey {
    TOTAL_USERS
    ACTIVE_DRIVERS
    ACTIVE_PASSENGERS
    TRIPS_TODAY
    CONFIRMED_BOOKINGS
    COMPLETED_TRIPS
    CANCELLED_TRIPS
    AVERAGE_MATCH_RATE
  }

  enum AdminDeltaUnit {
    """Phần trăm thay đổi so với kỳ liền trước"""
    PERCENT
    """Chênh lệch điểm phần trăm so với kỳ liền trước"""
    POINTS
  }

  type AdminOverviewKpi {
    key: AdminOverviewKpiKey!
    value: Float!
    """null khi kỳ liền trước không có dữ liệu để so sánh"""
    delta: Float
    deltaUnit: AdminDeltaUnit!
    """10 giá trị chia đều theo thời gian trong kỳ, cũ trước mới sau"""
    series: [Float!]!
    """
    Số liệu phụ, ý nghĩa theo key:
    TOTAL_USERS số tài khoản mới trong kỳ; ACTIVE_DRIVERS % tài xế đăng từ 2 chuyến;
    ACTIVE_PASSENGERS số chuyến mỗi khách mỗi tuần; TRIPS_TODAY giờ cao điểm (0-23);
    CONFIRMED_BOOKINGS % yêu cầu được phản hồi dưới 15 phút;
    COMPLETED_TRIPS % hoàn thành trên chuyến đã kết thúc; CANCELLED_TRIPS % huỷ trên tổng chuyến.
    """
    secondaryValue: Float
  }

  type AdminDailyTrips {
    """Ngày khởi hành theo múi giờ Asia/Ho_Chi_Minh, định dạng YYYY-MM-DD"""
    date: String!
    """Số chuyến đã đăng có giờ khởi hành trong ngày (không tính DRAFT)"""
    posted: Int!
    completed: Int!
  }

  """Cần ghi log lượt tìm chuyến; hiện backend chưa lưu dữ liệu này."""
  type AdminBookingFunnel {
    searches: Int!
    matchedSearches: Int!
    bookingRequests: Int!
    approvedBookings: Int!
  }

  type AdminMatchingQuality {
    averageOverlapPercent: Float!
    overlapDeltaPoints: Float
    averageDetourKm: Float!
    detourDeltaKm: Float
  }

  type AdminSafetyQueue {
    pendingVerifications: Int!
    """Hồ sơ chờ duyệt quá 24 giờ"""
    overdueVerifications: Int!
    """Vi phạm chưa được tha"""
    openViolations: Int!
    passengerReportViolations: Int!
    """Tài xế có từ 2 vi phạm còn hiệu lực hoặc điểm đánh giá dưới 3,5"""
    usersToReview: Int!
    openReports: Int!
    """Báo cáo OPEN quá 24 giờ chưa ai nhận"""
    overdueReports: Int!
    unresolvedSos: Int!
  }

  type AdminOperationsOverview {
    generatedAt: DateTime!
    rangeDays: Int!
    """Đủ 8 phần tử theo thứ tự của AdminOverviewKpiKey"""
    kpis: [AdminOverviewKpi!]!
    """Đúng rangeDays phần tử, cũ trước mới sau, ngày không có chuyến trả 0"""
    dailyTrips: [AdminDailyTrips!]!
    funnel: AdminBookingFunnel!
    matching: AdminMatchingQuality!
    safety: AdminSafetyQueue!
  }

  input AdminDriverVerificationsInput {
    """Bỏ trống để lấy mọi trạng thái. Trang lịch sử gửi [APPROVED, REJECTED]"""
    statuses: [VerificationStatus!]
    type: DriverVerificationType
    """Tìm theo họ tên, email, số điện thoại của tài xế hoặc số giấy tờ"""
    search: String
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminDriverVerificationPage {
    items: [DriverVerification!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input AdminVehicleVerificationsInput {
    statuses: [VerificationStatus!]
    """Tìm theo biển số, hãng xe, dòng xe hoặc họ tên chủ xe"""
    search: String
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminVehicleVerificationPage {
    items: [VehicleVerification!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input AdminVehiclesInput {
    """Tìm theo biển số, hãng xe, dòng xe hoặc họ tên chủ xe"""
    search: String
    vehicleType: VehicleType
    verificationStatus: VerificationStatus
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminVehiclePage {
    items: [Vehicle!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  """Theo enum booking_status trong DBML. Backend chưa có module đặt chỗ."""
  enum BookingStatus {
    PENDING
    CONFIRMED
    REJECTED
    CANCELLED
    COMPLETED
    EXPIRED
  }

  enum BookingFareStatus { ESTIMATED FINALIZED }
  enum PaymentMethod { MOMO VNPAY VIETQR CASH }
  enum PaymentStatus { PENDING PAID PARTIALLY_REFUNDED REFUNDED FAILED CANCELLED }
  enum SettlementStatus { PENDING PROCESSING SETTLED FAILED CANCELLED }
  enum ReportStatus { OPEN UNDER_REVIEW RESOLVED REJECTED }
  enum ReportType {
    UNSAFE_DRIVING HARASSMENT RUDE_BEHAVIOR LATE_ARRIVAL NO_SHOW
    LATE_CANCELLATION FARE_DISPUTE WRONG_VEHICLE OTHER
  }

  """
  Một đặt chỗ nhìn từ phía quản trị. Tên trường bám theo bảng bookings trong
  DBML; có thể đổi khi backend thiết kế module đặt chỗ.
  """
  type AdminBooking {
    id: ID!
    bookingCode: String!
    status: BookingStatus!
    seatsBooked: Int!
    """ESTIMATED cho tới khi chuyến kết thúc và giá được chốt theo số khách thực tế"""
    fareStatus: BookingFareStatus!
    baseAmount: Float!
    discountPercent: Float!
    discountAmount: Float!
    """Tính trên baseAmount, trừ vào phần của tài xế"""
    platformFee: Float!
    """Số tiền khách trả: baseAmount - discountAmount"""
    totalAmount: Float!
    """totalAmount - platformFee"""
    driverEarnings: Float!
    cancellationReason: String
    requestedAt: DateTime!
    confirmedAt: DateTime
    cancelledAt: DateTime
    completedAt: DateTime
    passenger: User!
    trip: Trip!
    pickupStop: TripStop!
    dropoffStop: TripStop!
    payment: AdminPayment
  }

  input AdminBookingsInput {
    """Tìm theo mã đặt chỗ, mã chuyến hoặc họ tên hành khách"""
    search: String
    status: BookingStatus
    """Chỉ đặt chỗ của chuyến này: danh sách hành khách ở trang chi tiết chuyến"""
    tripId: ID
    """Chỉ đặt chỗ của hành khách này: lịch sử ở trang chi tiết người dùng"""
    passengerId: ID
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminBookingPage {
    items: [AdminBooking!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  """Bảng payments, kèm trạng thái đối soát lấy từ settlements."""
  type AdminPayment {
    id: ID!
    amount: Float!
    platformFee: Float!
    netAmount: Float!
    method: PaymentMethod!
    status: PaymentStatus!
    transactionReference: String
    paidAt: DateTime
    createdAt: DateTime!
    """null với tiền mặt: khách đưa thẳng cho tài xế"""
    settlementStatus: SettlementStatus
    settledAt: DateTime
    payer: User!
    payee: User!
    booking: AdminBooking!
  }

  input AdminPaymentsInput {
    """Tìm theo mã đặt chỗ, mã giao dịch hoặc họ tên người trả"""
    search: String
    status: PaymentStatus
    method: PaymentMethod
    page: Int = 1
    pageSize: Int = 10
  }

  """Tính trên toàn bộ kết quả lọc, không chỉ trang đang xem."""
  type AdminPaymentSummary {
    paidAmount: Float!
    """Phí nền tảng của các giao dịch đã thanh toán"""
    platformFee: Float!
    pendingAmount: Float!
    failedCount: Int!
  }

  type AdminPaymentPage {
    items: [AdminPayment!]!
    total: Int!
    page: Int!
    pageSize: Int!
    summary: AdminPaymentSummary!
  }

  """Bảng reports. resolutionNote chưa có trong DBML, cần thêm cột."""
  type AdminReport {
    id: ID!
    type: ReportType!
    description: String!
    status: ReportStatus!
    resolutionNote: String
    resolvedBy: User
    resolvedAt: DateTime
    createdAt: DateTime!
    reporter: User!
    reportedUser: User!
    trip: Trip
  }

  input AdminReportsInput {
    """Tìm theo họ tên người báo cáo, người bị báo cáo hoặc nội dung"""
    search: String
    status: ReportStatus
    type: ReportType
    """Chỉ báo cáo OPEN gửi quá 24 giờ, cùng mốc với overdueReports của Tổng quan"""
    overdueOnly: Boolean
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminReportPage {
    items: [AdminReport!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input AdminUpdateReportStatusInput {
    reportId: ID!
    """UNDER_REVIEW, RESOLVED hoặc REJECTED"""
    status: ReportStatus!
    """Bắt buộc khi đóng báo cáo (RESOLVED, REJECTED)"""
    note: String
  }

  type AdminEmergencyContact {
    id: ID!
    name: String!
    phone: String!
    relationship: String!
  }

  """Bảng sos_events. resolvedBy chưa có trong DBML, cần thêm cột."""
  type AdminSosEvent {
    id: ID!
    latitude: Float!
    longitude: Float!
    triggeredAt: DateTime!
    resolvedAt: DateTime
    resolvedBy: User
    notes: String
    user: User!
    trip: Trip
    """Liên hệ khẩn cấp đang bật của người bấm SOS"""
    emergencyContacts: [AdminEmergencyContact!]!
  }

  input AdminSosEventsInput {
    """true: chỉ sự cố đã xử lý; false: chỉ sự cố chưa xử lý; bỏ trống: tất cả"""
    resolved: Boolean
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminSosEventPage {
    items: [AdminSosEvent!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input AdminResolveSosEventInput {
    sosEventId: ID!
    notes: String!
  }

  input AdminCreateAdminInput {
    fullName: String!
    email: String!
    """Mật khẩu ban đầu, tối thiểu 8 ký tự"""
    password: String!
  }

  input AdminUsersInput {
    """Tìm theo họ tên, email hoặc số điện thoại"""
    search: String
    role: UserRole
    status: UserStatus
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminUserPage {
    items: [User!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input AdminSuspendUserInput {
    userId: ID!
    reason: String!
  }

  enum AdminTripSort {
    """Giờ khởi hành, mới nhất trước (mặc định)"""
    DEPARTURE_TIME
    """Thời điểm tạo, mới nhất trước"""
    CREATED_AT
  }

  input AdminTripsInput {
    """Tìm theo tên tài xế hoặc tên điểm dừng"""
    search: String
    status: TripStatus
    """Chỉ chuyến có tỷ lệ trùng tuyến trung bình dưới 70%"""
    lowMatchOnly: Boolean
    """Chỉ chuyến có vi phạm còn hiệu lực"""
    hasViolation: Boolean
    """Chỉ chuyến khởi hành hôm nay (múi giờ Asia/Ho_Chi_Minh)"""
    todayOnly: Boolean
    sortBy: AdminTripSort = DEPARTURE_TIME
    """Chỉ chuyến do tài xế này đăng (id của users)"""
    driverId: ID
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminTripPage {
    items: [Trip!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input AdminCancelTripInput {
    tripId: ID!
    reason: String!
  }

  input AdminDriverViolationsInput {
    violationType: ViolationType
    isForgiven: Boolean
    """Chỉ vi phạm của tài xế này (id của users)"""
    driverId: ID
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminDriverViolationPage {
    items: [DriverViolation!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input AdminForgiveViolationInput {
    violationId: ID!
    reason: String!
  }

  enum AdminAuditAction {
    DRIVER_DOCUMENT_APPROVED
    DRIVER_DOCUMENT_REJECTED
    VEHICLE_DOCUMENT_APPROVED
    VEHICLE_DOCUMENT_REJECTED
    USER_SUSPENDED
    USER_UNSUSPENDED
    TRIP_CANCELLED
    VIOLATION_FORGIVEN
    SETTING_UPDATED
    DATA_EXPORTED
    PASSWORD_CHANGED
    REPORT_UPDATED
    SOS_RESOLVED
    ADMIN_CREATED
  }

  enum AdminAuditTargetType {
    USER
    DRIVER_PROFILE
    TRIP
    VIOLATION
    SETTING
    EXPORT
    ACCOUNT
    REPORT
    SOS
  }

  """Một dòng nhật ký: ai đã làm gì, với đối tượng nào, lúc nào. Chỉ thêm, không sửa, không xoá."""
  type AdminAuditLog {
    id: ID!
    action: AdminAuditAction!
    actor: User!
    targetType: AdminAuditTargetType!
    """id của đối tượng để dẫn link; null với EXPORT và ACCOUNT"""
    targetId: ID
    """Tên đối tượng tại thời điểm thao tác, ví dụ "GPLX của Nguyễn Văn An" """
    targetLabel: String!
    """Lý do, giá trị cũ và mới của cấu hình, hoặc phạm vi xuất dữ liệu"""
    detail: String
    createdAt: DateTime!
  }

  input AdminAuditLogsInput {
    action: AdminAuditAction
    """Chỉ thao tác của quản trị viên này (id của users)"""
    actorId: ID
    """Tìm trong tên đối tượng, tên người thực hiện và chi tiết"""
    search: String
    page: Int = 1
    pageSize: Int = 10
  }

  type AdminAuditLogPage {
    items: [AdminAuditLog!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  input ChangePasswordInput {
    currentPassword: String!
    """Tối thiểu 8 ký tự, theo quy tắc mật khẩu hiện có"""
    newPassword: String!
  }

  extend type Query {
    """rangeDays nhận 7, 14 hoặc 30"""
    adminOperationsOverview(rangeDays: Int! = 14): AdminOperationsOverview!
    """Hồ sơ đã xử lý xếp theo thời điểm duyệt, mới nhất trước"""
    adminDriverVerifications(input: AdminDriverVerificationsInput): AdminDriverVerificationPage!
    adminVehicleVerifications(input: AdminVehicleVerificationsInput): AdminVehicleVerificationPage!
    """Toàn bộ giấy tờ và phương tiện của một tài xế, theo id của driver_profiles"""
    adminDriverProfile(id: ID!): DriverProfile!
    adminVehicles(input: AdminVehiclesInput): AdminVehiclePage!
    """Mới đặt trước"""
    adminBookings(input: AdminBookingsInput): AdminBookingPage!
    adminBooking(id: ID!): AdminBooking!
    """Mới tạo trước"""
    adminPayments(input: AdminPaymentsInput): AdminPaymentPage!
    """Mới gửi trước"""
    adminReports(input: AdminReportsInput): AdminReportPage!
    adminReport(id: ID!): AdminReport!
    """Sự cố chưa xử lý luôn xếp trên cùng"""
    adminSosEvents(input: AdminSosEventsInput): AdminSosEventPage!
    adminUsers(input: AdminUsersInput): AdminUserPage!
    adminUser(id: ID!): User!
    adminTrips(input: AdminTripsInput): AdminTripPage!
    adminTrip(id: ID!): Trip!
    adminDriverViolations(input: AdminDriverViolationsInput): AdminDriverViolationPage!
    """Mới nhất trước"""
    adminAuditLogs(input: AdminAuditLogsInput): AdminAuditLogPage!
  }

  extend type Mutation {
    """
    Đặt status = SUSPENDED. Backend cần chặn đăng nhập với tài khoản bị khoá.
    Khoá được quản trị viên khác, nhưng không tự khoá mình và không khoá người cuối cùng.
    """
    adminSuspendUser(input: AdminSuspendUserInput!): User!
    adminUnsuspendUser(userId: ID!): User!
    """Chỉ áp dụng cho chuyến PUBLISHED (theo state machine của chuyến đi)."""
    adminCancelTrip(input: AdminCancelTripInput!): Trip!
    adminForgiveViolation(input: AdminForgiveViolationInput!): DriverViolation!
    """
    Đổi mật khẩu của người đang đăng nhập (mọi vai trò). Backend hiện chỉ có
    luồng đặt lại mật khẩu qua OTP email.
    """
    changePassword(input: ChangePasswordInput!): Boolean!
    adminUpdateReportStatus(input: AdminUpdateReportStatusInput!): AdminReport!
    adminResolveSosEvent(input: AdminResolveSosEventInput!): AdminSosEvent!
    """Tạo tài khoản role = ADMIN. Danh sách quản trị viên dùng adminUsers(role: ADMIN)."""
    adminCreateAdmin(input: AdminCreateAdminInput!): User!
  }
`;

/**
 * Các root field backend CHƯA có: được lớp mock xử lý khi NEXT_PUBLIC_API_MOCK=missing.
 * Khi backend làm xong một API, xoá tên nó khỏi danh sách này để web gọi API thật.
 * Đã chuyển sang API thật (backend nhánh feat/admin-users-verifications): người dùng,
 * quản trị viên, đổi mật khẩu, lịch sử xét duyệt, hồ sơ tài xế, phương tiện, cấu hình,
 * vi phạm, báo cáo.
 */
export const PROPOSED_ROOT_FIELDS = new Set([
  "adminOperationsOverview",
  "adminBookings",
  "adminBooking",
  "adminPayments",
  "adminSosEvents",
  "adminResolveSosEvent",
  // Chuyến đi: backend làm ở phần tiếp theo.
  "adminTrips",
  "adminTrip",
  "adminCancelTrip",
  "adminAuditLogs",
]);
