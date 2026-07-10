# Task 1 Report: Update documentation

**Completed:** 2026-07-10

## Files changed

| File | Action |
|------|--------|
| `documentation/businessPlan.md` | Modified — Section 11 updated with tier model |
| `equus/documentation/billing.md` | Created — full implementation guide |

## Summary

**businessPlan.md Section 11:** Replaced the old per-horse $99 model with a 5-tier subscription model (Free/Bronze/Silver/Gold/Diamond). Added tier table with horse limits and monthly price ranges per market. Added region-based pricing note and subscription enforcement rules (horse limit guards, payment gating). Kept existing subsections for free business usage, 30-day trial, and referral incentives.

**billing.md:** Created implementation guide covering architecture overview (4 layers), tier config reference (plans.ts structure, prices, helpers), Stripe setup guide (products, prices, webhook events, env vars), discount system, admin operations (DB commands for discounts/tier changes/force cancel), webhook event reference table, payment gating state machine, and FAQ/troubleshooting.
