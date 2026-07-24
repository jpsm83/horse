# Horse disciplines-only (remove primaryDiscipline)

## Goal

Horse has a single discipline property: `disciplines: string[]` (multi-select). Remove `primaryDiscipline` from model, API, forms, UI, docs, and tests. Migrate existing documents before/with deploy.

## Data & API

- Remove `primaryDiscipline` from `Horse` schema.
- Keep `disciplines: { type: [String], enum: horseDisciplineEnums }`.
- Replace index `{ saleStatus: 1, primaryDiscipline: 1 }` with `{ saleStatus: 1, disciplines: 1 }`.
- Drop `primaryDiscipline` from Zod create/update schemas, form schemas, service DTOs, and `horseClient` types.
- One-time migration: for each horse with `primaryDiscipline`, append to `disciplines` if missing, then `$unset` `primaryDiscipline`. Drop old index.

## UI

- Profile: remove Disciplines section; add multi-select `disciplines` to About (above description).
- Create horse: only multi-select `disciplines` (no primary).
- Hub and horse cards: show `disciplines` joined with ` · `.

## Cleanup

- Delete `disciplines-section.tsx`.
- Fold disciplines into about form schema; remove `disciplinesFormSchema` / `DisciplinesFormValues`.
- Remove unused i18n keys (`primaryDiscipline`, disciplines section strings); relabel create “Other disciplines” → “Disciplines”.
- Update `documentation/horses.md` and tests.
