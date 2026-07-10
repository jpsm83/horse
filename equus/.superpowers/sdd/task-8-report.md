# Task 8: Create billing API routes

## Files created

| Route | File | Status |
|-------|------|--------|
| `POST /api/v1/billing/create-checkout` | `app/api/v1/billing/create-checkout/route.ts` | ✅ Created |
| `POST /api/v1/billing/portal` | `app/api/v1/billing/portal/route.ts` | ✅ Created |
| `POST /api/v1/billing/webhook` | `app/api/v1/billing/webhook/route.ts` | ✅ Created |
| `GET /api/v1/billing/current` | `app/api/v1/billing/current/route.ts` | ✅ Created |

## Implementation details

All routes follow the project conventions:
- `withRoute` wrapping for consistent error handling
- `connectDb()` before database access
- `requireAuthFromRequest(request)` for auth (except webhook — Stripe signature)
- `ok(data)` / `NextResponse` for responses

### Webhook route
Uses `stripe.webhooks.constructEvent()` to verify the Stripe signature before importing and calling `handleSubscriptionWebhook(event)`. Returns `NextResponse("OK", { status: 200 })` to satisfy `withRoute`'s `NextResponse` return type.

### Key differences from initial brief
- Webhook route uses `NextResponse` instead of `Response` to match `withRoute`'s return type
- Webhook constructs the Stripe event inline before passing it to `handleSubscriptionWebhook` (which accepts `Stripe.Event`, not raw body + signature)

## Compilation
`npx tsc --noEmit` passes — no errors from billing routes (pre-existing test errors unrelated).

## Commit
`0a2f6f3` — Task 8: Create 4 billing API routes
