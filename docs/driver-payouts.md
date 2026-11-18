# Admin-approved driver payouts

Confirmed scope: drivers register bank details on native mobile, request withdrawal, and an ADMIN reviews the receiving-details snapshot and eligible earnings on this website before backend payout dispatch.

## Current implementation

`/payouts` is a clearly labelled, local design preview. It uses fictional fixtures, not driver records or provider balance. Preview approval/rejection only updates component state and is lost on reload. No GraphQL mutations, provider calls or money transfers are implemented here. Do not use this preview as a production payout control.

## Backend integration requirements

- Consult `../Backend/ROUTESHARE_MASTER_CONTEXT.md`, section 5.4, before implementing APIs. Query/mutation names are not yet a deployed contract.
- ADMIN-only cursor-paginated list with server-side status/search filters, detail with eligible receipt allocations and persisted fee snapshots, reviewer/time/reason and provider references.
- Source balance must come from authenticated provider reads, including currency and last checked time. Unknown or stale balances are not zero. Show queued principal, estimated fees and shortfall separately. Collection bank funds are not Bao Kim wallet funds.
- Require explicit confirmation of recipient and amount. Persist review and stable reference/idempotency key before dispatch; atomically reserve eligible payables. Competing approvals and retries must not create additional transfers.
- Approval authorizes dispatch, not success. Distinguish pending review, approved, awaiting funding, processing, unknown/reconciling, paid, rejected and confirmed failed states. Do not release money on an ambiguous outcome.
- Only provider-confirmed payout completion may display paid. No manual mark-paid control. Cash creates no duplicate payable. Changing a bank account cannot mutate existing request snapshots.
- Typed account-holder names are unverified declarations, not provider account lookup. Bank ownership verification must be shown accurately, not inferred from name similarity.
- Keep payout credentials and transport in Backend. Reuse the existing authenticated Next.js GraphQL proxy and server-side ADMIN checks; UI hiding is not authorization.

## Acceptance still required

Backend migrations/services and focused concurrency/authorization tests, mobile bank registration/request screens, live admin API wiring, provider reconciliation and a user-triggered real-money test. No new database migration or live payout is authorized by creating the design preview.
