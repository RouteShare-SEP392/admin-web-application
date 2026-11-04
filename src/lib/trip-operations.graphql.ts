import { gql, type TypedDocumentNode } from "@apollo/client";
export interface AuditFilter {
  tripId?: string;
  driverId?: string;
  templateId?: string;
  first?: number;
  after?: string;
}
export interface TripChangeAudit {
  id: string;
  tripId: string;
  actorId: string;
  actorName: string;
  createdAt: string;
  reasonCode: string;
  explanation?: string | null;
  previousDepartureTime: string;
  currentDepartureTime: string;
  originalDepartureTime: string;
  toleranceMinutes?: number | null;
  revision: number;
  affectedBookings: number;
  confirmedBookings: number;
  replacementTripId?: string | null;
  templateId?: string | null;
  localDate?: string | null;
  inboxCount: number;
  providerAcceptedCount: number;
  pushFailedCount: number;
}
export interface BatchAudit {
  id: string;
  templateId: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  state: string;
  tripIds: string[];
  outcomes: {
    localDate: string;
    departureTime: string;
    state: string;
    reason?: string | null;
    tripId?: string | null;
  }[];
}
export interface CursorPage<T> {
  items: T[];
  hasNextPage: boolean;
  endCursor?: string | null;
}
export const TRIP_CHANGES: TypedDocumentNode<
  { adminTripChanges: CursorPage<TripChangeAudit> },
  { filter: AuditFilter }
> = gql`
  query TripChanges($filter: TripAuditFilter) {
    adminTripChanges(filter: $filter) {
      items {
        id
        tripId
        actorId
        actorName
        createdAt
        reasonCode
        explanation
        previousDepartureTime
        currentDepartureTime
        originalDepartureTime
        toleranceMinutes
        revision
        affectedBookings
        confirmedBookings
        replacementTripId
        templateId
        localDate
        inboxCount
        providerAcceptedCount
        pushFailedCount
      }
      hasNextPage
      endCursor
    }
  }
`;
export const RECURRING_ATTEMPTS: TypedDocumentNode<
  { adminRecurringBatchAttempts: CursorPage<BatchAudit> },
  { filter: AuditFilter }
> = gql`
  query RecurringAttempts($filter: TripAuditFilter) {
    adminRecurringBatchAttempts(filter: $filter) {
      items {
        id
        templateId
        ownerId
        ownerName
        createdAt
        state
        tripIds
        outcomes {
          localDate
          departureTime
          state
          reason
          tripId
        }
      }
      hasNextPage
      endCursor
    }
  }
`;
export const TRIP_CHANGE_POLICY: TypedDocumentNode<{
  adminTripChangePolicy: { tripScheduleChangeToleranceMinutes: number };
}> = gql`
  query TripChangePolicy {
    adminTripChangePolicy {
      tripScheduleChangeToleranceMinutes
    }
  }
`;
export const UPDATE_TRIP_CHANGE_POLICY: TypedDocumentNode<
  { updateSystemSettings: { tripScheduleChangeToleranceMinutes: number } },
  { input: { tripScheduleChangeToleranceMinutes: number } }
> = gql`
  mutation UpdateTripChangePolicy($input: UpdateSystemSettingsInput!) {
    updateSystemSettings(input: $input) {
      tripScheduleChangeToleranceMinutes
    }
  }
`;
export interface TemplateAudit {
  id: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  version: number;
  weekdays: number[];
  localTime: string;
  originName: string;
  destinationName: string;
  occurrenceCount: number;
}
export const RECURRING_TEMPLATE_AUDIT: TypedDocumentNode<
  { adminRecurringTemplates: CursorPage<TemplateAudit> },
  { filter: AuditFilter }
> = gql`
  query RecurringTemplateAudit($filter: TripAuditFilter) {
    adminRecurringTemplates(filter: $filter) {
      items {
        id
        ownerId
        ownerName
        createdAt
        version
        weekdays
        localTime
        originName
        destinationName
        occurrenceCount
      }
      hasNextPage
      endCursor
    }
  }
`;
