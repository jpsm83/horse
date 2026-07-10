### Task 4: Add `metadata` namespace to `messages/en.json`

**Files:**
- Modify: `messages/en.json`

- [ ] **Step 1: Add metadata translations before closing brace of en.json**

Read the current end of `messages/en.json` first. Find the last key-value pair and add the metadata namespace before the closing `}`.

The content to add is a JSON object with keys for every page type. Each key has `title`, `description`, and `keywords` fields. The keys are:

`home`, `homeDashboard`, `horses`, `stables`, `breeders`, `transport`, `trainers`, `groomers`, `riders`, `coaches`, `farriers`, `veterinaries`, `ridingClubs`, `workplaces`, `relationships`, `ownershipTransfers`, `users`, `signin`, `signup`, `forgotPassword`, `resetPassword`, `confirmEmail`, `resendConfirmation`, `profile`, `notifications`, `notFound`, `notAllowed`

Each key object follows this pattern (with page-specific values):

```json
"horses": {
  "title": "Horses | Equus",
  "description": "Browse horses in the Equus network. Find horses by breed, discipline, and location.",
  "keywords": "horses for sale, horse listings, equestrian, horse breeds"
}
```

The `home` key title is `"Equus — Horse & Equestrian Network"` (no `| Equus` suffix since "Equus" is already in the title). All other titles end with `| Equus`.

For auth/private pages like signin, forgotPassword, etc., keywords should be `""`.

- [ ] **Step 2: Verify valid JSON**

```bash
npx --yes jsonlint messages/en.json || node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"
```

- [ ] **Step 3: Commit**

```bash
git add messages/en.json
git commit -m "feat(seo): add English metadata translations"
```
