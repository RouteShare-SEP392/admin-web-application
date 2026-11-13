import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AuditAction,
  AuditLog,
  Booking,
  BookingStatus,
  DriverProfile,
  DriverVerification,
  DriverViolation,
  OperationsOverview,
  Page,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentSummary,
  Report,
  ReportStatus,
  SosEvent,
  AppSettings,
  Trip,
  TripStatus,
  User,
  Vehicle,
  VehicleType,
  UserRole,
  UserStatus,
  VehicleVerification,
  VerificationStatus,
  ViolationType,
} from "./types";

interface PageVars {
  page: number;
  pageSize: number;
}

interface ReviewVars {
  input: {
    verificationId: string;
    status: VerificationStatus;
    rejectionReason?: string;
  };
}

// ---------------------------------------------------------------------------
// API backend đã có
// ---------------------------------------------------------------------------

export const ME: TypedDocumentNode<{
  me: Pick<User, "id" | "fullName" | "email" | "phone" | "avatarUrl" | "role" | "createdAt">;
}> = gql`
  query Me {
    me {
      id
      fullName
      email
      phone
      avatarUrl
      role
      createdAt
    }
  }
`;

export const PENDING_COUNTS: TypedDocumentNode<{
  adminPendingDriverVerifications: { id: string }[];
  adminPendingVehicleVerifications: { id: string }[];
}> = gql`
  query PendingCounts {
    adminPendingDriverVerifications {
      id
    }
    adminPendingVehicleVerifications {
      id
    }
  }
`;

export const PENDING_DRIVER_VERIFICATIONS: TypedDocumentNode<{
  adminPendingDriverVerifications: DriverVerification[];
}> = gql`
  query PendingDriverVerifications {
    adminPendingDriverVerifications {
      id
      type
      licenseClass
      documentNumber
      frontPhotoUrl
      backPhotoUrl
      status
      createdAt
      driverProfile {
        id
        experienceYears
        verificationStatus
        user {
          id
          fullName
          email
          phone
          avatarUrl
          dateOfBirth
          createdAt
        }
      }
    }
  }
`;

export const REVIEW_DRIVER_VERIFICATION: TypedDocumentNode<
  { adminReviewDriverVerification: Pick<DriverVerification, "id" | "status"> },
  ReviewVars
> = gql`
  mutation ReviewDriverVerification($input: AdminReviewDriverVerificationInput!) {
    adminReviewDriverVerification(input: $input) {
      id
      status
    }
  }
`;

export const PENDING_VEHICLE_VERIFICATIONS: TypedDocumentNode<{
  adminPendingVehicleVerifications: VehicleVerification[];
}> = gql`
  query PendingVehicleVerifications {
    adminPendingVehicleVerifications {
      id
      documentType
      documentNumber
      frontPhotoUrl
      backPhotoUrl
      status
      createdAt
      vehicle {
        id
        make
        model
        color
        year
        plateNumber
        vehicleType
        seatCapacity
        driverProfile {
          id
          verificationStatus
          user {
            id
            fullName
            email
            phone
            avatarUrl
          }
          verifications {
            id
            type
            status
            licenseClass
          }
        }
      }
    }
  }
`;

export const REVIEW_VEHICLE_VERIFICATION: TypedDocumentNode<
  { adminReviewVehicleVerification: Pick<VehicleVerification, "id" | "status"> },
  ReviewVars
> = gql`
  mutation ReviewVehicleVerification($input: AdminReviewVehicleVerificationInput!) {
    adminReviewVehicleVerification(input: $input) {
      id
      status
    }
  }
`;

// ---------------------------------------------------------------------------
// API admin đề xuất (hợp đồng: src/server/mock/schema.ts)
// ---------------------------------------------------------------------------

export const OPERATIONS_OVERVIEW: TypedDocumentNode<
  { adminOperationsOverview: OperationsOverview },
  { rangeDays: number }
> = gql`
  query OperationsOverview($rangeDays: Int!) {
    adminOperationsOverview(rangeDays: $rangeDays) {
      generatedAt
      rangeDays
      kpis {
        key
        value
        delta
        deltaUnit
        series
        secondaryValue
      }
      dailyTrips {
        date
        posted
        completed
      }
      funnel {
        searches
        matchedSearches
        bookingRequests
        approvedBookings
      }
      matching {
        averageOverlapPercent
        overlapDeltaPoints
        averageDetourKm
        detourDeltaKm
      }
      safety {
        pendingVerifications
        overdueVerifications
        openViolations
        passengerReportViolations
        usersToReview
        openReports
        overdueReports
        unresolvedSos
      }
    }
  }
`;

export type RecentTripFilter = "all" | "lowMatch" | "hasViolation" | "today";

export const RECENT_TRIPS: TypedDocumentNode<
  { adminTrips: Page<Trip> },
  {
    input: PageVars & {
      sortBy: "CREATED_AT";
      lowMatchOnly?: boolean;
      hasViolation?: boolean;
      todayOnly?: boolean;
    };
  }
> = gql`
  query RecentTrips($input: AdminTripsInput) {
    adminTrips(input: $input) {
      total
      page
      pageSize
      items {
        id
        tripCode
        status
        createdAt
        totalSeatsOffered
        bookedSeats
        averageMatchPercent
        sharedCostTotal
        driver {
          id
          fullName
          avatarUrl
          ratingAsDriver
        }
        vehicle {
          id
          make
          model
        }
        stops {
          id
          stopName
          stopType
          sequenceOrder
        }
      }
    }
  }
`;

interface VerificationHistoryVars {
  input: PageVars & { statuses: VerificationStatus[]; search?: string };
}

export const DRIVER_VERIFICATION_HISTORY: TypedDocumentNode<
  { adminDriverVerifications: Page<DriverVerification> },
  VerificationHistoryVars
> = gql`
  query DriverVerificationHistory($input: AdminDriverVerificationsInput) {
    adminDriverVerifications(input: $input) {
      total
      page
      pageSize
      items {
        id
        type
        licenseClass
        status
        rejectReason
        reviewedAt
        reviewedBy {
          id
          fullName
        }
        driverProfile {
          id
          user {
            id
            fullName
            email
            phone
            avatarUrl
          }
        }
      }
    }
  }
`;

export const VEHICLE_VERIFICATION_HISTORY: TypedDocumentNode<
  { adminVehicleVerifications: Page<VehicleVerification> },
  VerificationHistoryVars
> = gql`
  query VehicleVerificationHistory($input: AdminVehicleVerificationsInput) {
    adminVehicleVerifications(input: $input) {
      total
      page
      pageSize
      items {
        id
        status
        rejectReason
        reviewedAt
        reviewedBy {
          id
          fullName
        }
        vehicle {
          id
          make
          model
          color
          plateNumber
          vehicleType
          driverProfile {
            id
            user {
              id
              fullName
              email
              phone
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

export const DRIVER_PROFILE: TypedDocumentNode<
  { adminDriverProfile: DriverProfile },
  { id: string }
> = gql`
  query AdminDriverProfile($id: ID!) {
    adminDriverProfile(id: $id) {
      id
      verificationStatus
      rejectionReason
      experienceYears
      noShowStrikeCount
      suspendedUntil
      verifiedAt
      createdAt
      user {
        id
        fullName
        email
        phone
        avatarUrl
        dateOfBirth
        status
      }
      verifications {
        id
        type
        licenseClass
        documentNumber
        frontPhotoUrl
        backPhotoUrl
        status
        rejectReason
        reviewedAt
        reviewedBy {
          id
          fullName
        }
        createdAt
      }
      vehicles {
        id
        make
        model
        color
        year
        plateNumber
        vehicleType
        seatCapacity
        verificationStatus
        verifications {
          id
          documentType
          documentNumber
          frontPhotoUrl
          backPhotoUrl
          status
          rejectReason
          reviewedAt
          reviewedBy {
            id
            fullName
          }
          createdAt
        }
      }
    }
  }
`;

export const VEHICLES: TypedDocumentNode<
  { adminVehicles: Page<Vehicle> },
  {
    input: PageVars & {
      search?: string;
      vehicleType?: VehicleType;
      verificationStatus?: VerificationStatus;
    };
  }
> = gql`
  query AdminVehicles($input: AdminVehiclesInput) {
    adminVehicles(input: $input) {
      total
      page
      pageSize
      items {
        id
        make
        model
        color
        year
        plateNumber
        vehicleType
        seatCapacity
        isActive
        verificationStatus
        createdAt
        driverProfile {
          id
          user {
            id
            fullName
            email
            phone
            avatarUrl
          }
        }
      }
    }
  }
`;

const TRIP_SUMMARY_FIELDS = gql`
  fragment TripSummaryFields on Trip {
    id
    tripCode
    status
    departureTime
    stops {
      id
      stopName
      stopType
      sequenceOrder
    }
  }
`;

export const USER_POSTED_TRIPS: TypedDocumentNode<
  { adminTrips: Page<Trip> },
  { input: PageVars & { driverId: string } }
> = gql`
  query UserPostedTrips($input: AdminTripsInput) {
    adminTrips(input: $input) {
      total
      page
      pageSize
      items {
        ...TripSummaryFields
        bookedSeats
        totalSeatsOffered
      }
    }
  }
  ${TRIP_SUMMARY_FIELDS}
`;

const BOOKING_ROW_FIELDS = gql`
  fragment BookingRowFields on AdminBooking {
    id
    bookingCode
    status
    seatsBooked
    totalAmount
    requestedAt
    pickupStop {
      id
      stopName
    }
    dropoffStop {
      id
      stopName
    }
    passenger {
      id
      fullName
      email
      phone
      avatarUrl
    }
    trip {
      id
      tripCode
      departureTime
      driver {
        id
        fullName
      }
    }
  }
`;

export const BOOKINGS: TypedDocumentNode<
  { adminBookings: Page<Booking> },
  {
    input: PageVars & {
      search?: string;
      status?: BookingStatus;
      tripId?: string;
      passengerId?: string;
    };
  }
> = gql`
  query AdminBookings($input: AdminBookingsInput) {
    adminBookings(input: $input) {
      total
      page
      pageSize
      items {
        ...BookingRowFields
      }
    }
  }
  ${BOOKING_ROW_FIELDS}
`;

export const BOOKING_DETAIL: TypedDocumentNode<{ adminBooking: Booking }, { id: string }> = gql`
  query AdminBooking($id: ID!) {
    adminBooking(id: $id) {
      ...BookingRowFields
      fareStatus
      baseAmount
      discountPercent
      discountAmount
      platformFee
      driverEarnings
      cancellationReason
      confirmedAt
      cancelledAt
      completedAt
      trip {
        id
        status
        totalDistanceKm
        driver {
          id
          fullName
          email
          phone
          avatarUrl
        }
        stops {
          id
          stopName
          stopType
          sequenceOrder
        }
      }
      payment {
        id
        amount
        method
        status
        transactionReference
        paidAt
        settlementStatus
        settledAt
      }
    }
  }
  ${BOOKING_ROW_FIELDS}
`;

export const PAYMENTS: TypedDocumentNode<
  { adminPayments: Page<Payment> & { summary: PaymentSummary } },
  { input: PageVars & { search?: string; status?: PaymentStatus; method?: PaymentMethod } }
> = gql`
  query AdminPayments($input: AdminPaymentsInput) {
    adminPayments(input: $input) {
      total
      page
      pageSize
      summary {
        paidAmount
        platformFee
        pendingAmount
        failedCount
      }
      items {
        id
        amount
        platformFee
        netAmount
        method
        status
        transactionReference
        paidAt
        createdAt
        settlementStatus
        payer {
          id
          fullName
        }
        payee {
          id
          fullName
        }
        booking {
          id
          bookingCode
        }
      }
    }
  }
`;

const REPORT_FIELDS = gql`
  fragment ReportFields on AdminReport {
    id
    type
    description
    status
    resolutionNote
    resolvedAt
    createdAt
    resolvedBy {
      id
      fullName
    }
    reporter {
      id
      fullName
      email
      phone
      avatarUrl
    }
    reportedUser {
      id
      fullName
      email
      phone
      avatarUrl
      status
    }
    trip {
      id
      tripCode
      departureTime
      stops {
        id
        stopName
        stopType
        sequenceOrder
      }
    }
  }
`;

export const REPORTS: TypedDocumentNode<
  { adminReports: Page<Report> },
  { input: PageVars & { search?: string; status?: ReportStatus; overdueOnly?: boolean } }
> = gql`
  query AdminReports($input: AdminReportsInput) {
    adminReports(input: $input) {
      total
      page
      pageSize
      items {
        ...ReportFields
      }
    }
  }
  ${REPORT_FIELDS}
`;

export const REPORT_DETAIL: TypedDocumentNode<{ adminReport: Report }, { id: string }> = gql`
  query AdminReport($id: ID!) {
    adminReport(id: $id) {
      ...ReportFields
    }
  }
  ${REPORT_FIELDS}
`;

export const UPDATE_REPORT_STATUS: TypedDocumentNode<
  { adminUpdateReportStatus: Report },
  { input: { reportId: string; status: ReportStatus; note?: string } }
> = gql`
  mutation UpdateReportStatus($input: AdminUpdateReportStatusInput!) {
    adminUpdateReportStatus(input: $input) {
      ...ReportFields
    }
  }
  ${REPORT_FIELDS}
`;

const SOS_FIELDS = gql`
  fragment SosFields on AdminSosEvent {
    id
    latitude
    longitude
    triggeredAt
    resolvedAt
    notes
    resolvedBy {
      id
      fullName
    }
    user {
      id
      fullName
      email
      phone
      avatarUrl
    }
    trip {
      id
      tripCode
      status
      driver {
        id
        fullName
        phone
      }
      stops {
        id
        stopName
        stopType
        sequenceOrder
      }
    }
    emergencyContacts {
      id
      name
      phone
      relationship
    }
  }
`;

export const SOS_EVENTS: TypedDocumentNode<
  { adminSosEvents: Page<SosEvent> },
  { input: PageVars & { resolved?: boolean } }
> = gql`
  query AdminSosEvents($input: AdminSosEventsInput) {
    adminSosEvents(input: $input) {
      total
      page
      pageSize
      items {
        ...SosFields
      }
    }
  }
  ${SOS_FIELDS}
`;

export const RESOLVE_SOS_EVENT: TypedDocumentNode<
  { adminResolveSosEvent: SosEvent },
  { input: { sosEventId: string; notes: string } }
> = gql`
  mutation ResolveSosEvent($input: AdminResolveSosEventInput!) {
    adminResolveSosEvent(input: $input) {
      ...SosFields
    }
  }
  ${SOS_FIELDS}
`;

/**
 * Số việc an toàn đang chờ, cho huy hiệu trên thanh điều hướng. Hai câu truy vấn
 * tách riêng vì báo cáo đã có API backend còn SOS vẫn chạy trên dữ liệu mẫu.
 */
export const OPEN_REPORT_COUNT: TypedDocumentNode<{
  openReports: { total: number };
}> = gql`
  query OpenReportCount {
    openReports: adminReports(input: { status: OPEN, pageSize: 1 }) {
      total
    }
  }
`;

export const UNRESOLVED_SOS_COUNT: TypedDocumentNode<{
  unresolvedSos: { total: number };
}> = gql`
  query UnresolvedSosCount {
    unresolvedSos: adminSosEvents(input: { resolved: false, pageSize: 1 }) {
      total
    }
  }
`;

export const CREATE_ADMIN: TypedDocumentNode<
  { adminCreateAdmin: Pick<User, "id" | "fullName"> },
  { input: { fullName: string; email: string; password: string } }
> = gql`
  mutation CreateAdmin($input: AdminCreateAdminInput!) {
    adminCreateAdmin(input: $input) {
      id
      fullName
    }
  }
`;

export const USER_VIOLATIONS: TypedDocumentNode<
  { adminDriverViolations: Page<DriverViolation> },
  { input: PageVars & { driverId: string } }
> = gql`
  query UserViolations($input: AdminDriverViolationsInput) {
    adminDriverViolations(input: $input) {
      total
      page
      pageSize
      items {
        id
        tripId
        violationType
        penaltyAction
        penaltyUntil
        affectedPassengersCount
        isForgiven
        forgivenReason
        createdAt
        trip {
          id
          tripCode
        }
      }
    }
  }
`;

export const USERS: TypedDocumentNode<
  { adminUsers: Page<User> },
  { input: PageVars & { search?: string; role?: UserRole; status?: UserStatus } }
> = gql`
  query AdminUsers($input: AdminUsersInput) {
    adminUsers(input: $input) {
      total
      page
      pageSize
      items {
        id
        fullName
        email
        phone
        avatarUrl
        role
        status
        isPhoneVerified
        isDriverApproved
        createdAt
        driverProfile {
          id
          verificationStatus
        }
      }
    }
  }
`;

const USER_DETAIL_FIELDS = gql`
  fragment UserDetailFields on User {
    id
    fullName
    email
    phone
    avatarUrl
    bio
    dateOfBirth
    gender
    role
    status
    isPhoneVerified
    isIdentityVerified
    isDriverApproved
    ratingAsDriver
    ratingAsPassenger
    totalRidesAsDriver
    totalRidesAsPassenger
    createdAt
    updatedAt
    driverProfile {
      id
      experienceYears
      noShowStrikeCount
      rejectionReason
      suspendedUntil
      verificationStatus
      verifiedAt
      verifications {
        id
        type
        licenseClass
        status
        rejectReason
        createdAt
      }
      vehicles {
        id
        make
        model
        color
        plateNumber
        vehicleType
        seatCapacity
        verificationStatus
      }
    }
  }
`;

export const USER_DETAIL: TypedDocumentNode<{ adminUser: User }, { id: string }> = gql`
  query AdminUser($id: ID!) {
    adminUser(id: $id) {
      ...UserDetailFields
    }
  }
  ${USER_DETAIL_FIELDS}
`;

export const SUSPEND_USER: TypedDocumentNode<
  { adminSuspendUser: Pick<User, "id" | "status"> },
  { input: { userId: string; reason: string } }
> = gql`
  mutation SuspendUser($input: AdminSuspendUserInput!) {
    adminSuspendUser(input: $input) {
      id
      status
      updatedAt
    }
  }
`;

export const UNSUSPEND_USER: TypedDocumentNode<
  { adminUnsuspendUser: Pick<User, "id" | "status"> },
  { userId: string }
> = gql`
  mutation UnsuspendUser($userId: ID!) {
    adminUnsuspendUser(userId: $userId) {
      id
      status
      updatedAt
    }
  }
`;

export const TRIPS: TypedDocumentNode<
  { adminTrips: Page<Trip> },
  { input: PageVars & { search?: string; status?: TripStatus } }
> = gql`
  query AdminTrips($input: AdminTripsInput) {
    adminTrips(input: $input) {
      total
      page
      pageSize
      items {
        id
        tripCode
        status
        departureTime
        actualStartedAt
        actualCompletedAt
        totalDistanceKm
        totalSeatsOffered
        availableSeats
        driver {
          id
          fullName
          avatarUrl
        }
        pricing {
          id
          baseCostPerKm
        }
        stops {
          id
          stopName
          stopType
          sequenceOrder
        }
      }
    }
  }
`;

export const TRIP_DETAIL: TypedDocumentNode<{ adminTrip: Trip }, { id: string }> = gql`
  query AdminTrip($id: ID!) {
    adminTrip(id: $id) {
      id
      tripCode
      bookedSeats
      averageMatchPercent
      sharedCostTotal
      status
      departureTime
      estimatedArrivalTime
      totalDistanceKm
      totalDurationMinutes
      totalSeatsOffered
      availableSeats
      isInstantBooking
      luggageAllowed
      driverNotes
      routePolyline
      cancellationReason
      cancelledBy
      createdAt
      driverId
      driver {
        id
        fullName
        email
        phone
        avatarUrl
        ratingAsDriver
        totalRidesAsDriver
      }
      vehicle {
        id
        make
        model
        color
        plateNumber
        vehicleType
        seatCapacity
      }
      pricing {
        id
        baseCostPerKm
        totalEstimatedFare
      }
      stops {
        id
        stopName
        stopAddress
        stopType
        sequenceOrder
        latitude
        longitude
        plannedArrivalTime
        plannedDepartureTime
      }
      actualStartedAt
      actualCompletedAt
      originalDepartureTime
      bookings {
        id
        passengerId
        passengerName
        passengerPhone
        seatsBooked
        pickupLabel
        plannedPickupTime
        arrivedAt
        boardedAt
        dropoffLabel
        plannedDropoffTime
        alightedAt
        status
        totalAmount
      }
    }
  }
`;

export const CANCEL_TRIP: TypedDocumentNode<
  { adminCancelTrip: Pick<Trip, "id" | "status"> },
  { input: { tripId: string; reason: string } }
> = gql`
  mutation CancelTrip($input: AdminCancelTripInput!) {
    adminCancelTrip(input: $input) {
      id
      status
      cancellationReason
      cancelledBy
      availableSeats
    }
  }
`;

export const VIOLATIONS: TypedDocumentNode<
  { adminDriverViolations: Page<DriverViolation> },
  { input: PageVars & { violationType?: ViolationType; isForgiven?: boolean } }
> = gql`
  query AdminDriverViolations($input: AdminDriverViolationsInput) {
    adminDriverViolations(input: $input) {
      total
      page
      pageSize
      items {
        id
        tripId
        violationType
        penaltyAction
        affectedPassengersCount
        penaltyUntil
        isForgiven
        forgivenReason
        createdAt
        driver {
          id
          fullName
          avatarUrl
        }
        trip {
          id
          departureTime
          stops {
            id
            stopName
            stopType
            sequenceOrder
          }
        }
      }
    }
  }
`;

export const FORGIVE_VIOLATION: TypedDocumentNode<
  {
    adminForgiveViolation: Pick<DriverViolation, "id" | "isForgiven" | "forgivenReason"> & {
      driver: {
        id: string;
        driverProfile: Pick<
          DriverProfile,
          "id" | "noShowStrikeCount" | "suspendedUntil" | "verificationStatus"
        > | null;
      };
    };
  },
  { input: { violationId: string; reason: string } }
> = gql`
  mutation ForgiveViolation($input: AdminForgiveViolationInput!) {
    adminForgiveViolation(input: $input) {
      id
      isForgiven
      forgivenReason
      # Hồ sơ sau khi tha, để báo hệ quả: số lần bỏ chuyến, tạm khoá, quyền tài xế.
      driver {
        id
        driverProfile {
          id
          noShowStrikeCount
          suspendedUntil
          verificationStatus
        }
      }
    }
  }
`;

const APP_SETTINGS_FIELDS = gql`
  fragment AppSettingsFields on AppSettings {
    platformFeePercent
    minCostPerKm
    maxCostPerKm
    repeatPassengerDiscountMaxPercent
    defaultSearchRadiusMeters
    maxSearchRadiusMeters
    minDepartureLeadMinutes
    tripEditCutoffMinutes
    tripScheduleChangeToleranceMinutes
    maxWaypointDistanceMeters
    maxStopWaitMinutes
    recurringPassengerPriorityMinutes
    recurringDriverCheckLocalTime
    recurringDriverReminderLeadMinutes
    activeUploadSeconds
    activeStationarySeconds
    activeViewerPollSeconds
    activeGpsMaxAgeSeconds
    activeGpsFutureSkewSeconds
    activeGpsAccuracyMeters
    activeProximityMeters
    activeOffRouteMeters
    activePassedPickupMeters
  }
`;

export const SYSTEM_SETTINGS: TypedDocumentNode<{
  adminSystemSettings: AppSettings;
}> = gql`
  query AdminSystemSettings {
    adminSystemSettings {
      ...AppSettingsFields
    }
  }
  ${APP_SETTINGS_FIELDS}
`;

export const UPDATE_SYSTEM_SETTINGS: TypedDocumentNode<
  { updateSystemSettings: AppSettings },
  { input: Partial<Omit<AppSettings, "maxSearchRadiusMeters">> }
> = gql`
  mutation UpdateSystemSettings($input: UpdateSystemSettingsInput!) {
    updateSystemSettings(input: $input) {
      ...AppSettingsFields
    }
  }
  ${APP_SETTINGS_FIELDS}
`;

export const AUDIT_LOGS: TypedDocumentNode<
  { adminAuditLogs: Page<AuditLog> },
  { input: PageVars & { action?: AuditAction; actorId?: string; search?: string } }
> = gql`
  query AdminAuditLogs($input: AdminAuditLogsInput) {
    adminAuditLogs(input: $input) {
      total
      page
      pageSize
      items {
        id
        action
        targetType
        targetId
        targetLabel
        detail
        createdAt
        actor {
          id
          fullName
          avatarUrl
        }
      }
    }
  }
`;

export const CHANGE_PASSWORD: TypedDocumentNode<
  { changePassword: boolean },
  { input: { currentPassword: string; newPassword: string } }
> = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;
