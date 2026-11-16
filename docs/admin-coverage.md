# Mobile-to-admin coverage audit

Source review: 15 November 2026. This is a source-level audit, not live acceptance. The user requested full operational administration of mobile workflows, particularly journey history. Implementation must not imply all source modules are live services.

## Partial API integration update

- Follow-up workflow/CRUD findings and acceptance gaps: [workflow-audit.md](workflow-audit.md). Trip detail now renders a Goong basemap with persisted route geometry, not a straight-line fallback sketch. Real restriction/cancel controls remain disabled; missing-mode proposed writes no longer return mock success against live entities. Missing milestone projections explicitly show unavailable data.

- Backend now contains ADMIN/JWT-guarded `adminUsers`, `adminUser`, `adminTrips`, `adminTrip` and `adminOperationalRecords`. Operational sections currently allow bookings, payOS attempts only, review records and notification title/read metadata only. All are read-only, bounded, parameterized and require deployment. No migration was run.
- Four operational design screens now call the new query with no mock fallback. User/trip reads route to Backend in `missing/off`, while `all` retains explicit demo mode. Use real ADMIN authentication; a mock login cannot authenticate live queries.
- Settings screen now uses the actual typed `AppSettings`/`UpdateSystemSettingsInput` contract instead of the incompatible key/value contract. It intentionally queries only fields present in the current Backend, not newer recurring settings found only in mobile/admin code.
- Removed unsupported `Trip.bookings` selection from the live trip-detail query. The booking milestone projection remains pending; do not show its absence as zero bookings.
- Dashboard aggregation was subsequently added using a consistent database snapshot and Vietnam-calendar seven-day signup counts. It requires live database/schema acceptance like the other new reads.
- Pending: violations, user restrictions with authentication enforcement/audit, admin cancellation, violation forgiveness, withdrawal/payable dispatch, support and global audit APIs. No claim of full API integration or live acceptance is made.
- Mobile was fast-forwarded to origin/main `59a5527`; local payOS/session work was reapplied and Apollo error handling merged. Safety stash retained. Typecheck and 20 focused auth/payment/logging tests passed after dependency synchronization.

## Evidence

- Mobile routes include trip-history, trip-detail, active-trip, booking, fare-breakdown, recurring-trips, trip-change, vehicles, driver-profile, my-reviews, notifications, wallet-detail, chat and emergency-contacts. A route name alone does not prove its feature works.
- Backend modules: auth, users, drivers, vehicles, trips, bookings, payments, reviews, notifications, settings and maps. No ticket/support module was found.
- Existing ADMIN guards were found for driver/vehicle verification review, trip-change/recurring audits and typed system settings. Existing owner-only mobile booking, history, review and notification queries must not be reused to bypass ownership for admins.
- `src/lib/graphql.ts` explicitly classifies admin users/trips/violations/dashboard contracts as proposed. Their presence in mock SDL does not establish live Backend APIs.
- payOS collection exists; withdrawal/payable/admin approval and live payout acceptance remain pending. `/payouts` is a separate labelled preview.

## Delivered UI structure

- Dedicated `/journey-history` reuses the trip list and details with COMPLETED/CANCELLED/EXPIRED filters, search and existing server-contract pagination. It currently relies on the proposed admin trips API/mocks. It does not represent passenger booking rejection history or reconstruct historical GPS.
- `/trip-operations` is directly accessible in navigation.
- `/coverage` exposes the audited integration state and delivery priorities to operators/developers.
- `/operations/bookings`, `/operations/payments`, `/operations/reviews`, `/operations/notifications`, `/operations/support`, `/operations/audit` describe required fields, sub-sections and safeguards. These are design screens without list APIs or fake operational controls. The module registry is `src/lib/admin-modules.ts`.

## Recommended complete operational scope

1. Dashboard: real counts and time-windowed reports, explicitly separate proposed/mock statistics.
2. Users/drivers/vehicles: search, profile, eligibility, all verification statuses and review history, restrictions and evidence; do not invent a new DRIVER role.
3. Trips and journey history: real server filters including dates, driver and status; fixed saved route, appointments vs actual events, cancellation causes, breakdown/early-dropoff evidence, read-only persisted fare and receipts. No admin BOARD/code or live-trip impersonation.
4. Bookings: individual segment/seat state, expiry/cancel reasons, passenger and driver links, reservation history and receipt links. Do not equate booking cancellation with trip cancellation.
5. Financial administration: separate collection attempts, cash confirmations, finalized fees, payable allocations, reserved withdrawals, bank snapshots, admin reviews, funding and provider reconciliation. No mark-paid/refunded shortcuts.
6. Reviews: owner/role/booking evidence, actual review counts, low-score explanations. Moderation/removal requires explicit policy before controls are enabled.
7. Notifications: persisted inbox and push outbox attempts; provider acceptance vs delivery/read. No token display or bulk sends without policy.
8. Violations/support: retained strike evidence and review decisions. Tickets are a proposed new workflow, not an existing mobile integration. No automatic fault/refund inference.
9. Settings: reuse typed server-owned catalog, transactionally audited writes; do not rewrite posted schedules/rates.
10. Admin audit: append-only sensitive-action evidence, redacted before/after, actor/time/reason/correlation, controlled retention. Existing trip-change history is not a complete admin action journal.

## Boundaries and delivery gates

- Do not expose chat conversations, emergency contacts, KYC media or historical GPS indiscriminately. Define access and purpose before any support access endpoint.
- Every real query/mutation needs verified JWT plus server-side ADMIN checks, limits/pagination, authorization tests, masked errors and redacted logs. UI navigation is not authorization.
- Read-only evidence APIs precede operational mutations. Lock/unlock, cancellation, strike forgiveness and payouts require transaction/state/concurrency tests and auditing, not only frontend confirmation dialogs.
- No migrations against Azure, live transfers, commits or pushes are authorized by this UI pass.
- Live acceptance remains outstanding. Design screens are not substitutes for implementing Backend APIs and mobile workflows.
