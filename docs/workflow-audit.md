# Workflow and CRUD audit

## Full admin contract/read sweep — 15 November 2026

- Validated all 19 retained frontend operations (queries and mutation contracts) against the running Backend schema and the generated local SDL: zero validation failures. Added `npm run check:contracts` as a repeatable, read-only static check. It does not prove authorization/state-transition correctness or execute writes.
- Removed unsupported restriction/cancellation mutation handlers and stale proposed GraphQL documents. Violation, template revision, recurring enrollment/work evidence and unsupported recurring settings now remain explicitly unavailable instead of querying nonexistent schema fields. This does not implement those features.
- Live ADMIN reads through the web proxy succeeded for dashboard, users, trips, KYC queues, typed settings, operational records and supported recurring/change queries. Checked details for 10 existing users and 20 existing trips, all six trip status filters, second user page and unmatched user search. Anonymous web GraphQL request returned 401. No mutations or remote test suite were executed.
- Sixteen primary authenticated page URLs returned HTTP 200. This is transport/SSR coverage, not browser hydration, keyboard, viewport or map-provider acceptance.
- Corrected list capacity semantics to offered seats, removed stale mock notes, stabilized map inputs to avoid remounts on unrelated parent renders, preserved displayed currency decimals and guarded malformed date values.
- Existing stop names containing literal question marks are already damaged in API data. No database correction or guessed replacement was performed.

## Live-only follow-up

User requested removal of runtime demo data and excess implementation notes. Login/GraphQL routes no longer import or execute the mock store; legacy mock cookies are rejected and runtime mode is fixed to off regardless of old environment settings. Payout sample interactions were removed; unsupported modules show a concise unavailable state. Historical mock source files remain disconnected for now; their presence does not enable a runtime fallback. Backend at localhost:3000 was not listening during this pass, so actual authentication/data acceptance remains blocked until the Backend is running. No account or operational rows were created.

Source-level review, 15 November 2026. Not database/provider/device acceptance. The review covers the admin views/contracts, mock router, Backend admin read service, auth sign-in/JWT strategy and mobile map/operational rules.

## Findings

### Important — real reads mixed with simulated writes (mitigated)

`src/server/mock/execute.ts:36`: missing mode routes implemented user/trip reads to Backend but previously routed proposed restriction/cancellation/forgiveness writes to mock. A successful mock result could be mistaken for a real operational decision. These writes now go to Backend outside explicit all-demo mode; unsupported real user restriction and trip cancellation buttons are disabled. This is a safety boundary, not implementation of the mutations.

### Important — account restriction is not enforced (pending)

`../Backend/src/modules/auth/services/auth.service.ts:155` and `../Backend/src/modules/auth/strategies/jwt.strategy.ts:26`: sign-in/JWT validation do not reject suspended/deactivated accounts. Implement status enforcement for all authentication paths, an audited ADMIN mutation, self/last-admin protections and token/session acceptance tests before enabling real restrictions. No Backend auth behavior was changed in this pass.

### Important — unavailable milestones shown as zero (mitigated)

`src/components/trip-monitoring/trip-milestone-audit.tsx:155`: missing booking data previously became an empty array, producing misleading pickup/passenger statistics. An explicit unavailable panel now replaces these metrics until an ADMIN-authorized projection exists. Missing actual start on terminal/active trips no longer says waiting to start. Existing hard-coded punctuality thresholds are presentation heuristics, not approved violation adjudication; do not use them to impose penalties.

### Important — route illustration was not a basemap (replaced on trip detail)

`src/components/route-sketch.tsx:49`: SVG could fall back to joining stops rather than persisted road geometry. Trip details now use Goong JS and saved precision-5 geometry; malformed/missing geometry means markers only with a notice. No Directions, GPS request or provider fallback. Public tiles key is separate from server Places/Direction credentials. Domain authorization and WebGL/provider acceptance remain to be checked in a browser.

### Important — incomplete financial workflow (pending)

`src/components/operational-records.tsx` is limited to payOS attempts for payment reads. It does not expose a complete cash/legacy/fee/payable/reservation ledger. `/payouts` is a labelled local preview; bank registration, earned allocations, withdrawal reservations, audited admin decisions, funded dispatch and provider reconciliation are not implemented. Approval must never become mark-paid CRUD.

### Minor — misleading trip fields (partially corrected)

Trip detail now shows offered seats, not a global remaining-seat claim; changes the sharing-rate label to total per km; does not infer ADMIN actor merely because cancellation actor differs from driver. Trip list and aggregate projections still need a complete semantic pass for interval capacity, dates, money and absent fields.

## Workflow coverage matrix

| Domain | Current read | Current write | Missing / correct boundary |
| --- | --- | --- | --- |
| Users | ADMIN list/search/detail in source | Restriction UI demo only | Status enforcement, real audit/reason, safe lock/unlock; no free deletion of account evidence |
| Driver/vehicle KYC | Existing pending queues and document review | Existing approve/reject APIs | All-status history, pagination and simultaneous-review acceptance; not arbitrary edit of submitted documents |
| Trips/history | ADMIN list/detail, saved route map | Admin cancel demo only | Date/driver filters, bookings/events/fares, transactional cancellation and affected-party notices; no admin BOARD/ALIGHT or rewriting published prices |
| Recurring/changes | Existing audit components/contracts | Typed policy subset | Runtime schema acceptance, template/batch linkage, complete settings compatibility; admin oversight is not pre-approval |
| Bookings | Generic paginated read | No admin write | Dedicated detail, segment/seat capacity, state/reason history, appointment vs actual times; no impersonated driver approval |
| Collection | payOS attempt read | Provider-owned collection confirmation | Cash receipts, legacy reads, fee snapshots, linkage and reconciliation; no manual paid/reset/delete |
| Withdrawal/payout | Explicit local preview | No provider dispatch | Owner bank snapshots, payable reservation, admin approve/reject, durable reference, funding/unknown-result reconciliation |
| Reviews | Generic read | No moderation write | Booking/role evidence; removal/moderation needs explicit policy; never edit customer's star/comment |
| Notifications | Inbox title/read metadata | No admin broadcast/replay | Outbox attempts, redacted failure evidence, authorized retry policy; provider accepted != read/delivered |
| Violations | Proposed/mock contract | Forgiveness demo only | Real list/evidence/appeal decision, suspension recalculation and audit; no delete-history shortcut |
| Support | Design only | None | Ticket lifecycle, assignment, replies/evidence/privacy policy; mobile does not yet supply a ticket module |
| Settings | Actual Backend typed subset | Existing typed update API | Audit evidence and compatibility for recurring/newer fields; no arbitrary key CRUD |
| Admin audit | Trip-change evidence only | No general append-only journal | Actor/reason/time/before-after/correlation across sensitive actions; not editable CRUD |

## Acceptance required before calling workflows complete

- Execute live GraphQL operations with real ADMIN, USER and expired/missing sessions against an approved disposable/local fixture; no Azure suite was run.
- Check same-action double submissions, two-admin review races, stale revisions, commit/refetch ambiguity and retry idempotency.
- Exercise pending/confirmed/boarded/alighted/cancelled/expired/terminal states without inferring payment from trip status.
- Verify route endpoints/rests, missing/corrupt geometry, invalid coordinates, denied tiles key, resizing and unmount/retry cleanup.
- Test cash vs paid-online collection and payout unknown-result handling without sending real transfers.
- Explicit all-demo mode must stay visibly demo. Missing mode is not production acceptance and still contains proposed read contracts.
