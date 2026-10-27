# Changelog

This file records user-visible changes from the current development line. No release tags have been published yet.

## Unreleased

- Added a reproducible Docker Compose development stack, CI checks, and environment templates.
- Added frontend behavior tests, backend request metrics, structured logs, and offline student device tests.
- Added clearer errors for failed student and device operations.
- Covered sidebar, carousel, and logout interactions; enforce 50% statement coverage across shared frontend components.
- Protected role and password routes with authorization tests and removed the broken legacy gate lookup.
- Added a configurable student-system JSON adapter, persistent device delivery status and retry, access-event auditing, staff dashboards, and PostgreSQL integration checks.
- Queued card and photo delivery with leased worker claims, per-device reconciliation status, and manual retries.
- Added signed reader decisions, versioned location policies, temporary exceptions, and registrar record scope.
- Added configurable audit retention, student detail view auditing, readiness and operational metrics, alert examples, and Playwright browser tests.

When publishing a release, move relevant entries to a dated version section and create a matching Git tag.
