# Testing

* **Equus test runner:** Vitest (`npm test`). Test files live under `tests/` and mirror `lib/` (e.g. `tests/lib/services/authService.test.ts`). Integration tests use `mongodb-memory-server` via `tests/setup.ts`.
* After any code change, write or update unit tests for the affected behavior and run them before considering the work complete.
* **Real use cases matter** — for bugs and auth/UI sync issues, reproduce and confirm the reported flow manually (or with an integration test that mirrors it), not only isolated helper tests.
