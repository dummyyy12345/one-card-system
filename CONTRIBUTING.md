# Contributing

## Set up

Follow the [README](README.md) for local installation or Docker Compose startup. Keep credentials in ignored `.env` files created from the examples.

## Check changes

Run the checks for each area you modify before opening a pull request:

```sh
cd frontend
npm ci --ignore-scripts
npm run lint
npm run format:check
npm run typecheck
npm test -- --coverage
npm run test:core-coverage
npm run build
```

```sh
cd backend
go test ./...
sh scripts/check-coverage.sh
go vet ./...
go build ./...
```

For database changes, also run `INTEGRATION_DB_DSN='postgres://onecard:password@localhost:5432/onecard_integration?sslmode=disable' go test -tags=integration ./controllers/registrarcontrollers` against a disposable PostgreSQL database. CI runs this with a service container.

CI also scans dependencies and new commits for known vulnerabilities and secrets. Device and SMTP features require real services when used; keep their test paths offline by injecting clients or using local HTTP test servers.

For production frontend containers, build from `frontend/` with the committed Dockerfile:

```sh
docker build --build-arg NEXT_PUBLIC_API_SERVER_URL=https://api.example.com -t one-card-frontend:local frontend
docker run --rm -p 3000:3000 one-card-frontend:local
```

The image includes a health check for `/api/health`. Do not pass credentials as Docker build arguments; public `NEXT_PUBLIC_*` values are embedded into the client bundle.

## Pull requests

Keep each behavior change focused and include tests for success and failure paths. Explain any database migration, environment variable, or external service change in the pull request. Use a descriptive commit subject such as `fix(students): return 404 for missing IDs`. Formatting-only changes belong in their own commit.

Do not include credentials, student records, face images, or other personal data in commits, tests, logs, or issue reports. Report suspected exposures privately to a repository maintainer.

## Releases

Use the release checklist in [CHANGELOG.md](CHANGELOG.md). Releases require a passing clean-checkout workflow, a full-history secret scan, an updated changelog section, and an annotated semantic-version tag.
