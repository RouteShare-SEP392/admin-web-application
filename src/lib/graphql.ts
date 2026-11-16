import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  DashboardStats,
  DriverVerification,
  Page,
  Trip,
  TripStatus,
  User,
  UserRole,
  UserStatus,
  VehicleVerification,
  VerificationStatus,
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

export const DASHBOARD_STATS: TypedDocumentNode<{
  adminDashboardStats: DashboardStats;
}> = gql`
  query DashboardStats {
    adminDashboardStats {
      totalUsers
      newUsersLast7Days
      approvedDrivers
      pendingDriverVerifications
      pendingVehicleVerifications
      activeTrips
      openViolations
      tripsByStatus {
        status
        count
      }
      signupsByDay {
        date
        count
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
    }
  }
`;


