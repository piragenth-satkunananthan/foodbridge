# Backend proposal alignment

Baseline: ae0f315. Scope: backend only. Module branches were locally fast-forwarded with user approval. No publication or deployment is authorized.

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

- [ ] Shared validation, database transactions and isolated API test harness (Module 5 foundation).
- [ ] Donor posting, edit validation, availability and instructions (Module 1).
- [ ] Organization onboarding, verification, complaints and moderation (Module 5).
- [ ] Atomic recipient claims, eligibility and cancellation history (Module 2).
- [ ] Conservative classification and collector lifecycle (Module 3).
- [ ] Authorized pickup tracking and confirmed receipt (Module 4).
- [ ] Unified impact, notifications, reports and demo isolation (Module 5).
- [ ] Combined API, concurrency, failure recovery and existing regression checks; backend CI.

Validation uses disposable test databases only. Each module owns its changes; shared dependency commits are carried to dependent branches. Rollback is by reverting task commits, without rewriting existing history.

External integrations: no cloud image provider is currently configured. Provider credentials and deployment configuration cannot be invented. Existing URL photos remain supported; any unavailable integration will be recorded explicitly.
