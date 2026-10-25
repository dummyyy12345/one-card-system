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
npm run build
```

```sh
cd backend
go test ./...
sh scripts/check-coverage.sh
go vet ./...
go build ./...
```

CI also scans dependencies and new commits for known vulnerabilities and secrets. Device and SMTP features require real services when used; keep their test paths offline by injecting clients or using local HTTP test servers.

## Pull requests

Keep each behavior change focused and include tests for success and failure paths. Explain any database migration, environment variable, or external service change in the pull request. Use a descriptive commit subject such as `fix(students): return 404 for missing IDs`. Formatting-only changes belong in their own commit.

Do not include credentials, student records, face images, or other personal data in commits, tests, logs, or issue reports. Report suspected exposures privately to a repository maintainer.
