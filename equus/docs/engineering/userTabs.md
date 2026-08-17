# User account tabs

**Job:** `/user/[userId]` tab map (self only).  
**Upstream:** [`../features/userModule.md`](../features/userModule.md)  
**Status:** **drift** (Subscription tab is owner-tier horse billing)  
**Code roots:** `lib/navigation/userTabs.ts`, `app/[locale]/user/[userId]/`, `components/user/`

Profile Save: [`profile.md`](profile.md). Workplace: [`workplace.md`](workplace.md). Billing target: [`billing.md`](billing.md).

---

## Shipped

| Tab | Route | Purpose |
|-----|-------|---------|
| Hub | `/user/[userId]` | Same `UserHubContent` as public `/users/[userId]` |
| Profile | `…/profile` | Identity / security / deactivate |
| Preferences | `…/preferences` | Theme, language, L1 privacy, DMs |
| Notifications | `…/notifications` | Email opt-ins |
| Workplace | `…/workplace` | Collab invites + active workplaces |
| Relationships | `…/relationships` | Horse↔provider inbox |
| Subscription | `…/subscription` | **User horse-count plan** |

Chrome: `UserLayoutChrome` + `EntityTabs`. Gate: `UserPageShell` (auth + self).

---

## Target

Remove or replace **Subscription** on the user account. Payer UI lives on the **paid entity** (stable owner portal / billing). Home after login is [`myGraph.md`](myGraph.md), not this Hub.
