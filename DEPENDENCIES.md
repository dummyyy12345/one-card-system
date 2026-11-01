# Dependency maintenance

The source manifests are [`frontend/package.json`](frontend/package.json) and [`backend/go.mod`](backend/go.mod). The committed `package-lock.json` and `go.sum` fix the resolved dependency graph for clean installs. CI uses `npm ci --ignore-scripts`, Go's module download and build, `npm audit --audit-level=high`, and `govulncheck ./...`. [Dependabot](.github/dependabot.yml) checks both ecosystems weekly.

## Review on 2026-11-01

- Replaced the archived `github.com/dgrijalva/jwt-go` dependency with `github.com/golang-jwt/jwt/v5` and added token validation tests that require an expiration and the HS256 signing method.
- The frontend production build succeeds, but Next.js 16 emits a deprecation warning for the project's React 18 dependency. A React 19 upgrade needs its own compatibility pass across the UI and browser tests.
- Registry freshness checks were attempted with `npm outdated --json` and `go list -m -u all`. The npm registry timed out, and the Go update query did not complete during this review. No claim is made that all direct or transitive dependencies are current.

When registry access is available, run both freshness checks, inspect major upgrades, then update the manifest and lockfile together. Run `sh scripts/verify.sh`, `npm run test:e2e` in `frontend/`, and the PostgreSQL integration job before accepting a dependency upgrade.
