# Equestrian Market Competitive Benchmark

> **Purpose:** Detailed competitive intelligence on horse-related websites/apps to inform the design and positioning of our own product.  
> **Scope:** 12 competitors — 11 consumer/federation/marketplace sites plus **EquineM** (primary stable-ERP parity baseline for Equus).  
> **Research date:** July 2026  
> **Method:** Official websites, app stores, pricing pages, FAQs, press, and public documentation.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Market Segmentation Map](#market-segmentation-map)
3. [Competitor Profiles](#competitor-profiles)
   - [1. British Horse Society (BHS)](#1-british-horse-society-bhs)
   - [2. ehorses](#2-ehorses)
   - [3. British Horseracing Authority (BHA)](#3-british-horseracing-authority-bha)
   - [4. FEI HorseApp](#4-fei-horseapp)
   - [5. My Cheval](#5-my-cheval)
   - [6. Equilab](#6-equilab)
   - [7. The Equestrian App](#7-the-equestrian-app)
   - [8. Ridely](#8-ridely)
   - [9. HippoVibe](#9-hippovibe)
   - [10. Happie Horse / Happie Animals](#10-happie-horse--happie-animals)
   - [11. Equicty](#11-equicty)
   - [12. EquineM](#12-equinem)
4. [Feature Matrix (Cross-Competitor)](#feature-matrix-cross-competitor)
5. [Pricing Comparison](#pricing-comparison)
6. [Strategic Gaps & Opportunities for Our App](#strategic-gaps--opportunities-for-our-app)

---

## Executive Summary

The 12 products in this benchmark fall into **distinct categories**, not one homogeneous "horse app" market:

| Category | Products | Core job-to-be-done |
|----------|----------|---------------------|
| **Membership & advocacy org** | BHS | Trust, insurance, education, welfare, access rights |
| **Marketplace / classifieds** | ehorses | Buy/sell horses, tack, property, jobs |
| **Racing regulator & admin** | BHA | Mandatory ownership, entries, compliance for GB racing |
| **Federation compliance** | FEI HorseApp | Mandatory FEI event health/biosecurity |
| **Owner CRM (consumer)** | My Cheval, Happie Horse, Equestrian App | Daily horse life: health, calendar, expenses, records |
| **Ride tracking & social** | Equilab, My Cheval (partial) | GPS rides, gait AI, safety sharing, community |
| **Training / edtech** | Ridely | Expert video curriculum, AI coach, welfare education |
| **Pro-yard / business SaaS** | **EquineM**, HippoVibe, Equicty, Equestrian App (StallPros) | Multi-user stable ops, tasks, billing, breeding, facilities |

**Key insight for our product:** No single competitor covers the full lifecycle of a horse owner — from acquisition → daily care → training → competition → sale/retirement — in one cohesive, modern experience. The closest "all-in-one owner" shapes are **My Cheval**, **Happie Horse**, and **The Equestrian App**, but each has significant gaps. The closest "pro stable ERP" shapes are **EquineM** (Equus's primary stable-ops parity baseline), **Equicty**, and **HippoVibe**. **Equilab** and **Ridely** own rider training/safety/education. **BHS**, **ehorses**, **BHA**, and **FEI HorseApp** are adjacent ecosystem players, not direct SaaS competitors — but they define trust, acquisition moments, and compliance layers we must integrate with or exceed.

**EquineM-specific insight:** EquineM is a **stable-organization ERP** — the stable admin pays, owns the tenant, and adds owners/vets as contacts inside one org. Equus is a **connected horse ecosystem** — the horse is central, actors link by consent, businesses use the platform free, and owners pay for the unified horse hub. Stable feature parity targets EquineM; ecosystem features go beyond it (see `equus/docs/features/stableModule.md`, `equus/docs/product/businessPlan.md` §20).

---

## Market Segmentation Map

```
                    CONSUMER / OWNER                          BUSINESS / YARD
                         │                                          │
    COMPLIANCE ──────────┼── FEI HorseApp                           │
                         │   BHA (racing only)                      │
                         │                                          │
    COMMUNITY/TRUST ─────┼── BHS                                    │
                         │                                          │
    MARKETPLACE ─────────┼── ehorses                                │
                         │                                          │
    DAILY CRM ───────────┼── My Cheval ─── Happie Horse              │
                         │   Equestrian App                         │
                         │                                          │
    RIDE / TRAINING ─────┼── Equilab ─── Ridely                      │
                         │   (My Cheval ride module)                │
                         │                                          │
    PRO STABLE OPS ──────┼──────────────────────────────────────────┼── EquineM (parity baseline)
                         │                                          │   HippoVibe
                         │                                          │   Equicty
                         │                                          │   Equestrian App (StallPros)
```

---

## Competitor Profiles

---

### 1. British Horse Society (BHS)

| Field | Detail |
|-------|--------|
| **URL** | https://www.bhs.org.uk/ |
| **Organization** | The British Horse Society — registered charity (England & Wales 210504; Scotland SC038516) |
| **HQ** | Abbey Park, Stareton, Kenilworth, Warwickshire CV8 2XZ, UK |
| **Founded** | 1947 |
| **Type** | Nonprofit membership organisation — **not** a horse management SaaS |

#### Positioning
UK's largest equestrian charity. Tagline: *"For horses. For people. For life."* Serves welfare, safety, bridleway access, education, qualifications, and community — with bundled insurance for members.

#### Target audience
- UK recreational riders and horse owners ("happy hackers")
- Families and junior riders (Gold Junior, Gold Family tiers)
- Carriage drivers
- Career seekers: grooms, coaches, ride leaders
- Accredited Professional Coaches (APCs) and Approved Centres
- Welfare reporters and volunteers
- International members (Silver/International tier without UK insurance)
- **Geography:** Primarily UK; Approved Centres also listed internationally

#### Complete feature inventory

**Membership & insurance**
- Membership tiers: Friend, Gold Family, Gold Adult, Gold Junior, Silver, International
- Public Liability insurance up to £30m (Gold/Friend with insurance)
- Personal Accident insurance up to £10k
- Digital membership cards
- Gift Aid on membership donations
- Free will service (most UK tiers)
- Optional extra charitable donation (Friend tier)
- Monthly payment options

**Legal & commercial support**
- 24/7 legal helpline (equestrian and personal matters)
- Horse sale agreement service
- VAT and tax guidance for horse owners

**Education & professional qualifications**
- BHS Stages 1–4, BHSI, Fellowship pathways
- Career pathways: Groom, Groom with Riding, Ride Leader, Coaching
- Modular units: Care, Ride, Lunge, Riding Out, Ride Dressage/Jump, Management, Coaching (incl. Coaching4All), BHSI Stable/Business Management, Working from the Ground
- Direct entry for experienced candidates
- Skills Record sign-off via APC / Approved Centre
- Assessment booking and waitlists
- Ride Safe Silver Challenge Award (Highway Code–recognised)

**Recreational Challenge Awards** (no membership required to participate)
- Introduction to horse care / riding
- Horse Knowledge (parts 1–2)
- First Pony Guide
- Caring for your horse
- Horse health
- Breeding (3-part series)
- Riding fit / flat / jump
- Mounted games
- Knowing / Handling / Lungeing your horse
- Ride Safe Award

**Approved Centres directory**
- Find riding schools, livery yards, trekking centres, assessment facilities, retraining centres, Changing Lives centres, BRC centres, pony parties, equine activity centres, Horses Welcome yards, Registered Livery yards (~497+ listed)
- Annual unannounced inspections; PL insurance and H&S compliance requirements

**Accredited Professional Coach (APC) programme**
- Professional register
- Membership with/without insurance packages
- CPD, safeguarding, first aid options
- Rights to deliver Challenge Awards
- Includes BHS Gold membership benefits

**Horse care & welfare**
- Advice library (care, buying/loaning, health topics)
- Confidential welfare concern reporting
- Welfare volunteer network
- Campaigns: Be Horse Aware; REACT Now to Beat Colic; Healthcare & Education Clinics
- Friends at the End (bereavement support)
- Seasonal care advice (hot weather, etc.)

**Horse passports**
- New, replacement, duplicate passports
- Ownership/address/name change services
- Overstamping foreign passports
- Passport office processing

**Safety**
- Dead Slow road safety campaign (influenced UK Highway Code)
- **Horse i app** + online incident hub (road incidents, near-misses, dog attacks)
- Riding on roads / transporting / what-to-wear guidance
- Henry the Horse school awareness resource
- Safety volunteering programme

**Access & rights of way**
- Bridleway advocacy and extension
- National Bridleroute Network
- Planning/legislation lobbying
- Claim: 250 km off-road routes improved (2024)

**British Riding Clubs (BRC)**
- ~28,000 members; ~440+ affiliated clubs
- Training, social events, area and national competitions
- Championships: Arena Eventing, Winter Show Jumping, Winter Dressage & DTM, Combined, Horse Trials, NAF Five Star Nationals, Club Jumping Series
- BRC membership platform; incident/accident forms; downloads and policies

**Participation & social impact**
- Changing Lives Through Horses (ages 5–25; exclusion/SEND/NEET focus)
- Volunteer programme
- Donations and fundraising
- Bookshop and merchandise
- *British Horse* magazine subscription (Silver+)
- E-newsletter; free/discounted event tickets
- Jobs board / careers with BHS
- Hall of Fame

**Community & content**
- News, campaigns, advice articles
- Local events via membership and volunteers

#### Platforms
- **Web:** Primary (bhs.org.uk)
- **Mobile:** Horse i incident-reporting app (iOS/Android)
- **Not:** A full horse-management mobile product; membership managed via web + digital cards

#### Pricing (GBP, annual unless noted)

| Tier | Price | Insurance | Key notes |
|------|-------|-----------|-----------|
| Friend | £216* | Yes (£30m PL / £10k PA) | Includes optional extra donation |
| Gold Family | £200*+ | Yes | From £16.66/mo for 2; +£5.91/mo per extra member; same address |
| Gold Adult | £108* / ~£9/mo | Yes | |
| Gold Junior | £93* / ~£7.75/mo | Yes | |
| Silver | £56 | No | Magazine, events, e-news, will service |
| International | £55 | No | No free will service |

\*Includes Insurance Premium Tax. 12-month term; limited refunds after cooling-off.

**APC membership:** ~£28–£42/month depending on insurance package (~£341–£502/year range; confirm live page).

**Horse passport fees (Jan 2025):**
- New/replacement: £27.50 (£17.50 charities)
- Duplicate: £30 (£15 charities)
- Ownership change: £17.50 (£14.50 charities)
- Address/name change: £12.50
- Overstamp foreign passport: £22.50 (£17.50 charities)
- FastTrack: £52.50

Challenge Award course fees set by individual coaches/centres.

#### Business model
Charitable membership dues + insurance premium arrangement (via Howden Insurance Brokers) + education/assessment fees + passport fees + centre approval fees + donations + merchandise.

#### Integrations & partners
- Howden Insurance Brokers (membership insurance)
- DVSA, DfT, Cycling UK, Living Streets (Highway Code / Dead Slow)
- British Equestrian Federation
- Police / road safety partnerships
- RSPCA and other welfare organisations
- BRC championship sponsors (TopSpec, Horslyx, Equetech, NAF, SEIB, etc.)

#### Strengths
- Unmatched trust and brand authority in UK equestrianism
- Bundled PL/PA insurance is a strong conversion hook
- Deep education ecosystem (Stages + Challenge Awards + Ride Safe)
- National safety data moat via Horse i
- Approved Centres discovery with quality signal
- ~140,000 members

#### Gaps vs a full horse-owner management app
- No daily horse records (feed, meds, shoeing, worming calendars)
- No multi-horse yard ops, billing, or staff rostering
- No horse marketplace as core product
- No training/competition calendar sync as owner SaaS
- Fragmented digital products (content site + Horse i + BRC platform), not one owner OS

#### Key URLs
- https://www.bhs.org.uk/membership/
- https://www.bhs.org.uk/membership/membership-benefits/
- https://www.bhs.org.uk/horse-care-and-welfare/horse-passports/horse-passport-prices/
- https://www.bhs.org.uk/go-riding-and-learn/find-a-riding-centre-or-livery-yard/
- https://www.bhs.org.uk/bhs-professional-qualifications-and-careers/bhs-qualifications-and-stages/
- https://www.bhs.org.uk/british-riding-clubs/

---

### 2. ehorses

| Field | Detail |
|-------|--------|
| **URL** | https://www.ehorses.com/ (also .de, .co.uk, .ch, etc.) |
| **Organization** | ehorses GmbH & Co. KG — commercial for-profit |
| **HQ** | Rittergut Osthoff 5, 49124 Georgsmarienhütte, Germany |
| **Founded** | 1999 |
| **Type** | Online horse marketplace / classifieds — **not** a management app |

#### Positioning
*"World's biggest online horse market."* Cross-border classifieds for horses and adjacent equine verticals. Commission-free on completed sales.

#### Target audience
- Private horse sellers and buyers (leisure through high-performance sport)
- Professional breeders, studs, dealers, training stables
- Riding-share seekers
- Equestrian real estate buyers
- Equine sector job seekers and employers
- **Geography:** International; strong EU/Germany base; US listings present
- **Languages:** EN, DE, FR, NL, ES, IT, SV, PL

#### Complete feature inventory

**Marketplace categories**
- Horses for sale
- Ponies
- Foals
- Stallions at stud (stud fee model)
- Lease listings
- Riding shares (horse looking for rider / rider looking for horse)
- General classifieds (tack, stable equipment, training, holidays, other animals)
- Real estate (equestrian properties)
- Agricultural machines
- Vehicles / carriages
- Jobs
- Third-party auction listings ("bid on auction")

**Buyer tools**
- Advanced search: breed, age, height, colour, type, discipline, price, location, etc.
- Sorting options
- Saved search / email alerts (search orders)
- Watch list / wishlist
- Ad ID lookup
- Rich listings: photos, videos, pedigree, training level, characteristics
- Map location
- Contact form + conversation history + phone display
- Share ads (WhatsApp, Facebook, Twitter/X, email)
- Buyer "request" / wanted ads (visible to Premium sellers)
- Report suspicious ads
- Fraud guidance content

**Seller tools**
- 6-step listing wizard (login → data → media → options → review → publish)
- Up to **20 images + 4 videos** free per listing
- Image editing (rotate, crop, reorder)
- YouTube embed or file upload (up to 20 GB; common formats)
- Pause / edit / delete / renew ads
- Print preview
- Placement service (ehorses builds the ad for you)
- Listing upgrade tiers: Bronze / Silver / Gold / Platinum
  - Bronze: 2× visibility + image preview
  - Silver: + eyecatcher badge
  - Gold: + page-1 placement
  - Platinum: + social boost + homepage feature
- Mark as NEW badge
- Extensions beyond base duration
- **Premium seller subscription:** unlimited ads, unlimited duration, price-on-request, premium ribbon, international multi-language sites, data import, seller homepage/SEO, custom contact forms, statistics, newsletter placement, no third-party suggestions under ads
- **Premium PLUS:** social posts, 10× "Today New"/month, free setting service, homepage ads, ad-free listings

**Account & billing**
- Register/login; personal data; payment data; invoices
- SEPA direct debit, credit card, PayPal
- Free Premium trial
- Account deactivation

**Trust & support**
- Daily listing review / anti-fraud messaging
- FAQ / Help centre
- Phone, email, WhatsApp, chat support
- Mon–Fri service hours

**Content / growth**
- ehorses Magazine (guides, product tests, about, FAQ)
- Social: Instagram 120k+ / Facebook 94k+ (Premium claims 200k+ fans; newsletter 171k+)
- Media kit for banner & newsletter advertising (B2B)

**Mobile app features** (mirrors web)
- Search horses, stallions, riding shares
- Filters, map, watchlist, share, contact seller/support
- Magazine content in app

#### Platforms
- **Web** (responsive; primary)
- **iOS:** ehorses app (iOS 15.6+; EN/DE/NL/FR/IT/PL/ES)
- **Android:** `de.ehorses.app` — 4.4★, ~1.18K reviews, 100K+ downloads

#### Pricing

**Free tier**
- **2 horse listings free per 12 months**
- Base duration: 90 days
- From 3rd listing: ~£20.88 / ~€24.99 per listing
- **No sales commission** (buyer or seller)

**UK listing upgrades (horses)**

| Upgrade | Price (GBP) | Benefit |
|---------|-------------|---------|
| Bronze | £8.35 | 2× visibility + image preview |
| Silver | £24.23 | + eyecatcher |
| Gold | £58.49 | + page-1 placement |
| Platinum | £83.56 | + social boost + homepage |
| Extension | £16.70 | +90 days |
| Mark as NEW | £8.35 | Fresh badge |

**UK Premium subscriptions (12-month, -45%)**
- Premium: ~£52/month
- Premium PLUS: ~£87/month

**Euro Premium**
- Premium Classic: €109.99/mo flexible or €59.98/mo on 12-month
- Premium Plus: €139.99/mo or €99.98/mo on 12-month
- Professional Lite/Classic/Plus: €44.98–€139.99/mo

**Other**
- Classifieds (non-horse): up to 30 free, then €1.99 each
- Renew expired listing: €14.99
- Placement service: €19.99
- B2B advertising: custom pricing

#### Business model
Freemium marketplace: free discovery + paid visibility/boosts + seller subscriptions + optional services + on-platform advertising. Monetises attention and liquidity, not transaction take-rate.

#### Strengths
- Scale: ~17.5k–19k live horse ads; 16M+ page impressions/mo; 4.7M+ visits; 1.7M+ uniques
- "Every 18 minutes a horse marked sold"; 30k horses/year to new owners; 400k+ sellers claim
- International multi-language reach
- Mature seller tooling (Premium homepage, import, stats)
- Strong mobile apps; commission-free positioning

#### Gaps vs horse-owner management app
- Zero post-purchase care tooling
- No vet/farrier logs, vaccination tracking, costs, yard management
- Transactions happen off-platform (fraud risk; sold-not-removed listings)
- No community/education ecosystem comparable to BHS

#### Key URLs
- https://www.ehorses.com/magazine/about-ehorses/
- https://www.ehorses.com/magazine/ehorses-faq/
- https://info.ehorses.de/prices/prices-uk
- https://www.ehorses.co.uk/premium/subs

---

### 3. British Horseracing Authority (BHA)

| Field | Detail |
|-------|--------|
| **URL** | https://www.britishhorseracing.com/ |
| **Related** | https://www.racingadmin.co.uk/ · https://www.racingdigital.co.uk/ · https://www.careersinracing.com/ · https://horsepwr.co.uk/ |
| **Organization** | British Horseracing Authority — private company limited by guarantee (Co. 02813358) |
| **HQ** | Holborn Gate, 26 Southampton Buildings, London WC2A 1AN, UK |
| **Founded** | 2007 (merger of British Horseracing Board + Horseracing Regulatory Authority) |
| **Type** | Governing & regulatory authority — **not** a consumer horse app |

#### Positioning
Official regulator and administrator of British horseracing: fixtures, rules, licensing, ownership, welfare, integrity.

#### Target audience
- Registered racehorse owners (~14,000 GB), partnerships, syndicates, racing clubs
- Licensed trainers, jockeys, amateur riders, agents, valets, stable staff
- Racecourses and raceday officials
- Breeders/studs (company ownership)
- Racing fans seeking fixtures/results
- **Geography:** Great Britain (England, Scotland, Wales)

#### Complete feature inventory

**Public website (britishhorseracing.com)**
- News, press releases, blogs, video, BHA Podcast
- Find fixtures (filters: evening, weekend, major, Ladies Day, music, family; date ranges)
- Racecards / entries / declarations / tracking / abandoned races
- Fixture results; going/weather/watering histories
- Full-year fixture lists (Excel/PDF); Premier Racedays
- About: vision, mission, culture, values, strategic objectives, D&I
- Contact / FAQs

**Ownership & registrations**
- Five ownership types: Sole, Company, Partnership, Syndicate, Racing Club
- Online registration forms; Racing Admin for partnerships/syndicates/clubs
- Syndicate/Racing Club manager licensing (mandatory 2025–2026)
- Racing colours: standard designer (18 colours/patterns), bespoke (£5,000 + VAT), vintage silks marketplace
- Authority to Act
- VAT reclaim scheme for racehorse owners (Weatherbys/HMRC guidance)
- Racing account / Direct Debit for prize money & fees
- **Owners' toolkit** (7 chapters): checklist, registrations, maintaining ownerships, prize money, expenses, ready to run, retiring
- Training agreement guidance (ROA/NTF template)
- PASS owners' badges via RCA Privileged Access Swipe System
- Horse naming / colours re-registration

**Racing Admin (racingadmin.co.uk) — industry operations**
- Ownership management (pending/current; % shares; syndicate/club members)
- Horses in training; handicap ratings; entry activity
- Appointed agents / authorities
- Communications hub
- Race entries & declarations
- Help & support FAQs, videos, forms, stats
- Rules of Racing access

**Racing Digital Hub (in development)**
- Consolidate enter/declare, staff management, admin tasks, data use
- Industry strategy: welfare, integrity, fans, ownership, betting, workforce

**Licensing & regulation**
- Licences/permits: trainers, jockeys, amateurs, agents, valets, equine pools
- Licensing Committee; guidance notes & forms
- Rules compliance; disciplinary panel / Independent Judicial Panel
- Handicapping; race planning; fixture list
- Racecourse regulation & inspectors
- Raceday stewards & veterinary officers
- Anti-doping / disease control
- Medical services for people in the sport
- International Pattern/Listed guardianship

**Integrity & reporting**
- **RaceWISE** anonymous reporting (phone, email, WhatsApp/text): welfare, integrity, safeguarding, equality
- Integrity education content

**Welfare**
- **HorsePWR** public welfare narrative
- Whole-life care messaging (microchip/registration; Retraining of Racehorses charity)
- National Equine Welfare Protocol (RSPCA, World Horse Welfare, etc.)
- Horse Welfare Board references
- Fatality-rate improvement statistics

**Careers & workforce**
- careersinracing.com portal + job board (1,000+ jobs/year claim)
- Apprenticeships, early careers, stud/grounds roles
- Industry recruitment/training/retention

#### Platforms
- **Web:** britishhorseracing.com (public); racingadmin.co.uk (authenticated industry)
- **Mobile:** No dedicated BHA-branded consumer app found publicly
- Racing Digital: web platform (phased launch)

#### Pricing (GBP, owner fees)

**Joining (from 1 Oct 2025)**
| Type | Fee |
|------|-----|
| Individual | Free |
| Company | £405 |
| Partnership | £280 |
| Syndicate | £405 |
| Racing Club | £405 |

**Annual subscription**
| Status | Fee |
|--------|-----|
| Active owner (runner in last 12 months) | £168 |
| Dormant | Free |

Covers Authority to Act, VAT admin, sponsorship, leases, etc. (formerly separate charges).

**Per race**
- Entry handling fee: £29.17 per entry (refunded if eliminated) + racecourse entry fee

**Additional**
- Colours & names (1/5/10/20-year options in Rules of Racing)
- Bespoke colours: £5,000 + VAT
- ROA members: 20% discount on annual & additional owner fees

Public site browsing: free.

#### Business model
Regulatory fee recovery (owners ~25% of BHA income) + licensing fees + industry funding (HBLB levy, etc.). Not ad-supported consumer social.

#### Integrations & partners
- Weatherbys (ownership desk, bank, VAT)
- Racehorse Owners Association (ROA)
- National Trainers Federation (NTF)
- RCA / PASS badge system
- Crimestoppers / Real Response (RaceWISE)
- RSPCA, World Horse Welfare
- Horserace Betting Levy Board (HBLB)
- Great British Racing; International Federation of Horseracing Authorities

#### Strengths
- Mandatory gatekeeper for GB racing — unmatched switching costs
- Authoritative data: fixtures, handicaps, ownership registry
- Deep welfare/integrity institutional trust
- Comprehensive owner onboarding toolkit

#### Gaps vs horse-owner management app
- Scope limited to racing thoroughbreds in GB
- No general feed/health/yard SaaS for non-racing owners
- Admin-heavy UX; not a consumer lifestyle product
- Fan engagement largely elsewhere (Racing Post, bookmakers, Racing TV)

#### Key URLs
- https://www.britishhorseracing.com/regulation/ownership/become-a-racehorse-owner/
- https://www.britishhorseracing.com/regulation/ownership/owners-fees/
- https://www.britishhorseracing.com/regulation/ownership/owners-toolkit/
- https://www.racingadmin.co.uk/

---

### 4. FEI HorseApp

| Field | Detail |
|-------|--------|
| **URL** | https://inside.fei.org/hub/it-services/mobile-apps/fei_horseapp |
| **Organization** | Fédération Equestre Internationale (FEI) — international governing body |
| **HQ** | Chemin de la Joliette 8, 1006 Lausanne, Switzerland |
| **Founded** | FEI 1921; HorseApp ~2016; health modules critical from 2021 EHV-1 outbreak |
| **Type** | Mandatory federation compliance & biosecurity tool — **not** owner CRM |

#### Positioning
Official regulatory mobile tool for FEI horse health, biosecurity, vaccinations, documents, and event traceability. Compulsory at all FEI events worldwide.

#### Target audience
- Athletes, grooms, owners, Endurance trainers at FEI events
- FEI veterinarians and non-FEI licensed vets (vaccination module)
- FEI officials, National Federations, Organising Committees
- **Geography:** Global
- **Languages:** EN, FR, PT, ES

#### Complete feature inventory

**Horse identity & lookup**
- Scan barcode on FEI Passport / FEI Recognition Card
- Search by FEI ID / name
- "My Horses" list
- Bluetooth microchip scanner lookup (vets/organisers)

**Documents**
- Photograph passport pages; crop/rotate; upload to FEI Database (Art. 137 General Regulations)
- National Federations: document upload, PCR upload

**Horse Health Self-Certification**
- Pre-arrival form for each horse at each FEI event (day before or day of arrival)

**Temperature monitoring**
- 2× daily for 3 days before arrival
- 2× daily from arrival to departure at event
- Vets/officials can consult/monitor venue temperatures

**Check-in / check-out & traceability**
- Athlete/groom/owner self check-in (location for outbreak response)
- Self check-out
- Organisers: compulsory check-out when horses leave venue
- Off-venue stabling location recording

**PCR / disease testing**
- Upload photo of negative PCR (e.g. EHV-1) when required

**Equine influenza vaccination module**
- Athletes/owners/grooms/trainers: enter historical passport vaccination if none recorded
- FEI vets & licensed vets: record administered vaccinations
- Verify/validate vaccination at Examination on Arrival

**Veterinarian: Examination on Arrival**
- Open horse via microchip / barcode / FEI ID
- Review prior 3-day temps + self-certification
- Check PCR when applicable
- Enter arrival temperature; submit to FEI
- Offline mode: download offline database

**Grooms Reporting Mechanism**
- Grooms at FEI events can send feedback reports to FEI

**Compatible microchip scanners**
Real Trace RT100 V8, RT250, V8M; AllFlex LPR, AFX-110, GPR+; Datamars ISOMAX V, OMNIMAX (Bluetooth), Compact Max+; Avery Dennison Intrace RH51; AIP Medical FRD5910; AVID MiniTracker; Hero Reader Series 1001; AKC Reunite ISO-SCAN 134; Halo+

**Role-gated modules**

| Role | Capabilities |
|------|-------------|
| Athletes | Docs, self-cert, temps, check-in, PCR, historical vaccinations |
| Grooms / Owners / Trainers | Self-cert, temps, check-in, PCR, historical vaccinations, groom reports |
| FEI Veterinarians | Exam on Arrival, scanners, temps monitor, vaccinations, verify/validate |
| Non-FEI licensed vets | Vaccination recording + scanners + offline |
| Officials | Temperature monitoring only |
| National Federations | Document upload, PCR upload |
| Organisers | Horse check-out |

**Explicitly absent:** GPS ride tracking, training logs, expenses, social feed, yard billing, wearables fitness, AI coaching, general calendar/CRM.

#### Platforms
- **iOS/iPadOS:** App Store ID 1084644540 (iOS 13+)
- **Android:** `org.fei.horseapp` (10K+ downloads)
- **Web:** Not found publicly

#### Pricing
- **Free** — no IAP or subscription
- Non-compliance penalties via FEI Veterinary Regulations: warnings; fines CHF 200–400; database blocks (10 days / 1 month); CHF 100 per presentation for missing EI vaccination details; falsification → disqualification

#### Scale (FEI 2023 report)
- >470k self-certifications
- >1.1M horse scans
- >4.7M temperature recordings

#### App ratings
- Google Play: ~2.6/5 (~88 reviews)
- iOS US: ~2.2/5 (~13 ratings)
- Common complaints: temps disappearing, account setup friction, reliability

#### Strengths
- Only official FEI compliance channel; legal force behind adoption
- Multi-stakeholder design (athlete → vet → organiser → NF)
- Biosecurity/traceability at global scale

#### Gaps vs horse-owner management app
- No everyday health CRM, GPS/training, social, or yard ops
- Only FEI-registered horses/events
- Poor consumer UX; no monetized owner value beyond compliance

#### Key URLs
- https://inside.fei.org/fei/your-role/it-services/mobile-apps/fei-horse-app/athletes
- https://www.britishequestrian.org.uk/competitors/fei-horseapp/using-the-fei-horseapp

---

### 5. My Cheval

| Field | Detail |
|-------|--------|
| **URL** | https://www.mycheval.com/ |
| **Organization** | My Cheval Digital; Guillaume Riviere (founder) |
| **HQ** | NESTA Business Centre, Suite 302, Old Airport Road, Dublin D09 HP96, Ireland |
| **Founded** | ~2023–2024 |
| **Type** | Horse CRM / stable management + GPS ride tracking |

#### Positioning
*"Free all-in-one digital stable for horse owners."* Positions as paperwork replacement for health, calendar, expenses, media, and GPS rides. Closest direct competitor to a full owner management suite.

#### Target audience
- Independent owners, leisure riders, competitors
- Yards up to ~100 horses
- Co-owners, trainers, vets, yard managers, prospective buyers (via sharing)
- **Geography:** 10+ countries claimed; 7,000+ owners; 7,500+ horses
- **Languages:** English primary

#### Complete feature inventory

**Horse profiles**
- Multiple horses (up to ~100)
- Passport details, microchip, birthdays, breed, age, medical info
- Equipment sizes (girth, bit, etc.)
- Photos, notes, documents
- Profile sharing: trainer / vet / lessee / co-owner / buyer
- Keep admin rights or transfer ownership
- Image formats: PNG/JPEG only

**Home / dashboard**
- Upcoming reminders & events
- Quick horse access
- Weather module (best outdoor riding days)

**Health records & reminders**
- Vaccinations, farrier, dentist, dewormer, osteopath, physio, injuries, treatments
- Recurring health actions
- Custom health action types
- Filters for multi-horse
- Health history / journal (e.g. lameness notes)
- Push notifications

**Calendar, events & to-dos**
- Vet, farrier, dentist, lessons, competitions, transport, clipping, rug changes
- Weekly/monthly task lists
- Filter by horse or event type
- Custom event types; all-day events
- Sync with phone calendar
- Auto-log expense after event (one tap)

**Expense tracker**
- By horse: feed, vet, transport, shows, tack, livery, lessons, etc.
- Filter by horse, item, year/month
- Custom expense types

**Ride Tracker (GPS)**
- Live GPS route & distance
- Time & average speed
- Walk / trot / canter breakdown
- Custom gait speed settings per horse
- Colour-coded gait maps
- Session summaries; monthly summaries
- History per horse; filter by horse/rider/time
- Trim rides if forgot to stop
- Ride disciplines & history filters
- Live location sharing with contacts
- Group "ride together" on map
- SOS / emergency message & one-tap call
- Drop pins with photos/videos/notes
- Social media share
- Challenges & leaderboards (weekly/monthly goals)
- Route maps, stats, heat maps

**Weather & environment**
- Hour-by-hour weather
- High/low tides (beach rides)
- Sunrise/sunset
- Rug recommendations (temp, clipped?, stabled vs field) + notifications

**Media & journal**
- Per-horse photo/video gallery
- Direct capture in album
- Journal: behaviour, progress, training reflections
- **AI-powered jump height analysis** (FAQ)

**Social / collaboration**
- Connect with friends
- Share horses, rides, events, media
- Profile sharing for sale/handover

**Settings / UX**
- Custom event/health/expense types
- Cross-device sync via account
- Partial offline (full sync needs internet)
- Encrypted storage (claimed)
- No ads (marketing claim)

**Roadmap (explicit)**
- AI Equestrian Assistant
- Desktop / web
- Marketplace & services directory

#### Platforms
- **iOS:** ID 6468960996 — 4.8★, ~6 ratings (US)
- **Android:** `com.mychavel.app` — 5K+ downloads; 4.4★, ~54 reviews
- **Web/desktop:** "Soon" — not shipping

#### Pricing

**Website messaging:** Completely free; no limitations; optional premium "may" come later.

**App Store IAP (USD) — conflict with free messaging:**

| SKU | Price |
|-----|-------|
| Basic Plan | $0.99/mo |
| Pro | $4.99/mo |
| Ride Premium Monthly | $4.99/mo |
| Pro Plus Monthly | $9.99/mo |
| Pro Yearly | $49.99/yr |
| Ride Premium Yearly | $49.99/yr |
| Pro Plus Yearly | $99.00/yr |
| Standard Plan | $22.99 |
| Basic Plan (alt) | $8.99 |

Exact free vs paid feature matrix per SKU: **not documented publicly on website.**

#### Business model
Freemium / free acquisition → optional subscriptions. Possible future marketplace. No ads claimed.

#### Integrations
- Device calendar sync
- GPS / location services
- **Not found:** FEI, federation databases, Apple Watch, Polar/Garmin, HealthKit

#### Strengths
- Broadest owner-CRM coverage among direct competitors (health + money + calendar + docs + rides)
- Practical UK/EU features (tides, rugs, equipment sizes)
- Profile sharing / ownership transfer
- Active product velocity

#### Gaps
- Small user base vs Equilab
- No FEI/competition compliance
- No wearables / Apple Watch
- Web/desktop not live
- Pricing story inconsistent (free FAQ vs IAPs)
- No professional yard billing/payroll/feed inventory

#### Key URLs
- https://www.mycheval.com/faq
- https://www.mycheval.com/ride-tracker

---

### 6. Equilab

| Field | Detail |
|-------|--------|
| **URL** | https://www.equilab.horse/ |
| **Organization** | Equestrian Insights AB |
| **HQ** | Lindholmspiren 7, 417 56 Göteborg, Sweden |
| **Founded** | 2016–2017 |
| **Founders** | Simon Bengtsson, Adam Torkelsson |
| **Funding** | ~$401K–$780K seed |
| **Type** | GPS ride tracking & training analytics + safety + social community |

#### Positioning
*"World's leading horse-riding tracker."* AI gait analysis, safety sharing, trails, and equestrian social community. Endorsed by Olympic rider Patrik Kittel.

#### Target audience
- Leisure to Olympic riders; trail, arena, all disciplines
- Solo hackers (safety), social riders, multi-horse owners (Premium)
- **Geography:** 50+ countries; 1M+ users claimed; 500K+ Android downloads
- **Languages:** EN, AR, DA, NL, FR, DE, IT, JA, NO, PT, ES, SV (12)

#### Complete feature inventory

**Ride tracking (core)**
- Phone sensors (± Apple Watch): distance, speed, gaits, elevation, turns
- AI-based gait analysis (walk/trot/canter; tölt for Icelandic horses)
- Unlimited ride history (for allowed horses)
- Ground type notes, notes, horse selection on edit
- Personal bests ("Records")
- Weather on training summary (**free** since Oct 2024)

**Apple Watch**
- Compatible Watch Series 3+; watchOS 8.7+
- **Remote (free):** phone tracks; watch shows distance, avg speed, time, gaits; start/stop
- **Standalone (Premium):** watch-only track — time, distance, avg speed, path only (no gaits, no Safety Tracking, no Polar)

**Safety (Premium)**
- Live location sharing with safety contacts
- Auto alert if stopped moving ~5+ minutes
- Requires phone (not standalone Watch)

**Trails**
- Discover trails globally; create/save own; share; difficulty/terrain
- **Premium Trails:** private share to friends, search/filter map, offline download, GPX export
- Trainings >100 km cannot become trails

**Analytics & coaching**
- **Trends (Premium):** distance, time, turn distribution, charts over time
- Detailed stats: top speed, elevation (Premium)
- Gait segments view + **edit gaits (Premium)**
- **Audio Coach:** real-time headphone stats (Premium)
- Export trainings CSV / single ride GPX (Premium)

**Calendar & organisation**
- Weekly/shared calendars for trainings, appointments
- Coordinate trainers, vets, co-riders via groups
- Scheduling future events: **free** (since Oct 2024)

**Horse management (lighter)**
- Horse profiles
- **Free:** track **one** owned horse (horses added before 15 Apr 2023 grandfathered)
- **Premium:** unlimited horses
- **Documents:** registrations, vaccinations, results, feeding plans
  - Free: up to **3 files per horse**
  - Premium: unlimited + sharing
- Share horses with friends

**Social & gamification**
- Friends (request/invite)
- Groups (public/private): chat, posts, like/comment
- Monthly Challenges + leaderboards (Friends / Top 10)
- Achievements / badges
- Home feed
- Share rides/progress

**Wearables / fitness**
- Apple Watch (above)
- **Polar H10 equine HR (Premium, iOS only):** live HR while tracking; detailed HR on summary
- Apple HealthKit (rider fitness)
- Printable stable posters with QR to start tracking

**Commerce**
- Brand partner offers/discounts; browse free, **redeem requires Premium**

#### Platforms
- **iOS/iPad/Apple Watch:** ID 1133163586 — **4.8★, 5.1K ratings**; iOS 15.1+
- **Android:** `horse.schvung.equilab` — **500K+ downloads; 4.8★, ~8.85K reviews**
- **Web:** marketing + billing (Paddle); not a full web tracker

#### Pricing (USD)

**Website (equilab.horse/premium):**
| Plan | Price |
|------|-------|
| Monthly | $11.99/mo |
| Annual | $89.99/yr (~$7.50/mo) |
| Trial | 7-day free (app only; not website) |

**App Store (~10% higher):**
| Plan | Price |
|------|-------|
| Monthly | $12.99/mo |
| 6 months | $59.99 |
| Annual | $99.99/yr |

Team/group discounts: email support@equilabapp.com

**Free vs Premium summary:**
- **Free:** 1 horse; Remote Watch; basic trails; friends/groups/challenges; calendar scheduling; weather on rides; 3 docs/horse; unlimited ride history for allowed horses
- **Premium:** Safety Tracking; unlimited horses; Trends; detailed stats; gait edit; Audio Coach; standalone Watch; Polar H10; enhanced Trails; unlimited docs + share; brand offer redemption; CSV/GPX export

#### Business model
Freemium SaaS (App Store, Play, Paddle). Brand affiliate offers. Team B2B group plans.

#### Strengths
- Category leader by scale and ratings (4.8★, high volume)
- Best-in-class gait AI + training analytics
- Safety Tracking for solo riders
- Strong social/challenges loop; 12 languages; global trail network

#### Gaps
- Weak health CRM (no rich farrier/vaccine schedules, expenses, rug advisor)
- No FEI compliance
- Free tier aggressively limited (1 horse; safety paywalled)
- Android lacks Polar / full Watch parity
- Not a yard management / billing system

#### Key URLs
- https://www.equilab.horse/features
- https://www.equilab.horse/premium
- https://support.equilab.horse/

---

### 7. The Equestrian App

| Field | Detail |
|-------|--------|
| **URL** | https://equestrianapp.com/ |
| **Organization** | Extreme Software Inc. (Patrick Husting, founder) |
| **HQ** | Sammamish, Washington, USA |
| **Founded** | 2018 |
| **Type** | Horse management + barn/business ops + social/community + marketplace/directory |

#### Positioning
*"Microsoft Office for horses."* Free all-in-one horse care, barn management, and equine community connecting owners, providers, and businesses. Emphasizes communal care with permissions.

#### Target audience
- Individual horse owners, multi-horse households, leasees/share-boarders
- Youth: 4-H members (free Clover edition)
- Businesses: barn/boarding managers, trainers, instructors, farriers, bodyworkers, rescues
- **Geography:** Global English; strongest US identity; "tens of thousands" members; 10K+ Android downloads

#### Complete feature inventory

**Horse records & profiles**
- Rich profiles: breed, age, registration numbers, feeding schedules, care instructions
- Multiple horses (tier-gated: 2 / 5 / 25 / unlimited)
- Health journal
- Connect non-owners (leasees, friends) for shared care
- Horse transfer to another app member (sale/transfer)
- **HorseTag** — print/scan QR codes for quick horse lookup
- Horse weight tracker
- Photo gallery per horse
- Multiple photos on journal entries

**Health & veterinary**
- Vaccination tracking
- Vet visit logging
- Deworming schedules
- Dental checks
- Connect vet to horse profile for shared history
- Document storage: registration certificates, blood work, Coggins, vet records, AQHA reports
- File upload / scan documents

**Journaling & activities**
- Equine activity journal with extensive categories
- Quick capture (including on-horse)
- Injury photo capture for vet communication
- Multi-horse journal entry (Gold+)
- News feed of horse activities shared with connected caregivers
- Community journal / social posts
- App achievements

**Scheduling & calendar**
- Equestrian-specific calendar (recurring farrier, horse+rider sessions)
- Device calendar sync
- Best ride times / weekly ride planning view
- Weather and blanket alerts
- Appointment tracking
- Business: enhanced calendar; friends can see calendar; embed calendar on website

**Stable / barn management (StallPros)**
- Multiple barns and turnouts
- Staff invitations
- Stall assignment (1–100+ stalls)
- Feeding & care schedules
- Emergency contacts per stall/horse
- Boarding management
- Assign tasks to others (business/Platinum)
- To-Do task tracking

**Lessons & training (business)**
- Riding instruction session tracking
- Client-facing comments on student feed
- Private instructor notes
- Horse training session capture (e.g. 30-day training)
- Training plans
- Riding patterns (Silver+)

**Farrier & bodywork professional tools**
- Farrier calendar (schedules horse + owner together)
- Per-hoof documentation with photos
- Abscess / healing progression tracking
- Bodywork session depth (tight areas, healing over time)
- Bodywork calendar
- Documented visit left in horse's journal (vs invoice-only)

**Leasing**
- Horse leasing management
- Schedule lease days

**Messaging & community**
- Barn Chat (barn-focused group messaging)
- Connect/follow friends
- Contacts management (farriers, vets, trainers, barn managers)
- Permissions for others to journal/update horse records
- Community feed / social features

**Ride tracking**
- Ride Tracker (distance, time, speed, location)
- **Ride Tracker Pro** companion app (Gold+): GPS history, maps, goals, achievements, ride-program export

**Shows, awards, youth**
- Horse shows and award/ribbon tracking
- 4-H Record Book projects
- **Clover Special Edition:** multiple 4-H projects, journal, calendar, supply expenses, rides/practice times, print approved 4-H record books & horse certificates; works with other animals

**Equipment & tack**
- Equipment tracker
- Tack room tracker

**Expenses & invoicing**
- Expense tracking for horse/barn costs
- Business: invoice customers
- Payments processing beyond invoicing: **not found publicly**

**Documents, printing, reports**
- Upload documents
- Printing horses/contacts
- More printable reports (Gold+)
- Business: professional printed reports for bodywork/training/farrier visits

**Marketplace / discovery**
- Equine business directory (~15,000+ businesses; 16 categories)
- Horses for sale ("Carfax for horses" — health/farrier history auto-shown)
- Equine job board
- List products & services on business profile
- **HorsePros** companion directory app
- In-app ad manager (geo-targeted ads)
- Business profile; Platinum "seen 1st in search results"
- Premium equine brand discount partners

**Rescue / nonprofit**
- Rescue and non-profit support features (Platinum)

#### Platforms
- **iOS** (iPhone/iPad; iOS 16.6+; Mac M1+, Vision)
- **Android**
- **Web login** (referenced on business pages)
- Companion apps: HorsePros, Ride Tracker Pro

#### Pricing

**Marketing:** Core app "FREE forever."

| Tier | Horses | Price | Key unlocks |
|------|--------|-------|-------------|
| **Bronze** | 2 | Free | Ads present |
| **Silver** | 5 | $3.95/mo or $49.95 lifetime | No ads; Barn Chat; connect others; weight; gallery; printing; patterns; 4-H |
| **Gold** | 25 | $5.95/mo or $99.95 lifetime | Docs, equipment, HorseTag, transfer, Ride Tracker Pro, awards, To-Dos, vaccinations, tack room |
| **Platinum** | Unlimited | $9.95/mo or $199.95 lifetime | Full StallPros business suite, invoicing, boarding, leasing, calendar embed, rescue, search priority |
| **4-H Clover** | — | Free for 4-H | Record books |

**App Store IAP (varies):** Gold $4.99/mo or $49.99/yr; Platinum $9.99/mo or $99.99/yr

**Other revenue:** Sponsors; in-app advertising; brand discount partnerships.

#### Strengths
- Broadest ops + records + community + marketplace surface
- Strong multi-party horse sharing (permissions; farrier/bodyworker journal entries)
- Business verticals inside one app
- Very low price / lifetime unlocks; 4-H niche
- "Carfax for horses" sale listings with care history

#### Gaps
- UI/UX called outdated in reviews
- Smaller Android install base (10K+) vs Ridely (100K+)
- No premium training video/Olympian content
- No AI coaching or live safety tracker (RideSafe-style)
- Product surface sprawling; navigation overwhelming
- Family/small-team capacity vs funded competitors

#### Key URLs
- https://equestrianapp.com/owners.html
- https://equestrianapp.com/stallpros.html
- https://equestrianapp.com/equinesearch.html
- https://equestrianapp.com/app/subscriptions.html

---

### 8. Ridely

| Field | Detail |
|-------|--------|
| **URL** | https://ridely.com/ |
| **Shop** | https://app.ridely.com/shop/en/home |
| **Organization** | Ztabler AB (org. 559070-0935) |
| **HQ** | Uppsala, Sweden |
| **Founded** | 2016 (as Ztable); product ~2017 |
| **Founders** | Ingrid Sundqvist (CEO), Erika Hjertén, Totta Ogander |
| **Funding** | ~$2.53M total |
| **Type** | Equestrian training / edtech + ride journal + welfare education |

#### Positioning
*"Digital training partner for equestrians."* Expert video education, structured programs, AI coaching, ride journaling, and horse welfare learning. Won **Equestrian Tech of the Year 2025**.

#### Target audience
- Ambitious recreational to competitive riders
- Disciplines: dressage, show jumping, eventing, western, in-hand, grooming, rider fitness
- Non-riding horse people (grooming; welfare education)
- B2B: riding schools (Hopoti), trainers (STABLE Pro), insurers/federations (HWS sponsors)
- **Geography:** Global English; roots Sweden; strong Sweden, UK, USA, Australia
- **Scale:** 500K+ riders claimed; 100K+ Android downloads; 20K+ MAU claimed

#### Complete feature inventory

**Video learning library**
- 500–600+ filmed exercises/videos
- Categories: dressage, show jumping, eventing, western, grooming, in-hand, rider fitness, mental training/yoga/mindfulness
- Search + recommendations
- Masterclasses with elite riders
- Free tier: ~78 videos
- PRO: unlimited / all exclusive exercises
- À la carte single exercise purchase (~$6.99)

**Featured experts (60+ trainers; ~10 Olympians)**
Andrew Hoy, Henrik von Eckermann, Carl Hester, Ingrid Klimke, Alan Davies, Meredith Michaels-Beerbaum, Lillie Keenan, Joe Stockdale, Jack Whitaker, Gareth Hughes, Helena Stormanns, Dr Andrew McLean / Equitation Science International, and others.

**Training programs**
- 25–40+ structured programs (5–11 sessions + homework)
- Discipline-specific (e.g. Prepare for Cross Country with Andrew Hoy)
- Rider-body programs (fitness, yoga, mindfulness)
- Grooming programs (Alan Davies)
- À la carte program unlock (~$39.99)
- Personalized programs via AI coach (PRO)

**AI coaching (Ridi)**
- Q&A on equestrian topics
- Proactive exercise recommendations (rider ability, horse level, goals)
- Free: **3 sessions**; PRO: **unlimited**
- Trained on Ridely's expert-verified library

**Horse Welfare Score (HWS)**
- Gamified welfare education challenge
- Expert-led welfare programs + quizzes
- Score + global leaderboard
- Topics: pain recognition, Five Domains, nutrition, hoof care, ethical training, tack fit, stress signals
- Brand/federation sponsorship model
- Partners: World Horse Welfare, Agria UK, British Eventing, Equitation Science International, Hartpury College

**Health tracking**
- **Health Check:** daily how-horse-feels logging; structured observations; optional vitals (temperature, heart rate, respiratory rate); notes, photos, videos
- Baseline for vet conversations
- Planned horse-profile stats & trends from Health Check entries

**Ride journal & calendar**
- Log riding and non-riding sessions
- Photos/videos on activities (PRO: up to 10 min video + 5 photos)
- Plan activities; reminders; recurring activities (PRO)
- Color-code activity types; filter by tags
- Co-rider visibility + comments
- Share horse with trainers/friends/family
- Goals and tasks (PRO)
- Statistics: weekly/monthly/yearly overviews (PRO)

**GPS & safety**
- GPS track hacks (distance, time, speed)
- **RideSafe Tracker:** live share location in-app or browser; notify contacts if stopped 5 minutes; notify when ride ends
- Apple Watch support

**Community**
- Topic groups (Dressage Discussions, Young Horse Journey, Jumping Community, etc.)
- Free: **3 groups**; PRO: **9 / all groups**
- Expert-moderated PRO groups; coach response target <24 hours
- Peer Q&A and sharing

**Horse / team management (light)**
- Manage team of horses
- Share horse profiles with network
- Activity logging per horse
- **Not** full stall/boarding ERP

#### Platforms
- **iOS** (iPhone/iPad; iOS 16.6+; Vision; Apple Watch watchOS 9.12+)
- **Android** (contains ads on free tier)
- **Web** (purchase/account at app.ridely.com; RideSafe browser following)

#### Pricing (USD)

**Trial:** 7-day free PRO; cancel ≥24h before end.

| Plan | Website | App Store |
|------|---------|-----------|
| Monthly PRO | $35/mo | $34.99/mo |
| 3 months | — | $99.99 |
| Yearly PRO | $149/yr (~$12.42/mo) | $149.99/yr |
| Lifetime | $449 | $399.99 |
| Single exercise | — | $6.99 |
| Single program | — | $39.99 |

**Free vs PRO:**

| Feature | Free | PRO |
|---------|------|-----|
| Log activities | Yes | Yes |
| GPS track | Yes | Yes |
| Plan activities | No | Yes |
| Live share GPS (RideSafe) | No | Yes |
| Statistics | No | Yes |
| Goals & tasks | No | Yes |
| Photos/video on activity | No | Yes |
| Training programs | No | Yes |
| Social groups | 3 | 9 / all |
| Expert-moderated groups | No | Yes |
| Riding exercises | ~78 | 500+ |
| AI Coach | 3 sessions | Unlimited |

#### Integrations & partnerships
- **Hopoti** — riding school admin; Ridely content + HWS for schools
- **STABLE Pro** — trainer business management; welfare education perks
- **Hartpury University/College**, **Agria UK**, **British Eventing**, **World Horse Welfare**
- Stripe, Apple, Google

#### Strengths
- Best-in-class elite instructional content and brand associations
- Differentiated RideSafe, AI coach, HWS
- Strong B2B2C distribution via schools, trainers, insurers
- 100K+ Android installs; 4.6★ iOS (919 ratings)

#### Gaps
- Expensive vs management apps
- Free tier heavily gated
- Weak barn/business ops (by design)
- No marketplace for horses/jobs
- Health features observational, not full medical record vault

#### Key URLs
- https://ridely.com/features/
- https://ridely.com/pro/
- https://ridely.com/horse-welfare-score/

---

### 9. HippoVibe

| Field | Detail |
|-------|--------|
| **URL** | https://www.hippovibe.io/ |
| **Organization** | Hippovibe GmbH (HRB 109460, Amtsgericht Köln; ~2022) |
| **HQ** | Wermelskirchen, Germany |
| **CEO** | Jonas Schmitz-Heinen |
| **Type** | B2B pro-yard SaaS — stable & team operations |

#### Positioning
*"Digital stable management that replaces whiteboards, paper, and WhatsApp."* One shared system for horses and teams. Endorsed by sport stables (Stephex, Hof Sosath, Joe Stockdale, Sentower) and riders (Lorenzo de Luca, Elliott Gordon).

#### Target audience
- Sport stables, liveries, breeding operations, professional yards with staff/grooms/riders
- Value grows with more horses and more people (less emphasis on single leisure owners)
- **Geography:** Strong DACH/Benelux/international showjumping network

#### Complete feature inventory

**Horse management**
- Central horse overview / database
- Pedigree storage; owner information
- Horse groups / filters (dressage, jumpers, mares, stallions, foals)
- Share horse information pack (age, pedigree, videos, results-page links) with owners/buyers
- Unlimited users

**Daily ops / barn & yard**
- Digital task lists / daily plan
- Real-time team visibility of tasks
- **Staff schedule** (recent expansion)
- Training statistics from past work
- Shared calendar for shows, lessons, events
- "Whiteboard on phone" stable board replacement

**Health / farrier / vet**
- Digital health record: past treatments, vaccinations, shoeings, dewormings
- Upcoming health overview per horse
- Reminders for due vaccinations, farrier, dentist

**Documents & media**
- Per-horse files: videos, X-rays, scans, invoices
- Playlists / folder structure per horse
- Photo & video storage

**Feeding**
- Feeding plans with easy updates
- Customizable feed products

**Finance**
- Book income & expenses per horse
- Mobile finance: competition winnings, vet/farrier invoices, training expenses
- Financial overview / cost visibility

**Access & collaboration**
- Individual access rights (medical/financial restricted)
- Sync between web and mobile
- Unlimited users

**Shows / competition**
- Show & event planning in shared calendar
- Keep all stakeholders informed of changes

**Not found publicly:** Ownership shares/syndicates, marketplace, AI assistant, IoT sensors, lesson booking portal, Peppol e-invoicing, dedicated breeding stud module, inventory management.

#### Platforms
- **Web** application
- **iOS:** ID 1204799101 — ~4.6★ / ~96 ratings
- **Android:** `com.hippovibe.professional` — 10K+ downloads, ~4.0★ / ~90 reviews
- **14-day free trial** (does not auto-convert to paid)

#### Pricing
- **Per horse / month**, VAT excluded
- **From €3 per horse per month**
- Billing: quarterly or annually; yearly −17%
- Calculator presets: 10 / 20 / 30 / 100 / 100+ horses (exact totals JS-rendered on site)
- Capterra reference: ~€72/year for small horse count
- 14-day free trial, no auto-subscription after trial

#### Strengths
- Strong pro-yard / international sport-stable brand proof
- Simple per-horse pricing with unlimited users
- Tight team task + health + media + finance in one place

#### Gaps
- No AI, IoT, deep breeding, or club/lesson commerce
- Android reviews cite bugs/crashes
- English-first; thinner feature surface than Equicty

#### Key URLs
- https://www.hippovibe.io/features
- https://www.hippovibe.io/pricing

---

### 10. Happie Horse / Happie Animals

| Field | Detail |
|-------|--------|
| **URL** | https://happieanimals.com/ |
| **Organization** | Animalytics GmbH, Hamburg, Germany (HRB 161185; ~2020) |
| **Founder/CEO** | David A. C. Harder |
| **Predecessor** | HorseAnalytics (merged/rebranded) |
| **Type** | B2C freemium mobile app + B2B Marketing Cloud + insurance referral |

#### Positioning
Consumer-first equine health & daily yard app — prevention (laminitis, PPID, airways), training, and AI. Claims **185,000+** horse owners, **170,000+** horses, **150+** countries.

#### Target audience
- Leisure owners, DIY horse keepers, sharers/loaners, liveries
- **Geography:** DACH core; international expansion
- **Languages:** DE, EN, ES

#### Complete feature inventory

**Horse profile / passport**
- Unlimited horses (even on free tier)
- Equine passport / horse profiles
- Share horse: **read-only** or **full access** (vet, farrier, loaner, yard staff); revocable

**Health**
- Digital health record
- Medications (limited on free — ~10 entries historically)
- Diseases / conditions; treatments
- Symptom diary (gum colour, nostrils, eyes, skin, coat, mane/tail, droppings; mare heat; gender-specific)
- Body values: weight (incl. calculator), height, temperature, pulse, respiration
- Weight goals
- **Cushing / PPID diary:** symptoms, ACTH, cortisol/insulin values
- Inhalation logging (Premium)
- Histories & trends
- Emergency / barn contacts (call/directions from app)
- First-aid cards (Academy)

**Pasture / environment / prevention**
- **Fructan / laminitis risk** (traffic light; current, 12h, multi-day)
- Grazing time logging + history charts
- Stable location (Premium) vs phone GPS (free)
- Weather forecast (12h / multi-day)
- Humidity, overnight average temp, soil dryness
- Push notifications for fructan risk levels
- Pollen forecast & air quality
- Heat / insect index
- Grass introduction / turnout guidance

**Feeding**
- Daily feed plan (breakfast/lunch/dinner)
- Snacks, ad libitum
- Feed types (herbs, vitamins, minerals, custom)
- Portion sizes; feedings on daily to-do

**Training & performance**
- Training plan / journal (rehab, fittening, competition templates)
- **Academy:** 350+ exercises with videos (dressage, SJ, lunging, poles, XC, groundwork)
- Blog / health education in-app
- Gait analysis: walk/trot/canter duration share; intensity
- GPS ride tracking: route, distance, duration, pace, avg/max speed
- Left/right rein ratio
- Disciplines incl. polo, working equitation
- Charity miles (Pink Ribbon)

**Stable ops / planning**
- Calendar (appointments, treatments, training, farrier, vet, custom)
- Digital to-do list / daily schedule
- Recurring tasks & reminders / push
- Shared calendar with others
- Medication plan check-offs

**AI**
- **Happie Horse AI Chat** (OpenAI-backed): health, feeding, training, turnout; uses selected horse's data; not a vet substitute

**Free web tools (no signup)**
- Horse cost calculator
- Competition packing checklist
- Poisonous plant photo checker
- Pasture weather & insects
- Laminitis self-test
- Fructan/ESC/starch seasonal guide
- Heat check; rug check
- Equine asthma self-test

**B2B (Happie Animals platform)**
- Happie Marketing Cloud / Ads Manager: contextual in-app ads
- Happie API: partners (insurers, brands) can gift Premium
- Surgery insurance referral (partner historically Barmenia)

#### Platforms
- **iOS & Android** (primary)
- Free web tools in browser
- Play: ~3.2–3.4★ / ~400 reviews / 50K+ downloads
- Marketing claims 4.6★ / ~2,400 (aggregate)

#### Pricing (EUR — note regional/promo variance)

| Plan | Price |
|------|-------|
| Free (Freemium) | €0 — unlimited horses; limited medication/disease/treatment history |
| Premium Monthly | €9.99/mo (also €14.99/mo on homepage) |
| Premium Yearly | €45–€89.99/yr (pricing page shows €45/yr = €3.75/mo; other pages €59.99/yr with 30-day trial) |
| Lifetime | €199.99 list; promos €149 / €99 |
| Riding Participation special | €29.99/yr (promo) |

**Free tier includes:** To-do list, gait analysis, health record (limited meds/diseases/treatments), emergency contacts, body values, Cushing diary, fructan risk at current location, weather, training exercises, calendar, feeding plan, horse sharing, unlimited horses.

**Premium unlocks:** Full medication/disease/treatment history depth; stable location for pasture; inhalation logging; full Academy; AI chat depth.

#### Strengths
- Largest claimed consumer user base among direct competitors
- Deep preventive health (fructan, PPID, pollen) unmatched by pro ERP tools
- Training Academy + GPS gait analysis + AI chat
- Strong DACH brand + free SEO web tools + Marketing Cloud moat
- Generous free tier / unlimited horses

#### Gaps
- Weak as multi-staff sport-yard ERP (billing, drag-drop board, stud, Peppol)
- Play Store rating lag vs marketing claims
- Pricing page inconsistency / promo noise
- AI disclaimer: not veterinary care

#### Key URLs
- https://happieanimals.com/horse-app-features/
- https://happieanimals.com/pricing/
- https://happieanimals.com/happie-horse-assistant/

---

### 11. Equicty

| Field | Detail |
|-------|--------|
| **URL** | https://www.equicty.com/ |
| **Products** | **Equstable** (stables) + **Equclub** (riding clubs) |
| **Organization** | Equicty NV · VAT BE 0642.995.182 · RPR Gent |
| **HQ** | Holstraat 87 bus 11, B-8790 Waregem, Belgium |
| **Founders** | Bram Balcaen (CEO), Samir Brahimi, Kristof Goeminne |
| **Founded** | ~2011–2013; seed via imec.istart (~€50K) |
| **Type** | B2B multi-product SaaS + optional hardware + AI |

#### Positioning
All-in-one digital management suite for equestrian businesses — stables, studs, traders, and riding clubs — plus AI (Hoofy) and Belgian Peppol e-invoicing. Claims ~40,000 horses, ~10,000 riders, ~26–30 countries.

#### Target audience
- Sport stables, traders, liveries, studs/breeding centres, riding clubs, equine vets
- Disciplines: showjumping, dressage, reining, carriage, racing, Arabian, eventing
- **Geography:** Belgium HQ; Benelux/EU Peppol focus; international customers

---

#### Equstable — complete feature inventory

**Horse management**
- Horse population / ID details / "horse CV"
- Pedigree & media (photos, videos, docs)
- Share profiles with owners, clients, vets
- Stable groups
- Website sync of horse profiles (sales yards)

**Team & collaboration**
- Invite team; real-time central plan
- Assign tasks to individuals/groups; sub-teams linked to stable groups
- Staff personal details, contracts, flight details, admin docs
- Native language selection per user
- Access permissions / protect sensitive content
- Task notes, completion confirmation, notifications on assign/change
- History of planned/executed activities

**Interactive planning**
- Drag & drop task mover
- Bulk move/copy/delete
- Customizable dashboards
- Personalized task types
- Recurrence per task
- Remote planning (phone/tablet/web)
- Categories: training, health, sport, nutrition, etc.

**Health**
- Health records
- Auto-schedule recurrences: deworming, vaccinations, etc.
- Reminders for due health activities
- Farrier/vet coordination via shared platform

**Workouts / performance**
- Daily workout scheduling; training scheduling
- Horse performance / reporting
- Associate videos/pictures per horse

**Finance & admin**
- Flexible & recurring invoices to owners/professionals
- Subscription-style invoice preparation
- Capture billable items from planning → auto onto owner invoice
- Expense / cost control per horse
- Full cost control reporting
- CRM / contact management
- Knowledge base; mail & chat support; dedicated account manager

**Competition (add-on)**
- Competition / show scheduling
- Share plan with team & owners (classes, times, related expenses)
- Notify on plan changes

**Breeding (add-on)**
- Mare activity scheduling (scans, AI, embryo flush, foaling)
- Mare cards / cycle tracking / follicle size / meds
- Stallion semen collection (quantity/quality; fresh/frozen/chilled; straws/doses)
- Semen inventory, bookings, shipments, invoicing support
- Stallion location/status for studbook/owners
- Smart Stable Board at vet check-up workflow
- Notify owners on mare progress

**Feeding & supply**
- Listed as trial interest / add-on area; depth not fully documented publicly

**Media & reporting**
- Video, images, docs; reporting; client reports from media/pedigree

**AI — Hoofy (beta, free during beta)**
- Chat over stable's real data + external web sources
- Role-specific advice: owners/managers, trainers, grooms, breeders, vets/farriers, admin/finance
- Can *propose* actions; user adds manually (no proactive alerts/auto-schedule yet)
- Voice-enabled; image analysis (beta) — upload horse photos for AI assessment

**Hardware — Smart Stable Board**
- 32″ industrial touchscreen; glove-operable; splash/dust/scratch resistant; stainless housing; CE; 2-year warranty; buy or lease
- Remote update; unlimited planning space; history; per-user privacy; cost capture for invoicing

**E-invoicing (Belgium/EU)**
- **Peppol e-invoicing included at no extra cost** with invoicing module
- UBL generation; send/receive; auto-detect public institutions; PDF+UBL; accountant email copies
- Belgian B2B mandate from 1 Jan 2026

**Integrations**
- Business website horse-profile sync
- **Horsetelex** pedigree/ID sync

---

#### Equclub — additional features (riding clubs)

- Member management & groups by riding level
- Parent booking for children
- Instructor permissions
- Lesson calendar / events
- Arena slot reservations
- Horse assignment to lessons by rideability
- E-commerce: lesson packages & subscriptions
- Online payments & payment status follow-up
- Member self-service portal (bookings, purchase history, schedules)
- Auto notifications (new lessons, cancellations, freed spots)
- Invoicing for members preferring invoices
- Occupancy / upsell tooling

#### Platforms
- Cloud web SaaS + mobile app (iOS/Android marketed)
- Smart Stable Board (Android-class industrial panel)
- **21-day free trial**, no credit card

#### Pricing
- Interactive calculator by horse band: up to 10 / 25 / 50 / 75 / 100 / 150 / 250 / 250+
- **Add-ons:** Competition, Finance, Breeding (checkboxes)
- Currency: EUR or USD
- Invoicing: Quarterly or Yearly (−10%); VAT not included
- Aggregators: from ~€30/month
- Large stables: custom quote
- Peppol: €0 extra with finance module
- Smart Stable Board: buy or lease — prices not public
- Hoofy: free in beta

#### Strengths
- Broadest **business** feature set (ops + billing + breeding + clubs + hardware + Peppol + AI)
- Elite sport-stable social proof (Delestre, Wathelet, Staut, Pessoa, etc.)
- Belgium e-invoicing compliance leadership
- Dedicated breeding stud workflows

#### Gaps
- Opaque exact pricing without configuring calculator
- Heavier than needed for single leisure owners
- Consumer health/prevention depth far behind Happie
- Hoofy still beta (no proactive automation yet)

#### Key URLs
- https://www.equicty.com/equstable/
- https://www.equicty.com/equclub/
- https://www.equicty.com/pricing/
- https://www.equicty.com/equstable/hoofy-ai/
- https://www.equicty.com/equstable/breeding/

---

### 12. EquineM

| Field | Detail |
|-------|--------|
| **URL** | https://equinem.com/ |
| **Organization** | EquineM — commercial stable-management SaaS |
| **Type** | **Pro-yard / stable-organization ERP** (modular B2B SaaS) — Equus's primary **stable-ops parity baseline** |
| **Role in Equus strategy** | Match EquineM barn operations in `equus/docs/features/stableModule.md`; exceed with horse-centric ecosystem (owners pay, businesses free, consent-based network) — see `equus/docs/product/businessPlan.md` §20 |

#### Positioning
*"All you can do and more."* Clear team/horse planning, centralized records, billing/invoices, health logging, breeding/mare cards, and facility reservations. The **stable organization** is the tenant: admin pays, owns the account, and adds owners/vets/staff as contacts inside one org.

#### Target audience
- Professional stables, liveries, sport yards
- Stud farms / breeding operations (dedicated module + webshop)
- Stable managers who need staff logins, horse groups, and modular billing
- **Not** primarily a consumer owner social/CRM app (owners are contacts inside the stable tenant)

#### Complete feature inventory

**Overview claims (marketing)**
- Clear and easy planning for team and horses — track training progress, to-do status, right people present at right day/time
- All records safely stored and accessible in one place
- Well organized billing and invoices — track expenses; charge the right people the right amount
- Health activities easily managed and logged — digital health record; vaccination schedules and reminders; deworming
- Mare cards and breeding activity logging for vets and owners
- Reservation system for paddocks, arenas, and other facilities — customers view occupancy from home

---

**Activity Planning**

Marketing promises:
- Real-time status of progress and potential delays
- Clear communication with staff and riders
- Activity reports and insight into horse development over time
- Automatic reminders for vaccination, worm cure, or farrier treatment
- Drag-and-drop planning for activities across horses and staff
- Check off activities once performed; shared understanding of plan, responsible people, progress
- Weekly activities overview (sortable/filterable)
- Monthly overviews per horse (activities + treatments) — helpful for invoicing
- Reusable standard training schedules and treatment plans
- Automatic reminders so staff never forget vaccination, worm cure, farrier

**Activity module — exhaustive feature list**
- Activities and appointments
- Mark activity / appointment completed
- Assign activities to staff members
- To-do's
- Set reminders / notifications
- Announcements
- Set order of activities
- Training plans
- Treatment plans
- Customize activity types
- Filter by horse, activity type, staff member
- Group activities by staff member
- Toggle between daily, weekly and monthly view
- Track progress of work done
- Overview of all historic activities
- Automated scheduling of vaccinations
- Define recurring activities
- Customizable activity form input fields

---

**Horse Records**

Marketing promises:
- Vaccination records, medical documents, pictures, videos, URLs in one place
- Reliable record-keeping; efficient communication with veterinarians and trainers
- Share information with staff and clients
- Profiles, arrival date, location history, medical history, vaccination records, feeding schedules, training plans, transportation instructions
- Permissioned document access (e.g. vet uploads X-rays/inspection reports; store pedigree papers, passports, Coggins, export certificates)

**Horse module — exhaustive feature list**
- Horse info
- Owner info and ownership percentage
- Health records
- Transportation instructions
- Upload documents, photos and videos
- Add / manage URLs related to the horse
- Import pedigree from HorseTelex
- Set team information (default rider, groom, farrier, etc.)
- Digital tack room
- Location history and arrival / departure book-keeping
- Horse groups
- Select various horse vaccination rules

---

**Team Management**

Marketing promises:
- Availability planning for staff
- Dedicated log-in account for each team member
- Each individual only sees information relevant for them in weekly/daily overview
- Role-based permissions management per account
- Personnel planning overview (who is present when)
- Historic availability and activity via reporting
- Create/link many persons: grooms, riders, vets, farriers, customers, dentists, trainers, horse owners — for scheduling/communication
- Horse groups linked to a rider so that rider only sees those horses
- Accounts assigned to teams and roles with granular permission levels

**Contacts and account module**
- Contact information
- Create account (EquineM log-in)
- View contact invoices, horses, activities, etc.
- Teams and permissions
- Roles
- Communication

**Staff availability module**
- Employee scheduling
- Track changes to default schedule (full / half day absence)
- Monthly overview of staff
- Historic availability overview of staff
- Notifications on conflicts with horse scheduling

---

**Facility Planning**

Marketing promises:
- Real-time insight into occupancy of all facilities
- Reserve paddock, horse walker, riding arena, or other services from home
- Automatic restrictions per facility (opening/closing hours, max horses)
- Customers schedule online from computer or phone: lessons, paddocks, riding boxes, lunging rings, horse walker, other services
- Restrictions: max horses at same time, min/max reservation duration, max days ahead
- Occupancy visible to everyone; fair, user-friendly reservations

---

**Schedule of Feed and Supplements**

Marketing promises:
- Feed & supplements schedule visible for everyone in the barn
- Feed schedule adjustable from anywhere
- Automatic historical log of everything the horse has received

**Food and medicine module**
- Feed schedule
- Feed types and default quantities
- Add feeds
- Track inventory
- Filter by horse, horse group, owner, etc.
- Monthly feed overview by horse

---

**Financial Administration**

Marketing promises:
- Insight into financial performance of specific services, horses, and the stable as a whole
- Stop losing money due to invoicing errors
- Efficient payment tracking; better cash flow
- Automatic and timely financial reports
- Track income (boarding, training, other) and expenses (feed, vet, facility maintenance)
- Create and send invoices; timely accurate billing

**Finance and invoicing module**
- Track (monthly) billable services by horse / owner
- Track billable activities by horse / owner
- Pricing of services
- Pricing of activities
- Create and send invoices
- Track invoice payments
- Auto-fill invoices
- Track costs and service totals
- Record expenses
- View account balances
- Connect with Yuki, Moneybird, Exact Online

---

**Stud Farm and Breeding Activities**

Marketing promises:
- Record all necessary data regarding semen collection
- Integrate EquineM webshop into website for online orders and payments
- Manage semen stocks, orders and shipments
- Create mare cards and plan mare activities

**Semen collection**
- Semen collection planning and calendar
- Semen collection registration including automatic calculation of doses and straws amounts
- Inventory management (fresh / frozen)
- Inventory destruction registration
- Compliance: semen tracking from collection to insemination

**Mares breeding management**
- Scheduling of mare cycle checks (scans and pregnancy checks) and insemination
- Keep track of pregnancy rates
- Digital mare cards to log all historical activities, cycle information and reporting

**Semen orders receipt and processing**
- Process orders and allow quick repeat orders
- Picklist overview and shipments information
- Send invoices with direct online payment options
- Apply automatically the correct international VAT-%
- Generate sperm guide tickets and breeding certificates

**Webshop / order portal**
- Ordering portal for customers accessible from stable website
- All orders tracked in the system
- Simple online ordering reduces phone calls
- Receive partial or full payment of orders upfront
- Branded portal (logo, colors, general terms); laptop + mobile
- One-time setup support; link from customer website
- Each customer creates private portal account, registers mares, orders semen
- Quick repeat orders, invoicing, payments (including upfront and partial)

---

**Reports and Communication**

- Default reports for the various modules
- Custom reports builder
- Custom email templates
- Send report to owner / contact via email
- Historical reporting

#### Platforms
- **Web** SaaS (primary)
- Customer facility reservations: computer or cell phone
- Stud webshop: laptop + mobile branded portal
- Native consumer iOS/Android app as primary product: **Not found publicly** in source notes (web-first stable ERP)

#### Pricing (modular; configure plan for monthly license)

| Module / dimension | Price |
|--------------------|-------|
| **Horse profiles** (info + arrivals/departures) | **Unlimited horses totally free** |
| **User profiles** (logins to organisation) | 1–9 accounts: **free**; 10+ accounts: **€10** |
| **Activity planning — Full** | **€2.75 per horse** |
| **Activity planning — Care only** | **€1.10 per horse** |
| **Feed & Medicine** | **€10** |
| **Facility planning** | **€10** |
| **Team availability** | **€10** |
| **Finance & Invoicing** | **€35** |
| **Connection Bookkeeping** | **€10** |
| **Studfarm & Webshop** | Contact us |

*Pay only for modules needed. Full operational stack (activity + feed + facilities + team + finance + bookkeeping) approaches an all-in monthly cost comparable to owner-paid all-in pricing — often passed through in boarding fees.*

#### Business model
Modular B2B SaaS paid by the **stable organization**. Owners/vets/staff are typically contacts or sub-logins inside the tenant, not independent ecosystem accounts with portable horse hubs.

#### Integrations
- HorseTelex (pedigree import)
- Bookkeeping: Yuki, Moneybird, Exact Online
- Branded stud order portal embedded via customer website

#### Strengths
- Deepest documented **stable ERP** feature set among EU barn tools (activity + roster + feed + facilities + finance + staff + stud)
- Modular pricing; unlimited free horse profiles
- Strong breeding/stud + webshop suite
- Clear Equus **parity checklist** source (`equus/docs/features/stableModule.md` Parity: EquineM rows)

#### Gaps vs Equus / full horse ecosystem
- Stable-centric tenant model — not horse-as-portable-hub across independent providers
- No ecosystem discovery (owners finding stables publicly as first-class product)
- No horse-scoped bidirectional reviews across independent accounts
- Owners do not pay for a unified multi-provider hub; they sit inside one stable org
- No consumer ride tracking / social / edtech layer
- No FEI/BHA compliance product

#### Differentiators (within stable SaaS)
- Mature modular suite including stud webshop and Dutch/EU bookkeeping connectors
- Care-only vs full activity pricing per horse
- Horse groups tied to rider visibility

#### Key URLs
- https://equinem.com/

---

## Feature Matrix (Cross-Competitor)

Legend: ✅ Full · 🔶 Partial/Light · ❌ Not present · 🔒 Premium/Paid · ⚖️ Mandatory/Regulatory

| Feature area | BHS | ehorses | BHA | FEI App | My Cheval | Equilab | Equestrian App | Ridely | HippoVibe | Happie | Equicty | **EquineM** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Horse profiles | ❌ | 🔶 listings | 🔶 racing | ✅ FEI | ✅ | 🔶 | ✅ | 🔶 | ✅ | ✅ | ✅ | ✅ |
| Health records | ❌ | ❌ | ❌ | 🔶 compliance | ✅ | 🔶 docs | ✅ | 🔶 Health Check | ✅ | ✅ deep | ✅ | ✅ |
| Vaccination tracking | ❌ | ❌ | ❌ | ✅ EI | ✅ | 🔶 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ rules |
| Farrier/dentist logs | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ reminders |
| Deworming reminders | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ auto | ✅ |
| Expense tracking | ❌ | ❌ | 🔶 toolkit | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Calendar / to-dos | ❌ | ❌ | ❌ | ❌ | ✅ | 🔶 | ✅ | 🔶 PRO | ✅ | ✅ | ✅ | ✅ |
| Multi-user yard ops | ❌ | ❌ | 🔶 Racing Admin | 🔶 roles | 🔶 | ❌ | ✅ StallPros | ❌ | ✅ | 🔶 share | ✅ | ✅ best |
| Task / staff scheduling | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ drag-drop | ✅ drag-drop |
| Billing / invoicing | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔶 Platinum | ❌ | 🔶 | ❌ | ✅ Peppol | ✅ + bookkeeping |
| GPS ride tracking | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ best | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Gait AI analysis | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ best | 🔶 | ❌ | ❌ | ✅ | ❌ | ❌ |
| Live safety sharing | ❌ | ❌ | ❌ | ❌ | ✅ SOS | 🔒 Premium | ❌ | 🔒 RideSafe | ❌ | ❌ | ❌ | ❌ |
| Training video library | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ best | ❌ | 🔶 Academy | ❌ | ❌ |
| AI assistant | ❌ | ❌ | ❌ | ❌ | 🔶 roadmap | ❌ | ❌ | ✅ Ridi | ❌ | ✅ chat | ✅ Hoofy | ❌ |
| Social / community | 🔶 BRC | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ groups | ❌ | ❌ | ❌ | ❌ |
| Marketplace / sales | ❌ | ✅ best | ❌ | ❌ | 🔶 roadmap | ❌ | 🔶 | ❌ | 🔶 share pack | ❌ | 🔶 web sync | 🔶 stud shop |
| Insurance bundled | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔶 partners | ❌ | 🔶 referral | ❌ | ❌ |
| Competition compliance | ❌ | ❌ | ✅ racing | ⚖️ FEI | ❌ | ❌ | ❌ | ❌ | 🔶 shows | ❌ | ✅ add-on | ❌ |
| Breeding module | 🔶 awards | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ add-on | ✅ stud+webshop |
| Lesson booking / clubs | 🔶 centres | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔶 Hopoti | ❌ | ❌ | ✅ Equclub | ✅ facilities |
| Facility reservations | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔶 arenas | ✅ best |
| Feed schedules | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔶 | ❌ | ✅ | ✅ | 🔶 | ✅ |
| Fructan/laminitis prevention | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ unique | ❌ | ❌ |
| Rug/blanket advisor | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 🔶 | ❌ | ❌ | 🔶 web tool | ❌ | ❌ |
| Wearables (Watch/Polar) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ Watch | ❌ | ❌ | ❌ | ❌ |
| Web app | ✅ | ✅ | ✅ | ❌ | 🔶 soon | 🔶 billing | 🔶 login | ✅ shop | ✅ | ❌ | ✅ | ✅ |
| iOS + Android | 🔶 Horse i | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔶 web/mobile web |

---

## Pricing Comparison

| Product | Free tier | Paid entry | Mid tier | Top tier | Model |
|---------|-----------|------------|----------|----------|-------|
| **BHS** | — | £56/yr Silver | £108/yr Gold Adult | £216/yr Friend | Membership + insurance |
| **ehorses** | 2 listings/yr | ~£21/listing | ~£52/mo Premium | ~£87/mo Premium PLUS | Marketplace freemium |
| **BHA** | Browse free | £168/yr active owner | — | £405 join (syndicate) | Regulatory fees |
| **FEI HorseApp** | Free | — | — | — | Regulatory (fines for non-compliance) |
| **My Cheval** | Free (claimed) | $4.99/mo Pro | $9.99/mo Pro Plus | $99/yr Pro Plus | Freemium IAP |
| **Equilab** | 1 horse, basic | $11.99/mo | $89.99/yr | Team plans | Freemium SaaS |
| **Equestrian App** | 2 horses Bronze | $3.95/mo Silver | $5.95/mo Gold | $9.95/mo Platinum | Freemium + lifetime |
| **Ridely** | Limited (~78 videos) | $35/mo PRO | $149/yr PRO | $449 lifetime | Edtech subscription |
| **HippoVibe** | 14-day trial | ~€3/horse/mo | scales by count | 100+ custom | Per-horse B2B SaaS |
| **Happie Horse** | Unlimited horses free | €9.99/mo | €45–89.99/yr | €149–199 lifetime | Freemium consumer |
| **Equicty** | 21-day trial | ~€30+/mo | +Competition/Finance/Breeding | 250+ custom | Modular B2B SaaS |
| **EquineM** | Unlimited horses free; 1–9 users free | Activity €1.10–€2.75/horse | Modules €10–€35 | Stud: contact | Modular B2B (stable pays) |

---

## Strategic Gaps & Opportunities for Our App

Based on this benchmark, the following whitespace represents the strongest differentiation opportunities:

### 1. Unified owner lifecycle (nobody owns this end-to-end)
- **Acquisition:** ehorses owns buy/sell; no competitor bridges listing → purchase → onboarding into a care record
- **Daily care:** My Cheval, Happie, Equestrian App overlap but none is clearly best-in-class at everything
- **Training:** Equilab (rides) + Ridely (education) are separate products owners must stitch together
- **Competition:** FEI/BHA/BRC are siloed compliance layers, not integrated into owner UX
- **Sale/retirement:** Equestrian App "Carfax" and HippoVibe share-packs are fragments, not a full exit workflow

### 2. Health depth + pro ops in one product
- **Happie** owns prevention (fructan, PPID, pollen) but lacks yard billing
- **EquineM / Equicty / HippoVibe** own pro ops but lack consumer metabolic/pasture intelligence
- **Opportunity:** Owner-grade health intelligence that scales up when a yard manages the horse

### 3. Multi-stakeholder collaboration done right
- **EquineM** models staff inside one stable tenant (contacts/sub-logins) — strong ops, weak independent-provider network
- **Equestrian App** has the right multi-party journal model but dated UX
- **Equicty** has pro collaboration but is B2B-priced and heavy
- **Opportunity:** Modern, permissioned care network (owner ↔ trainer ↔ vet ↔ farrier ↔ yard) without requiring everyone to pay enterprise prices or live inside one stable org

### 4. Compliance as integration, not replacement
- FEI HorseApp and BHA Racing Admin are mandatory for their niches — integrate/export rather than compete
- BHS insurance + education is a trust layer — partner or match on PL/PA for UK market

### 5. Pricing white space
- **Under $10/mo** full owner suite with unlimited horses: only Equestrian App (lifetime) and Happie (yearly promo) come close, both with UX/feature trade-offs
- **Pro yards** pay EquineM-style modular fees (€1.10–€2.75/horse activity + €10–€35 modules) or €3–30+/horse elsewhere — often passed to owners via boarding; Equus owner-paid hub can be cost-comparable while giving owners the portable record

### 6. Features competitors have that we should not ignore
| Must-have (table stakes) | Nice-to-have (differentiators) |
|--------------------------|-------------------------------|
| Horse profile + passport fields | Fructan/laminitis risk (Happie) |
| Health reminders (vaccines, farrier, worming) | Rug/blanket advisor (My Cheval) |
| Calendar with recurring events | Live ride safety sharing (Equilab/Ridely) |
| Document/photo storage | Gait AI on rides (Equilab/My Cheval) |
| Expense tracking per horse | AI assistant on horse data (Happie/Equicty) |
| Multi-user sharing with permissions | Care history on sale listings ("Carfax") |
| Push notifications | FEI/BHA data export compatibility |
| iOS + Android (+ web) | Training content or partner integration (Ridely) |
| **EquineM parity:** drag-drop activity, feed, facilities, finance, staff, horse groups | Stud webshop (EquineM/Equicty) — defer unless ICP is stud |

### 7. What to explicitly deprioritise (unless our ICP demands it)
- Racing regulation (BHA) — niche, mandatory incumbent
- FEI biosecurity app — integrate, don't rebuild
- BHS membership/education — partner, don't replicate charity model
- Full breeding stud ERP / semen webshop — EquineM and Equicty own this for pro studs
- 500+ Olympian video library — Ridely owns edtech; partner instead
- Rebuilding EquineM's **tenant model** (stable owns all contacts) — Equus exceeds by making providers independent accounts on the same horse

---

*Document maintained for product strategy. Re-verify pricing on official sites before commercial decisions — several competitors show regional/promo variance and website vs app-store price differences.*
