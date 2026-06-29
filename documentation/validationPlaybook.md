# Validation Playbook — Pre-Build Customer Discovery

Run this playbook **before** starting Phase 1A development (`mvpScope.md`).

Sources:
- `businessPlan.md` — Section 18 (Phases 3 and 4)
- `stack.md` — build only after validation passes

---

## Objective

Validate that the pain is real, workflows are painful enough, and horse owners/businesses will pay for the wedge:

**Stable/trainer operations + owner visibility (expenses, communication, control, paperwork).**

---

## Interview targets

| Segment | Target count |
|---------|--------------|
| Stable owners / managers | 10 |
| Trainers | 10 |
| Horse owners | 10 |
| **Total** | **30** |

Optional stretch: 5 vets (signals vet module priority for production gate — not required for Phase 1A go/no-go).

---

## Recruitment tips

- Local stables and training centers
- Riding clubs and competition communities
- Vet referrals (relationship context)
- Personal network + direct outreach (not surveys)

Ask candidates to show real artifacts:
- Spreadsheets
- WhatsApp groups
- Invoices
- Schedules
- Horse records

---

## Interview script

### Intro (2 min)

> “I’m researching how stables/trainers/owners manage horses today. This is not a sales call. I want to understand your real workflow and pain points.”

### Core questions (required)

**Q1 — Current tools**
“What software or tools do you use today to manage horses, owners, schedules, and payments?”

Probe:
- Excel/Google Sheets?
- WhatsApp/Telegram?
- Paper notebooks?
- Other apps/vendors?

**Q2 — Biggest pain**
“What is the most annoying or time-consuming part of managing horses in your day-to-day work?”

Probe:
- Communication chaos?
- Missing records?
- Invoice confusion?
- Scheduling conflicts?

**Q3 — Magic wand**
“If you could fix one thing tomorrow, what would it be?”

(Let them speak without steering.)

**Q4 — Current spend**
“What do you currently pay for related to horse management (software, admin help, tools)?”

(Gold signal: they already pay for partial solutions.)

**Q5 — Workflow walkthrough**
“Can you show me how you handle one real case end-to-end?”

Examples:
- New horse arrives at stable
- Monthly owner invoice
- Training session update to owner
- Vet visit record sharing

**Q6 — Willingness to pay (critical)**
“If a platform replaced your scattered tools and gave owners one clear dashboard for expenses, communication, schedules, and records, would you pay **$99/month per horse** as the owner?”

Rules:
- Ask clearly
- Then stop talking
- Do not pitch features
- Listen to exact words

**Q7 — Business adoption (for stables/trainers)**
“If the platform was free for your business and helped you manage operations while owners paid per horse, would you use it and invite your clients?”

---

## Scoring model

Score each interview section from **0 to 2**.

| Score | Meaning |
|-------|---------|
| 0 | No pain / not relevant |
| 1 | Some pain, unclear urgency |
| 2 | Strong pain, active workaround, high urgency |

### Scoring rubric

| Area | 0 | 1 | 2 |
|------|---|---|---|
| Pain severity | Minor annoyance | Regular friction | Major daily friction |
| Current tool fragmentation | Single adequate tool | 2–3 tools | WhatsApp+Excel+manual chaos |
| Existing spend | Pays nothing | Pays small amount | Already pays for partial solutions |
| Willingness to pay ($99/horse) | No / vague | “Maybe” / “depends” | Clear yes (“absolutely”, “we’d pay”) |
| Business invite likelihood | Would not invite owners | Might invite some | Would actively invite clients |

### Response interpretation (Q6)

| Owner response | Score |
|----------------|-------|
| “Absolutely” / “Yes, if it works” | 2 |
| “Maybe” / “Interesting” / “I’d try it” | 0 |
| No answer / avoids pricing | 0 |

> “Maybe” is usually a polite no. Do not count it as validation.

---

## Per-interview sheet (template)

```
Date:
Segment: [Stable / Trainer / Owner]
Name/Role:
Location:

Q1 Tools:
Q2 Pain:
Q3 Magic wand:
Q4 Current spend:
Q5 Workflow notes:
Q6 WTP ($99/horse): [0/1/2]
Q7 Business invite likelihood: [0/1/2]

Pain severity [0-2]:
Fragmentation [0-2]:
Existing spend [0-2]:
WTP [0-2]:
Invite likelihood [0-2] (if business):

Total score (/10):
Key quote:
Follow-up?
```

---

## Aggregate decision criteria

### Go (start Phase 1A build)

Meet all:
- At least **20 interviews** completed (minimum 6 per core segment)
- At least **12 total “clear yes”** responses on $99/horse WTP (score 2 on Q6)
- At least **8 business interviews** with invite likelihood score 2
- Repeated pain themes appear in **≥60%** of interviews (communication, invoices, visibility, records)

### Iterate (refine positioning/scope)

If:
- Many “maybe” responses
- Pain exists but price resistance is high
- Businesses like idea but won’t invite owners

Actions:
- Adjust MVP scope (`mvpScope.md`)
- Test lower price hypothesis in next 10 interviews
- Narrow wedge (stable-first or trainer-first)

### No-go (pause build)

If:
- Low pain across segments
- No willingness to pay
- No operational urgency

---

## What we are validating (and not validating)

### Validating now
- Stable/trainer/owner operational pain
- Willingness to pay per horse
- Business willingness to invite owners
- Workflow fit for Phase 1A scope

### Not validating yet
- Marketplace demand
- Breeder/vet module depth
- Social feature demand
- Full ecosystem completeness

---

## Post-validation outputs

After interviews, produce:
1. Top 5 recurring pains (ranked)
2. Final Phase 1A must-have list adjustments
3. Pricing confidence note ($99 confirmed or revised)
4. First 3 pilot customers list (stable/trainer/owner triads)

---

## Success quote targets

You want to hear statements like:
- “I lose track of what I billed each owner.”
- “Owners constantly message me on WhatsApp for updates.”
- “I’d pay for one place to see all horse costs.”
- “If my stable used it, I’d join tomorrow.”

If you mostly hear:
- “Sounds cool”
- “Maybe later”
- “We’re fine with WhatsApp”

…iterate before building.
