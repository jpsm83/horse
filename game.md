# 🐵 Monkey Vortex — Game Design Document (Draft)

> Status: **early draft** — everything here is open for brainstorming and polish.
> This document replaces the earlier Gemini/ChatGPT notes with our consolidated design.

---

## 1. The Pitch & Identity

**Physics-based battle board game.** You draft a squad of 5 monkeys and battle opponents on a circular arena of rotating concentric rings. You aim and fire with slingshot physics while rotating the rings themselves to align shots, expose enemies, or make the board kill for you.

*Predictable strategy + unpredictable physics, in 3–7 minute matches.*

**Platform:** mobile-first, touch controls (tap unit → drag to aim → release; swipe ring → rotate).
**Multiplayer:** online real-time with timed turns (no waiting on afk players).
**Aesthetic:** toy battlefield inside a mechanical circular machine — chunky monkey units, funny deaths, exaggerated physics, personality.

**Core loop:** MOVE → MANIPULATE → AIM → SHOOT → REACT → COMBO

---

## 2. The Board

- **Concentric rings** (3–7), each divided into fixed segments/lanes (clock positions). Rings rotate **1–2 segments** at a time — predictable enough to strategize, physics make outcomes unpredictable.
- **The Eye (center):** max firing range, max danger, or objective.
- **Ring physics:** each ring has behavior — normal, rotating, slippery, magnetic, gravity, explosive.
- **Scales with players:**
  - 2 players → 3 rings
  - 3 players → 4 rings
  - 4 players → 5 rings
  - 6 players → 6–7 rings
- **Board elements:** destructible walls (wood/stone/ice), holes, ramps, portals, cannons, mines, moving platforms, pickups.
- **Asymmetry:** not every ring is uniform — sections contain different objects; rotating a ring changes what lines up.

---

## 3. Turn Structure (the rules)

### Timed turns with a shrinking clock
- Start at ~**30s** per turn; as the match progresses the timer shrinks (25s → 20s …), forcing faster play and guaranteeing the match ends.

### 2 Action Points (AP) per turn
1. **Maneuver** — move a monkey (radially between rings, or around the ring)
2. **Manipulate** — rotate a ring
3. **Fire** — shoot with the monkey's power (see Section 4)

### Pickups & superpowers
- Pickups spawn on the board and grant **extra AP** or a **one-shot superpower**: overload shot, ring freeze, gravity shift, magnet pull.
- Grabbing a pickup is itself a tactical gamble.

### Death & resurrection
- Dead monkeys **stay on the board as corpses** — they block lanes, act as cover, and can be used as shields.
- A **resurrection element** spawns on the board; a monkey standing on it can revive one of your dead units.
- Permanent death otherwise — losing all 5 monkeys ends your match.

---

## 4. Monkeys (the draftable units)

All units are **monkeys with different shoot powers**. Each power is defined by **attack type, range (in rings), and effect**, mapped onto the ring-lane structure.

### Example monkey types
| Monkey | Attack type | Range | Effect |
|---|---|---|---|
| 💣 **Bomber** | Lobbed projectile | up to 2 rings | Explodes on landing area + 1 ring around it (AoE) |
| 🔨 **Breaker** | Straight shot | 3 rings | Breaks walls |
| 🔥 **Torch** | Line flame | 3 rings | Burns everything in a straight line from itself to ring 3 |
| 🎯 **Sniper** *(idea)* | Straight, precise | long range | High damage, limited movement |
| 🏀 **Bouncer** *(idea)* | Bouncing projectile | variable | Gains power per bounce |
| 🪝 **Hook** *(idea)* | Hook shot | mid range | Pulls an enemy toward you |
| 🧊 **Ice** *(idea)* | Projectile | mid range | Freezes a ring in place |
| 🏃 **Scout** *(idea)* | — | — | Fast, extra movement, weak attack |

### Squad draft
- Each player fields **5 monkeys**, drafted from the monkey types they've unlocked.
- **Duplicates:** allowed (capped) — e.g. 2 bombers + torch + 2 bouncers. *(TODO: decide exact caps)*

### Unlock progression
- New players start with **3 types**; gaining experience unlocks more monkeys with different powers.
- Cosmetics + new board themes as additional unlock layers.
- **No pay-to-win stats** — progression unlocks content, not raw power.

---

## 5. Win Conditions (selectable modes)

- **Deathmatch** — last player with living monkeys wins
- **Core Control** — hold the Eye for X turns
- **Protect the Commander** — one monkey is your commander; kill the enemy's commander
- **Treasure Run** — get a monkey to the Eye and back out
- **Last Stand** — one player gets progressively stronger
- **Team Battle** — 2v2 / 3v3

---

## 6. Catchiness / "One More Game" Pillars

- **3–7 minute matches.** Every turn should produce something visually satisfying.
- **Chain reactions:** shoot barrel → explosion knocks enemy → enemy hits wall → wall collapses → ring rotates → new passage → second shot → enemy falls in Eye → **COMBO x5**.
- **Knockout slow-mo replay** + shareable clip button for satisfying kills.
- **Shot preview trail** showing predicted first bounces (fast learning).
- **Combo fever:** combo multiplier carries to your next turn, rewarding greedy multi-ring setups.
- **Collapsing arena:** rings drift inward / lose segments as the timer shrinks, forcing contact and ending matches naturally.
- **Ring drift:** rings rotate slowly on their own when no one acts — ambient pressure.
- **Every shot must move something:** design rule — even a miss should smash debris, knock a wall, or clear a lane.

---

## 7. Open Questions / Polish List

- [ ] Exact duplicate caps in squad draft
- [ ] Full roster of monkey types (add/balance powers, ranges, AoE shapes)
- [ ] Turn timer curve (30s → ? per mode)
- [ ] Pickup types, spawn frequency, and balance
- [ ] Resurrection element spawn rules (how often, where)
- [ ] Which win modes ship first (recommended: Deathmatch + Core Control)
- [ ] Board theme worlds (wooden → pirate ship → volcanic core → frozen machine → alien planet)
- [ ] Prototype scope: 2 players, 3 rings, 3 units each, one cannon, one rotating ring, simple walls, basic physics, one win condition
