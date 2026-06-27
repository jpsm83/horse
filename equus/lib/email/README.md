# Equus transactional email

Centralized Gmail-based email templates and transport for Equus.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `EMAIL_USER` | Yes | Gmail address (SMTP user and `from` identity) |
| `EMAIL_PASSWORD` | Yes | Gmail app password |
| `AUTH_URL` | Yes | Base URL for links in emails (see `lib/auth/config.ts`) |

## Email links → web routes

Links are **locale-prefixed** when the recipient’s `preferredLanguage` is `es` (via `buildLocalizedAppLink` in `i18n/appLinks.ts`). English uses unprefixed paths (`localePrefix: as-needed`).

| Email / link builder | English route | Spanish route | API consumed |
|----------------------|---------------|---------------|--------------|
| `buildConfirmEmailLink` | `/confirm-email?token=` | `/es/confirm-email?token=` | `POST /api/v1/auth/confirm-email` |
| `buildResetPasswordLink` | `/reset-password?token=` | `/es/reset-password?token=` | `POST /api/v1/auth/reset-password` |
| (sign-in entry) | `/forgot-password` | `/es/forgot-password` | `POST /api/v1/auth/request-password-reset` |
| (sign-in entry) | `/resend-confirmation` | `/es/resend-confirmation` | `POST /api/v1/auth/request-email-confirmation` |
| `buildStaffInviteSignupLink` | `/signup?ref={membershipId}` | `/es/signup?ref=…` | register + `/workplaces?membership=` |
| `buildStaffInviteAcceptLink` | `/workplaces?membership={id}` | `/es/workplaces?membership=…` | workplaces accept/decline |
| `buildRelationshipSignupLink` | `/signup?ref={referralReference}` | `/es/signup?ref=…` | register + `/relationships` |

Non-prefixed links in already-sent emails still work: next-intl proxy resolves locale from `NEXT_LOCALE` cookie or `Accept-Language`.

## Module layout

```
lib/email/
  sendEmail.ts              # Nodemailer Gmail transport
  links.ts                  # Localized signup, staff, relationship URLs
  layout.ts                 # Shared branded HTML shell
  templates/
    emailConfirmation.ts    # Auth: confirm email (en/es)
    passwordReset.ts        # Auth: reset password (en/es)
    staffInvite.ts          # Staff membership invite (en/es)
    relationshipInvite.ts   # Horse relationship invite (en/es)
  sendStaffInviteEmail.ts
  sendRelationshipInviteEmail.ts
```

## Template catalog

| Template | Trigger | Locale source |
|----------|---------|---------------|
| Email confirmation | Register / resend | `user.personalDetails.preferredLanguage` or `en` |
| Password reset | Forgot password | same |
| Staff invite | `POST .../staff` | invitee preference if user exists, else `en` |
| Relationship invite | Future relationship API | invitee preference when available |

## Sending pattern

Domain code builds template content, then calls `sendTemplateEmail({ to, content })`. Auth flows roll back tokens on send failure; staff invites delete the membership if email fails.

## i18n

Templates support **en** and **es** only. Pass `locale` from `normalizeLocale` / `resolveEmailLocale` when sending. See [`documentation/i18n.md`](../../documentation/i18n.md) for web routing and preference priority.
