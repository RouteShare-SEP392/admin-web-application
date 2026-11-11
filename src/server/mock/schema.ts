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

  type Query {
    me: User!
    adminPendingDriverVerifications: [DriverVerification!]!
    adminPendingVehicleVerifications: [VehicleVerification!]!
  }

  type Mutation {
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

  """Bảng system_settings trong DBML, backend chưa có entity."""
  type SystemSetting {
    id: ID!
    settingKey: String!
    settingValue: String!
    description: String
    updatedAt: DateTime!
  }

  type AdminTripStatusCount {
    status: TripStatus!
    count: Int!
  }

  type AdminDailyCount {
    """Ngày theo múi giờ Asia/Ho_Chi_Minh, định dạng YYYY-MM-DD"""
    date: String!
    count: Int!
  }

  type AdminDashboardStats {
    totalUsers: Int!
    newUsersLast7Days: Int!
    approvedDrivers: Int!
    pendingDriverVerifications: Int!
    pendingVehicleVerifications: Int!
    """Số chuyến PUBLISHED + IN_PROGRESS"""
    activeTrips: Int!
    """Số vi phạm chưa được tha"""
    openViolations: Int!
    tripsByStatus: [AdminTripStatusCount!]!
    """7 ngày gần nhất, cũ trước mới sau"""
    signupsByDay: [AdminDailyCount!]!
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

  input AdminTripsInput {
    """Tìm theo tên tài xế hoặc tên điểm dừng"""
    search: String
    status: TripStatus
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

  input AdminUpdateSystemSettingInput {
    settingKey: String!
    settingValue: String!
  }

  extend type Query {
    adminDashboardStats: AdminDashboardStats!
    adminUsers(input: AdminUsersInput): AdminUserPage!
    adminUser(id: ID!): User!
    adminTrips(input: AdminTripsInput): AdminTripPage!
    adminTrip(id: ID!): Trip!
    adminDriverViolations(input: AdminDriverViolationsInput): AdminDriverViolationPage!
    adminSystemSettings: [SystemSetting!]!
  }

  extend type Mutation {
    """Đặt status = SUSPENDED. Backend cần chặn đăng nhập với tài khoản bị khoá."""
    adminSuspendUser(input: AdminSuspendUserInput!): User!
    adminUnsuspendUser(userId: ID!): User!
    """Chỉ áp dụng cho chuyến PUBLISHED (theo state machine của chuyến đi)."""
    adminCancelTrip(input: AdminCancelTripInput!): Trip!
    adminForgiveViolation(input: AdminForgiveViolationInput!): DriverViolation!
    adminUpdateSystemSetting(input: AdminUpdateSystemSettingInput!): SystemSetting!
  }
`;

/** Các root field backend chưa có: được lớp mock xử lý khi NEXT_PUBLIC_API_MOCK=missing. */
export const PROPOSED_ROOT_FIELDS = new Set([
  "adminDashboardStats",
  "adminUsers",
  "adminUser",
  "adminTrips",
  "adminTrip",
  "adminDriverViolations",
  "adminSystemSettings",
  "adminSuspendUser",
  "adminUnsuspendUser",
  "adminCancelTrip",
  "adminForgiveViolation",
  "adminUpdateSystemSetting",
]);
