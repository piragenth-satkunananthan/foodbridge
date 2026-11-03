# Backend proposal alignment

Baseline: ae0f315. Scope: backend only. Module branches were locally fast-forwarded with user approval. The user subsequently authorized publishing all five branches and merging through develop to production using the existing CI/CD pipeline.

## Acceptance rules

- Only active, verified organizations may claim compatible posts. Public admin registration is forbidden.
- Claims and lifecycle changes must be atomic, with one active pickup per source. Failed operations leave no partial allocation.
- Collection must occur within the availability/deadline window. Expired uncollected jobs become terminal; in-transit jobs retain their history.
- Couriers record collection and arrival. The receiving organization confirms acceptance/processing before completion. Non-recyclable disposal is not recycling.
- Quantities use explicit supported units. Estimated meal/weight conversions are labelled; unknown units produce no invented impact.
- Matching filters material, storage, food preferences, capacity and service area before ranking. District distances remain labelled estimates.
- Cancellation retains pickup history. Deleted accounts retain audit references through suspension/anonymization policy rather than orphaning active work.
- Demonstration activity is excluded from public real-activity reporting. Snapshots are cumulative; period reports use completion dates for outcomes.

## Work and evidence

- [x] Shared validation, database transactions and isolated API test harness (Module 5 foundation).
- [x] Donor posting, edit validation, availability and instructions (Module 1).
- [x] Organization onboarding, verification, complaints and moderation (Module 5).
- [x] Atomic recipient claims, eligibility and cancellation history (Module 2).
- [x] Conservative classification and collector lifecycle (Module 3).
- [x] Authorized pickup tracking and confirmed receipt (Module 4).
- [x] Unified impact, notifications, reports and demo isolation (Module 5).
- [x] Combined API, concurrency, failure recovery and existing regression checks; backend CI configuration.

Validation uses disposable test databases only. Each module owns its changes; shared dependency commits are carried to dependent branches. Rollback is by reverting task commits, without rewriting existing history.

External integrations: no cloud image provider is currently configured. Provider credentials and deployment configuration cannot be invented. Existing URL photos remain supported; any unavailable integration will be recorded explicitly.

## Local branch ownership

Each module's fixes were committed on its assigned branch. Shared prerequisites and completed module fixes were cherry-picked locally where needed. The combined checkout for acceptance is `feature/module-5-admin-impact`; the other branches are module-specific and do not each contain the complete combined result.

| Module | Assigned branch | Implementation and refinement commits |
| --- | --- | --- |
| 1 | feature/donor-surplus | 04f9df4, 00493de |
| 2 | feature/module-2-recipient-matching | 7acf3b0, 3c67ef9 |
| 3 | feature/module-3-waste-recycler | b725aa4, 0d03852 |
| 4 | feature/module-4-volunteer-pickup | 8a48d56, d7ca58a |
| 5 | feature/module-5-admin-impact | 994b6d2, 2153bae, a06063f, ea93c14, b94d4df |

Combined runtime/CI and data preflight are recorded in `ebec747` on Module 5.

## Validation evidence (2026-11-03)

- `npm run test:all`: 24 real HTTP tests, 8 Node test-runner unit/schema cases, and existing module utility/schema assertions pass.
- Node 20 production image: `npm test` and all 24 HTTP tests pass against a disposable replica set.
- Regression coverage includes simultaneous allocation, organization capacity races, injected failures after intermediate writes, notification rollback, authorization/privacy, receipt rejection, expiry, composting versus disposal, completion-date reporting and demo exclusion.
- Production backend Docker image builds. The final rebuild used `--network host` after two package downloads stalled on Docker's default network; the stalled task-owned build was stopped. Both Compose configurations parse successfully. The existing application stack was not restarted.
- The read-only data preflight accepts an empty disposable replica set and flags a legacy organization without capacity; checks confirmed that it changed no records and created no collections. Node 20's built-in development watcher starts successfully.
- `npm ci --ignore-scripts`, `npm audit` and `npm audit --omit=dev` pass with zero reported vulnerabilities after replacing Nodemon with Node's built-in watcher.
- `git diff --check` passes. No authored changes under `frontend/` relative to the agreed baseline `ae0f315`.
- At the initial local completion checkpoint, remote CI had not run and nothing had been pushed or deployed. Publication evidence is recorded below.

## Proposal assessment and remaining work

The proposal's core backend lifecycle is implemented: structured posting, explicit food/waste branching, verified organization eligibility, capacity-aware claims, tracked transport, receiving-party confirmation, governance and activity-based reporting. The proposal correctly leaves food acceptance to the receiving organization; the API now enforces that distinction before reporting rescued food. Material classification is deterministic guidance and requests clarification for ambiguous inputs.

Distance and journey time are estimates, not road navigation. Whole-batch allocation and declared quantities are explicit implementation assumptions. Meal conversions are labelled estimates; no unsupported emissions model or recycling certification is presented as fact.

Cloud photo upload and road-routing integrations remain unimplemented provider dependencies. Their absence means the complete proposal is not yet delivered. Map/route display and all frontend changes remain outside this task, including the new organization profile and receipt/processing forms. Existing frontend callers must be updated before rollout.

Before any deployment, back up and reconcile existing data using the read-only `npm run db:check` report and the steps in [BACKEND-API.md](BACKEND-API.md). Existing capacities, reservations, active-pickup flags, old completion records and demo provenance require review; none were guessed or migrated in project/deployed data. The single-member replica set supplies transactions, not high availability.

## Publication review (2026-11-03)

All five module branches were pushed and their GitHub CI runs passed. An independent `codex review --base origin/develop` identified legacy organization links as an upgrade concern. Commit `83edf33` adds a partial unique index, read-only missing/duplicate-link checks and a database regression test. The expanded backend gate passes 25 HTTP tests; frontend tests and production build also pass without frontend edits. GitHub CI passed for `83edf33`.

The follow-up `codex review --commit 83edf33` warned that an already-deployed unconditional index would need migration. This does not apply to the requested upgrade: the actual production/develop baseline `ae0f315` declares no organization index, and the interim unconditional index existed only in the unpublished backend implementation. No production database migration is claimed. Operators of any separately deployed interim build must reconcile its index before upgrading.

The user requested deployment through the existing CI/CD pipeline. That pipeline does not run the documented legacy-data preflight. Real-data reconciliation and UI integration remain rollout limitations, and a passing build or health endpoint does not prove those workflows are ready for existing users.
