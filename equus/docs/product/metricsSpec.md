# Metrics Spec — Internal Business Dashboard

Private metrics for founders. Not shown to normal users.

Sources: [`monetization.md`](monetization.md), [`go-to-market.md`](go-to-market.md), [`mvpScope.md`](mvpScope.md), `equus/docs/engineering/stack.md`.

---

## Dashboard purpose (weekly)

1. Are **stables** converting and staying **paid**?  
2. Are horses and relationships growing with real **ops** usage?  
3. Are **owners** using free Hub / chat / portal (not paying us)?  
4. Are waiting-transfers actually getting **claimed**?

---

## Metric definitions

### 1) Growth and inventory

| Metric | Definition |
|--------|------------|
| Total users | `count(users)` |
| Total stables | Stable profiles |
| Active stables | Stables with ops activity in period (writes or logins by operators/collab) |
| Stables in good standing | Free period, paid, or active promo |
| Write-locked stables | Lapsed past grace |
| Total horses | Horse profiles |
| Roster horses | Horses counting toward a stable meter (active host + waiting-transfer hosted) |
| Waiting-transfer horses | Flag true, unclaimed |
| Active horses | Accepted relationship + activity in period |

### 2) Revenue (entity SaaS)

| Metric | Definition |
|--------|------------|
| MRR | Sum of **entity** subscription amounts in good standing (paid), monthly equivalent |
| New MRR | MRR from newly paid stables in period |
| Churned MRR | Lost from cancel / fail / write-lock after grace |
| Net MRR | New − churned |
| ARPU (stable) | MRR / paying stables |
| Free-to-paid conversion | Stables that finish 30-day offer and pay / offers started |
| Custom vs catalog | Count of entities not on default catalog price |

**Do not** compute MRR from horses or $99.

### 3) Relationship funnel

| Metric | Definition |
|--------|------------|
| Relationship requests | Created in period |
| Acceptance rate | Accepted / (accepted + declined) |
| Barn-created horses | Path B creates |
| Invite emails | To non-registered |
| Invite signup rate | Signups from invites / invites sent |
| Waiting-transfer claim rate | Claims / waiting-transfer stock |
| Median days to claim | For claimed horses |

### 4) Owner (free) engagement

| Metric | Definition |
|--------|------------|
| Owners with ≥1 horse | |
| Hub views | Horse Hub opens |
| Portal views | Owner opened live barn slice |
| Portal blocked (lapse) | Owner hit missing live data because stable write-locked / not in good standing |
| Chat senders | Distinct users messaging |

No “paying horses” and no commission payout metrics at launch.

### 5) Workflow adoption

| Metric | Definition |
|--------|------------|
| Booking requests / accept / complete | As before |
| Invoices created | By stables |
| Invoice view rate | Owner views / invoices |
| Chat messages / median first reply | |
| Activity logs | Care/task completions on roster horses |

### 6) Retention and quality

| Metric | Definition |
|--------|------------|
| Stable paid churn | Paying stables canceled or locked / paying at start |
| Stable weekly retention | Active ops this week and last |
| Owner weekly retention | Owners active (Hub/chat/portal) consecutive weeks |
| Review rate | Reviews / eligible relationships |
| Failed entity charges | Failed / attempts |
| Roster vs billed band | Drift: roster size vs catalog band (custom prices excluded or flagged) |

---

## Panels

**A — Revenue:** MRR, paying stables, free-period stables, free-to-paid, net MRR, write-locked count  

**B — Graph:** invites, accept rate, waiting-transfer stock, claim rate  

**C — Ops:** active stables, roster horses, bookings, invoices, chat  

**D — Owners:** Hub views, portal views, portal-blocked, owner retention  

---

## Cadence

| Group | Cadence |
|-------|---------|
| Revenue | Daily |
| Graph / ops / owners | Weekly |
| Churn | Weekly |

---

## Implementation

**1A:** Event log in MongoDB; manual or simple internal page.  
**1B:** Private `/admin/metrics`, role-restricted.

### Events (minimum)

`user_signed_up` · `horse_created` · `horse_created_by_stable` · `waiting_transfer_nag_sent` · `ownership_claimed` · `relationship_requested` · `relationship_accepted` · `relationship_declined` · `invite_sent` · `invite_signup` · `entity_trial_started` · `entity_subscription_paid` · `entity_subscription_failed` · `entity_write_locked` · `entity_promo_attached` · `booking_*` · `invoice_created` · `message_sent` · `review_submitted` · `favorite_added` · `hub_viewed` · `portal_viewed` · `portal_blocked`

Each event: `timestamp`, `actor_user_id`, `horse_id?`, `entity_id?`, `entity_type?`.

---

## North-star (first 90 days post-pilot, directional)

| Metric | Early target |
|--------|----------------|
| Paying stables (Spain) | 5+ |
| Free-to-paid | 25%+ of finished 30-day offers |
| Relationship accept rate | 60%+ |
| Waiting-transfer claim rate | 50%+ of barn-created horses within 30 days |
| Active stables weekly | 8+ |
| Owners opening Hub weekly (on hosted horses) | Rising with roster |

---

## Related

[`businessPlan.md`](businessPlan.md) · [`monetization.md`](monetization.md) · [`mvpScope.md`](mvpScope.md) · [`validationPlaybook.md`](validationPlaybook.md)
