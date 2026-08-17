# Testing — how to write tests

**Job:** Vitest layout and when tests are required. Not product behavior.  
**Also open (only if needed):** the module under test (code + its engineering file). Do not open extra convention files to write a test.

- **Runner:** Vitest (`npm test`). After any code change, write or update unit tests for the affected behavior and run them before considering the work complete.
- **Real use cases matter** — for bugs and auth/UI sync issues, reproduce and confirm the reported flow manually (or with an integration test that mirrors it), not only isolated helper tests.

## Where tests live

Module tests sit in a **`__tests__/`** folder (plural) next to the source they cover — not in a mirrored top-level `tests/lib/...` tree, and not inside the production `.ts` / `.tsx` file.

```
lib/services/authService.ts
lib/services/__tests__/authService.test.ts

components/user/profile/profile-form.tsx
components/user/profile/__tests__/profile-form.test.ts
```

Several test files for one module stay in the same `__tests__/` folder:

```
lib/services/ownershipTransferService.ts
lib/services/__tests__/ownershipTransferService.test.ts
lib/services/__tests__/ownershipTransferService.transferMain.test.ts
```

### Shared harness (keep centralized)

`tests/` is only for setup and fixtures that many suites share — not a second copy of the source tree.

```
tests/setup.ts
tests/helpers/businessRoleFixtures.ts
```

Integration tests use `mongodb-memory-server` via `tests/setup.ts`.

### Rules

- Folder name is **`__tests__`**, not `__test__`.
- Never import `__tests__/` from app, `lib/`, or route code.
- Do not put tests inside shadcn files under `components/ui/` unless Equus owns that file.
- Prefer `__tests__/` beside `lib/` (or a private `_` folder) over scattering tests as if they were App Router pages.

### Migration

Existing files under `tests/lib/`, `tests/components/`, `tests/app/`, etc. still run until moved. **New tests follow `__tests__/`.** When you touch a module, move its tests into that module’s `__tests__/` folder and update Vitest include if needed. Do not mix sibling `*.test.ts` next to source, `__tests__/`, and the old mirror for the same module.
