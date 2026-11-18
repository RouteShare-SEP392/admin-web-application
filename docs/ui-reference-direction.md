# Admin UI reference direction

Reviewed public sources on 15 November 2026. These are interaction/layout references, not copied brand assets. No authenticated Mobbin library or browser-based visual acceptance was accessed.

## References and adaptation

- [Stripe Dashboard basics](https://docs.stripe.com/dashboard/basics): separate transactions, balances and payouts; surface work requiring attention. RouteShare must keep collection, withdrawal approval and provider-confirmed payout distinct. Do not label an approval as a successful payment.
- [Linear filters](https://linear.app/docs/filters): compact focused lists and explicit applied criteria. Adapt the hierarchy and filter clarity, not the product-specific issue model. URL-persisted filters are a future improvement, not implemented by this styling pass.
- [shadcn dashboard and sidebar blocks](https://ui.shadcn.com/blocks): persistent sidebar, content header, consistent cards/table layout and responsive navigation. Retain existing components and dependencies rather than installing a second component system or copying sample dashboard data.

## RouteShare synthesis

- Moss-green navigation, lime selected item, neutral work surface; lime is emphasis, not a financial success indicator.
- Stable sections: review queues, operations, finance, system. Keep API coverage discoverable and do not bury limitations.
- Persistent desktop context header; accessible mobile drawer, 44px navigation targets and skip-to-content link.
- Readable Vietnamese table headers without forced uppercase; consistent spacing and keyboard focus.
- Preserve all empty/error/loading and demo/live distinctions. Backend mode is configuration, not proof of backend health.
- Future trip-detail timeline should use persisted journey evidence. No fabricated tracking, milestones, money or audit entries.

## Implemented in this pass

Shared shell navigation/header, active navigation styling, table header typography, focus and text rendering. Existing API contracts and provider actions are unchanged. Full dashboard/detail/financial redesign and browser/device visual acceptance remain pending.

## Motion and depth follow-up

User requested a livelier visual treatment. Added a branded dashboard hero with a decorative route illustration (not real tracking), one-shot route drawing, route-content entrance, staggered statistic cards, chart entrance and lightweight navigation/button/icon hover feedback. Shared cards now have subtle elevation and larger corners. All new animation is CSS-based, without a new dependency, infinite decorative loops, animated money or fabricated metrics. Reduced-motion preferences disable the added entrance/chart effects and hover transforms. Typecheck/lint passed; visual browser acceptance remains pending.
