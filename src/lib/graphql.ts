import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  DriverVerification,
  DriverViolation,
  OperationsOverview,
  Page,
  SystemSetting,
  Trip,
  TripStatus,
  User,
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

export const ME: TypedDocumentNode<{ me: Pick<User, "id" | "fullName" | "email"> }> = gql`
  query Me {
    me {
      id
      fullName
      email
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
  { adminForgiveViolation: Pick<DriverViolation, "id" | "isForgiven"> },
  { input: { violationId: string; reason: string } }
> = gql`
  mutation ForgiveViolation($input: AdminForgiveViolationInput!) {
    adminForgiveViolation(input: $input) {
      id
      isForgiven
      forgivenReason
    }
  }
`;

export const SYSTEM_SETTINGS: TypedDocumentNode<{
  adminSystemSettings: SystemSetting[];
}> = gql`
  query AdminSystemSettings {
    adminSystemSettings {
      id
      settingKey
      settingValue
      description
      updatedAt
    }
  }
`;

export const UPDATE_SYSTEM_SETTING: TypedDocumentNode<
  { adminUpdateSystemSetting: SystemSetting },
  { input: { settingKey: string; settingValue: string } }
> = gql`
  mutation UpdateSystemSetting($input: AdminUpdateSystemSettingInput!) {
    adminUpdateSystemSetting(input: $input) {
      id
      settingKey
      settingValue
      description
      updatedAt
    }
  }
`;
