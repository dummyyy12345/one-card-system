# One Card System

Campus access control application with a Next.js/Redux frontend and a Go/Gin API. PostgreSQL stores users, devices, and student records. Device synchronization and SMTP need real external services when those features are used; the development setup starts without them.

## Quick start with Docker

Install Docker with Compose, then run from the repository root:

```sh
docker compose up --build
```

Open <http://localhost:3000>. The API is at <http://localhost:8888>, its health endpoint is <http://localhost:8888/healthz>, and request counters are at <http://localhost:8888/metrics>. Compose starts PostgreSQL, runs the database migration, and starts both applications. The Compose defaults are **development only**. Set `API_SECRET` and `DB_PASSWORD` to strong values before exposing the stack outside your machine; Compose reads a root `.env` file if present. Restrict access to `/metrics` when deploying the API publicly.

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

The frontend expects `NEXT_PUBLIC_API_SERVER_URL=http://localhost:8888`. Visit <http://localhost:3000>. The API health route does not require authentication. Student synchronization currently uses placeholder student data in `backend/controllers/registrarcontrollers/utils.go`; connected access devices and SMTP need valid credentials and reachable services.

## Test and checks

```sh
cd backend
go build ./...
go test ./...

cd ../frontend
npm ci --ignore-scripts
npm run lint
npm run typecheck
npm test
npm test -- --coverage
npm run build
```

CI runs these checks on pushes and pull requests, plus `npm audit --audit-level=high` and `govulncheck ./...`. The frontend coverage gate requires at least 50% statements, lines, and functions in the core student, user, and device flows named in `frontend/jest.config.js`; other frontend files are not yet part of that threshold.

## Environment variables

Copy the example files; never commit the resulting `.env` files. `backend/.env.example` documents:

| Variable | Purpose |
| --- | --- |
| `API_PORT`, `API_SECRET` | API listener port and token signing secret |
| `DB_DRIVER`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE` | Database connection and PostgreSQL TLS mode |
| `DEVICE_USERNAME`, `DEVICE_PASSWORD` | Credentials for access control devices |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Outbound email settings |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` | Optional pgAdmin settings; pgAdmin is not part of Compose |
| `SERVICE` | Reserved for an external student service integration |

`frontend/.env.example` contains `NEXT_PUBLIC_API_SERVER_URL`, the API URL visible to the browser. It is embedded into the frontend build, so rebuild after changing it.

Credentials were previously committed to this repository. If they were real, rotate them in the database, devices, SMTP service, and any other affected system; removing the files now does not erase git history.

## Architecture

- `backend/controllers` handles HTTP requests; `backend/routes` registers Gin routes and middleware.
- The backend writes structured JSON request logs with method, route template, status, and duration; URL identifiers and query values are omitted.
- `backend/models` defines persisted records; `backend/migrate` creates tables; `backend/skeletons` contains repository/use case interfaces and mocks used by tests in `backend/test`.
- `frontend/app` contains Next.js routes and page components; `frontend/store/slices` holds Redux Toolkit state and async API actions; `frontend/components` contains shared UI.
- `docker-compose.yml` builds both applications and starts PostgreSQL for local development.
