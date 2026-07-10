### Task 1: Update documentation

**Files:**
- Modify: `documentation/businessPlan.md` (Section 11 — monetization)
- Create: `documentation/billing.md`

Content for businessPlan.md Section 11 update:
- Replace "$99/horse/month" text with the new tier model
- Add tier table: Free (1 horse, $0), Bronze (3 horses, $89-$119 p/m depending on currency), Silver (5 horses, $149-$199), Gold (8 horses, $219-$299), Diamond (unlimited, $329-$439)
- Add "region-based pricing" note (prices per market, not exchange rate)
- Keep: 30-day trial, business accounts free, referral commissions
- Add: subscription enforcement rules (horse limit, popup upgrade flow)

Content for billing.md:
- Architecture overview (layers: config → service → enforcement → UI)
- Tier config reference (how to add/edit plans and prices in lib/billing/plans.ts)
- Stripe setup guide (products, prices, webhooks, env vars needed)
- Discount system (how to apply per-user discounts via DB)
- Admin operations reference (DB commands for discounts, manual tier changes — future admin page)
- Webhook event reference (which Stripe events update what on User model)
- Payment gating overview
- FAQ / troubleshooting
