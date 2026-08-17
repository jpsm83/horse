# MongoDB models — how to write schemas

**Job:** Model file naming and deactivate-not-delete. Not tombstone field lists or transfer contracts.  
**Also open (only if needed):** tombstone fields / hard-delete exceptions → [`../engineering/dataLifecycle.md`](../engineering/dataLifecycle.md). GDPR scrub → [`../engineering/piiAnonymization.md`](../engineering/piiAnonymization.md). Ownership apply → [`../engineering/ownershipTransfer.md`](../engineering/ownershipTransfer.md). New collab vs horse↔provider link → [`../engineering/workplace.md`](../engineering/workplace.md) or [`../engineering/relationships.md`](../engineering/relationships.md).

- **File naming:** own-collection models are PascalCase singular matching the model (`User.ts`, `Horse.ts`); reusable embed schemas are camelCase under `models/sharedSchemas/`; parent-only embeds are inline in the parent file.
- **No hard deletes** on domain documents — deactivate via `lib/lifecycle/deactivateDocument.ts` + `deactivationAuditFields`. Anonymize inactive user PII via `lib/lifecycle/anonymizeUserPii.ts`. Allowed hard-delete exceptions live in dataLifecycle — do not invent new ones.
- **Do not** put ownership or collaboration as bare refs on the wrong collection. Ownership changes go through `OwnershipTransfer`; host collab through `WorkplaceRelationship`; horse↔provider through `Relationship`.
