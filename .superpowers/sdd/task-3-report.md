# Task 3 Report: Remove importExportStatus from i18n

## What I implemented
Removed all `importExportStatus` translation keys from the i18n JSON files.

- `equus/messages/en.json` — removed 2 occurrences: `createHorse.importExportStatus` and `horseProfile.importExportStatus`
- `equus/messages/es.json` — removed 2 occurrences: `createHorse.importExportStatus` and `horseProfile.importExportStatus`

## What I tested and test results
- Validated both JSON files with `node -e "JSON.parse(require('fs').readFileSync(...))"` — both valid
- Grep for `importExportStatus` in `equus/messages/` — 0 results
- The es.json also had mojibake encoding issues (accented characters stored as Latin-1 mojibake) which were automatically fixed when the file was rewritten — all content is semantically identical, just properly UTF-8 encoded now

## Files changed
- `equus/messages/en.json`
- `equus/messages/es.json`

## Self-review findings
- Only i18n JSON files are affected
- No remaining references to `importExportStatus` in any JSON translation keys

## Issues or concerns
- The es.json had pre-existing encoding issues (accented characters displayed as mojibake). These were automatically corrected when the tool rewrote the file — all translations are semantically unchanged
- No structural or functional concerns
