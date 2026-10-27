# One Card System

Campus access control application with a Next.js/Redux frontend and a Go/Gin API. PostgreSQL stores users, devices, and student records. Device synchronization and SMTP need real external services when those features are used; the development setup starts without them.

See [CONTRIBUTING.md](CONTRIBUTING.md) for change and test guidance, [CHANGELOG.md](CHANGELOG.md) for the current development changes, and [SECURITY.md](SECURITY.md) for the historical credential audit.

## Quick start with Docker

Install Docker with Compose, then run from the repository root:

```sh
cp .env.example .env
docker compose up --build
```

Open <http://localhost:3000>. The frontend liveness endpoint is <http://localhost:3000/api/health>. The API is at <http://localhost:8888>, its liveness endpoint is <http://localhost:8888/healthz>, its database readiness endpoint is <http://localhost:8888/readyz>, and metrics are at <http://localhost:8888/metrics>. Compose starts PostgreSQL, runs the database migration, and starts both applications. The Compose defaults are **development only**. Replace the `API_SECRET` and `DB_PASSWORD` placeholders before exposing the stack outside your machine. Restrict access to `/metrics` when deploying the API publicly.

## Local install

Use Go 1.26.10 or newer, Node.js 20.9 or newer, npm, and PostgreSQL. From a fresh clone:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cd backend && go mod download
cd ../frontend && npm ci --ignore-scripts
```

Edit `backend/.env` with your PostgreSQL connection and a random `API_SECRET`. For a local PostgreSQL instance without TLS, leave `DB_SSLMODE=disable`; use `require` when the server supports TLS. The backend reads `.env` when present and also accepts environment variables from the process.

## Run locally

Start PostgreSQL first. In one terminal:

```sh
cd backend
go run ./migrate
go run .
```

In another terminal:

```sh
cd frontend
npm run dev
```

The frontend expects `NEXT_PUBLIC_API_SERVER_URL=http://localhost:8888`. Visit <http://localhost:3000>. The API health route does not require authentication. Student synchronization runs only when `SERVICE` is configured with a reachable student-system URL. Connected access devices and SMTP need valid credentials and reachable services.

## Test and checks

From a fresh clone, install Node.js 22 and the Go version in `backend/go.mod`, then run `sh scripts/verify.sh` at the repository root. It installs the locked frontend dependencies and runs frontend lint, format, type, coverage, and build checks plus Go vet, build, and unit tests. CI runs this same root command from a clean checkout on every push and pull request. Browser and PostgreSQL integration tests run in separate CI jobs.

```sh
cd backend
go build ./...
go test ./...

# With a disposable PostgreSQL database:
INTEGRATION_DB_DSN='postgres://onecard:password@localhost:5432/onecard_integration?sslmode=disable' go test -tags=integration ./controllers/registrarcontrollers
INTEGRATION_DB_DSN='postgres://onecard:password@localhost:5432/onecard_integration?sslmode=disable' sh scripts/check-coverage.sh

cd ../frontend
npm ci --ignore-scripts
npm run lint
npm run typecheck
npm test
npm test -- --coverage
npm run test:core-coverage
npx playwright install chromium
npm run test:e2e
npm run build
```

CI runs these checks on pushes and pull requests, including a PostgreSQL-backed integration test, plus `npm audit --audit-level=high` and `govulncheck ./...`. The frontend requires at least 50% statement, line, and function coverage across application TypeScript files; Playwright specs and build configuration are excluded because they run through separate checks. It also requires 50% statement coverage across `frontend/components`. A separate core gate requires 50% statements, lines, and functions across key student, user, device, chart, and user-list flows. Role, permission, chart, and user-list files each also require 50% statements. The backend gate requires at least 50% statement coverage in `controllers/registrarcontrollers`; it does not set a threshold for the entire backend.

The Playwright browser job starts Next.js on port 3100 and uses mocked API responses to exercise login, card checks, policy editing, and temporary exceptions without production credentials.

## Environment variables

Copy the example files; never commit the resulting `.env` files. The root `.env.example` configures Compose. `backend/.env.example` documents:

| Variable | Purpose |
| --- | --- |
| `API_PORT`, `API_SECRET` | API listener port and token signing secret |
| `DB_DRIVER`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE` | Database connection and PostgreSQL TLS mode |
| `DEVICE_USERNAME`, `DEVICE_PASSWORD` | Credentials for access control devices |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Outbound email settings |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` | Optional pgAdmin settings; pgAdmin is not part of Compose |
| `SERVICE`, `SERVICE_TOKEN` | Student-system HTTP endpoint and optional bearer token |
| `READER_HMAC_KEYS` | JSON map from registered reader serial number to its HMAC secret |
| `ACCESS_EVENT_RETENTION_DAYS`, `STUDENT_VIEW_AUDIT_RETENTION_DAYS` | Automatic audit retention in days; `0` disables deletion |

`frontend/.env.example` contains `NEXT_PUBLIC_API_SERVER_URL`, the API URL visible to the browser. Optionally set `NEXT_PUBLIC_ERROR_REPORTING_URL` to an HTTPS collector that accepts a JSON `POST` with `context`, `message`, and `timestamp`. The frontend sends no cookies or original API response body to that collector, and reporting failures never block the user action. Both `NEXT_PUBLIC_` values are embedded into the frontend build, so rebuild after changing them. Do not put a secret in either URL.

Credentials were previously committed to this repository. If they were real, rotate them in the database, devices, SMTP service, and any other affected system; removing the files now does not erase git history.

## Student-system and device synchronization

Set `SERVICE` to an absolute HTTP(S) URL. The source must answer `GET` with JSON shaped like `{"students":[{"student_id":"ST1","first_name":"Ada","father_name":"Example","grand_father_name":"Test","email":"ada@example.com","phone":"0982010311","sex":"Female","date_of_birth":"2000-01-02","program":"Science","section":"A","year":1,"semester":1,"religion":"","registered_date":"2026-01-01","status":"Active"}]}`. Dates use `YYYY-MM-DD`; status is `Active` or `Inactive`. If the source needs a bearer token, set `SERVICE_TOKEN`. The API rejects malformed records and responses over 5 MiB. With `SERVICE` empty, scheduled import is skipped.

Student, card, and photo writes queue a delivery record for each configured device in the same database transaction as the student change. Adding or changing a device queues all existing students for that device. The backend retries failed deliveries with increasing delays, uses a per-job lease to avoid duplicate workers across API instances, and records each device's status. Old card numbers remain queued for removal until delivery succeeds. Registrars can inspect and retry failures from the student list. The API routes are `GET /api/v1/registrar/student/:id/sync` and `POST /api/v1/registrar/student/:id/sync/retry`. Card and photo update routes return `202 Accepted` with `sync_status: "queued"`; device status may update later. Start the migration before running the updated backend.

## Access decisions

Gate, cafeteria, dormitory, and library staff can check cards and view recent decisions on their dashboards. The authenticated `POST /api/v1/access/check` route accepts `card_number`, `location` (`gate`, `cafeteria`, `dormitory`, or `library`), and `station`. A student must be active; cafeteria, dormitory, and library access require a matching assignment by default. Admins can set each location's open days, UTC hours, and assignment rule at `/en/admin/access`, and grant temporary assignment exceptions. A closed location or inactive student cannot be overridden by an exception. Decisions store the policy version and reason; policy revisions are retained for historical review. Unknown card numbers are stored only as an HMAC fingerprint. `GET /api/v1/access/events?location=gate` returns the latest 50 decisions and `GET /api/v1/access/summary?location=gate` returns 24-hour counts. Only admins and staff assigned to that location can use these routes.

Registered readers can use the signed online decision contract in [docs/reader-api.md](docs/reader-api.md). Repeated reader event IDs return their original decision. A vendor bridge may be needed for readers that cannot send this JSON protocol directly.

Manually created student records are scoped to their registrar creator; source-imported records remain visible to registrars. Successful student detail reads record the actor and student ID in a separate audit table. Set `ACCESS_EVENT_RETENTION_DAYS` and `STUDENT_VIEW_AUDIT_RETENTION_DAYS` after choosing an institutional policy. Both default to `0`, so automatic deletion is disabled initially. The hourly retention worker removes records older than the configured periods in batches.

The admin access screen also shows per-device delivery gaps, a manual reconciliation action, student source import status, and recent student detail views. Delivery gaps are inferred from queue records; the current device protocol does not support a read-back comparison of cards and photos. `/metrics` exports queue depth, oldest unsynced age, access denials in the last hour, and the last successful source import time, in addition to HTTP request counts. Example Prometheus rules are in [ops/prometheus-alerts.yml](ops/prometheus-alerts.yml); load them into your monitoring deployment and tune thresholds for your campus.

## Architecture

- `backend/controllers` handles HTTP requests; `backend/routes` registers Gin routes and middleware.
- The backend writes structured JSON request logs with method, route template, status, and duration; URL identifiers and query values are omitted.
- `backend/models` defines persisted records; `backend/migrate` creates tables; `backend/skeletons` contains repository/use case interfaces and mocks used by tests in `backend/test`.
- `frontend/app` contains Next.js routes and page components; `frontend/store/slices` holds Redux Toolkit state and async API actions; `frontend/components` contains shared UI.
- `docker-compose.yml` builds both applications and starts PostgreSQL for local development.
