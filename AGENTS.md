<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## RouteShare trip operations

- Keep driver fee balances separate from passenger payments and payouts. Confirm top-ups only against actual bank receipts; use audited ledger entries for adjustments and make publication mode explicit.
- Use the existing system setting to manage the percentage for newly published trips; do not add a second rate to wallet policy.

- Trip-detail maps use Goong with the public Map tiles key and persisted route geometry only. Never expose the server Places/Direction key, reroute missing historical geometry, or add admin live GPS access implicitly. Consult docs/workflow-audit.md for current workflow gaps; mock decisions must never masquerade as writes to live entities.

- Admin scope covers mobile operations; consult docs/admin-coverage.md and src/lib/admin-modules.ts for audited coverage and gaps. Do not equate a navigation entry or design-only screen with a working backend integration. Historical journey evidence is read-only; do not expose BOARD codes, tracking access, secrets or manual financial success overrides.

- Payment/withdrawal policy is in ../Backend/ROUTESHARE_MASTER_CONTEXT.md section 5.4. Drivers register bank details and request withdrawal; ADMIN review is required before backend payOS/Bao Kim dispatch. Approval is not payment success. Keep design previews explicitly separate from real actions; never simulate a provider-confirmed transfer or expose payout credentials to this app.

- Consult ../ROUTESHARE_MASTER_CONTEXT.md for recurring publication and trip-change policy. Driver/passenger flows are native mobile; this app provides ADMIN-only post-action oversight and typed policy configuration.
- Recurring and change audit panels use real backend APIs, cursor pagination and read-only evidence. Keep mocked proposed admin actions separate. Provider acceptance is not device delivery or reading; edits/cancellations do not automatically establish fault.

- Recurring template change history is read-only and cursor-paginated through `adminRecurringTemplateChanges`; show persisted before/after revisions without inferring fault.

- Post-trip support follows existing mobile and admin UI patterns. Keep mobile intake compact and accessible, and give admins a filterable queue and case details with the evidence and handling history needed to resolve reports.
