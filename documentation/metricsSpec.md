# Metrics Spec — Internal Business Dashboard

Private metrics layer for founders/developers to monitor product and business health.

Source:
- `businessPlan.md` — Section 18 (Phase 9)
- `businessPlan.md` — Section 11 and Section 19 (monetization and commissions)

Access policy:
- **Internal/private only** (developer/admin role)
- Not visible to normal app users

---

## Dashboard purpose

Answer four questions weekly:
1. Are horses and relationships growing with real usage?
2. Are owners converting and staying paid?
3. Are businesses driving referrals that convert?
4. Are core workflows (booking, chat, invoices) actually used?

---

## Metric definitions

### 1) Growth and inventory

| Metric | Definition | Formula |
|--------|------------|---------|
| Total users | Registered user accounts | `count(users)` |
| Active businesses | Stable + trainer accounts with activity in period | `count(business_accounts where last_active_at in period)` |
| Total horses | Horse profiles created | `count(horses)` |
| Active horses | Horses with at least one accepted relationship and one event in period | `count(horses where active_relationship=true and last_activity_at in period)` |
| Paying horses | Horses with active paid subscription status | `count(horses where subscription_status='active_paid')` |
| Trial horses | Horses in trial window | `count(horses where subscription_status='trial')` |

### 2) Revenue

| Metric | Definition | Formula |
|--------|------------|---------|
| MRR | Monthly recurring revenue from horse subscriptions | `sum(active_paid_horse_subscriptions * 99)` |
| New MRR | MRR added in period from new paying horses | `sum(new paid horses in period * 99)` |
| Churned MRR | MRR lost in period from canceled/failed subscriptions | `sum(churned horses in period * 99)` |
| Net MRR change | New MRR - Churned MRR | `new_mrr - churned_mrr` |
| ARPU (horse) | Average revenue per paying horse | `MRR / paying_horses` |
| Trial-to-paid conversion rate | % trial horses that become paid | `paid_from_trial / trial_started` |

### 3) Relationship funnel

| Metric | Definition | Formula |
|--------|------------|---------|
| Relationship requests sent | New relationship proposals created | `count(relationship_requests created in period)` |
| Relationship acceptance rate | Accepted / (accepted + declined) | `accepted / (accepted + declined)` |
| Invitation emails sent | Invites to non-registered users | `count(invites sent in period)` |
| Invite signup rate | Invited users who created account | `invite_signups / invites_sent` |
| Invite accept rate | Signed-up invitees who accepted relationship | `invite_accepts / invite_signups` |

### 4) Referral and commission (Section 19)

| Metric | Definition | Formula |
|--------|------------|---------|
| Attributed signups | Owner signups with first-used referral reference | `count(signups with attribution_source)` |
| Attributed paying horses | Paying horses with attribution source | `count(paying horses with attribution_source)` |
| Commission eligible businesses | Businesses meeting active threshold | `count(businesses where active_threshold_met=true)` |
| Commission payout (month) | Total partner commission for period | `sum(paid_subscription_revenue * 0.10 for eligible attributed horses in first 12 paid months)` |
| Commission per business | Payout by attributed business account | `group by attribution_business` |

Commission rules reflected in metrics:
- 10% only during first 12 paid months
- Only on successful paid bills
- Only for active businesses

### 5) Workflow adoption

| Metric | Definition | Formula |
|--------|------------|---------|
| Booking requests | New booking requests created | `count(booking_requests created in period)` |
| Booking acceptance rate | Accepted bookings / total booking requests | `accepted / total` |
| Booking completion rate | Completed bookings / accepted bookings | `completed / accepted` |
| Invoices created | Invoices issued by businesses | `count(invoices created in period)` |
| Invoice view rate | Owner views of invoices | `invoice_views / invoices_created` |
| Chat messages sent | Total messages in period | `count(messages in period)` |
| Active chat users | Users sending at least one message in period | `count(distinct message_authors in period)` |
| Median response time | Median time to first reply in chat threads | `median(first_reply_at - message_sent_at)` |

### 6) Retention and quality

| Metric | Definition | Formula |
|--------|------------|---------|
| Horse churn rate | Paying horses canceled in period / paying horses at start | `churned_paying_horses / paying_horses_start` |
| Business weekly retention | Businesses active this week and previous week | `retained_businesses / active_businesses_prev_week` |
| Owner weekly retention | Owners active in consecutive weeks | `retained_owners / active_owners_prev_week` |
| Review submission rate | Reviews submitted / eligible verified relationships | `reviews / eligible_relationships` |
| Failed payment rate | Failed subscription charges / charge attempts | `failed_charges / charge_attempts` |

---

## Core dashboard panels

### Panel A — Revenue snapshot
- MRR
- Paying horses
- Trial horses
- Trial-to-paid conversion
- Net MRR change

### Panel B — Growth loop
- Invites sent
- Invite signup rate
- Attributed paying horses
- Commission payout (month)

### Panel C — Operations health
- Active horses
- Booking acceptance rate
- Invoices created
- Chat active users
- Median response time

### Panel D — Relationship trust
- Relationship requests
- Acceptance rate
- Review submission rate
- Failed payment rate

---

## Suggested refresh cadence

| Metric group | Cadence |
|--------------|---------|
| Revenue snapshot | Daily |
| Growth loop | Weekly |
| Operations health | Weekly |
| Retention/churn | Weekly |
| Relationship trust | Weekly |

---

## MVP implementation note (Phase 1B)

Phase 1A:
- Track events in database tables (minimal analytics schema)
- Manual SQL or simple admin page acceptable

Phase 1B:
- Private `/admin/metrics` dashboard
- Read-only aggregates
- Role-restricted access (developer/admin)

---

## Event tracking minimum (for engineering)

Log these events from day one:
- `user_signed_up`
- `horse_created`
- `relationship_requested`
- `relationship_accepted`
- `relationship_declined`
- `invite_sent`
- `invite_signup`
- `trial_started`
- `subscription_paid`
- `subscription_failed`
- `subscription_canceled`
- `booking_requested`
- `booking_accepted`
- `booking_declined`
- `invoice_created`
- `message_sent`
- `review_submitted`
- `referral_attributed`

Each event should include:
- `timestamp`
- `actor_user_id`
- `horse_id` (if applicable)
- `business_account_id` (if applicable)
- `referral_reference` (if applicable)

---

## North-star targets (initial)

Use as directional targets after first pilot (adjust with real data):

| Metric | Early target (first 90 days post-pilot) |
|--------|----------------------------------------|
| Paying horses | 20+ |
| Trial-to-paid conversion | 25%+ |
| Relationship acceptance rate | 60%+ |
| Booking acceptance rate | 50%+ |
| Active businesses (weekly) | 10+ |
| Attributed paying horses | 30%+ of new paying horses |

---

## Related documents

- `businessPlan.md` — strategy and monetization
- `mvpScope.md` — what to instrument first
- `validationPlaybook.md` — pre-build validation metrics
