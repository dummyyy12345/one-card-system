# Security

## Historical credential exposure

On 2026-10-25, the complete Git history was scanned with Gitleaks v8.30.1 using redacted output. The scan reported **six candidate `generic-api-key` findings**, all in historical versions of `backend/.env`. The file is no longer tracked, but removing it from the current tree did not remove it from older commits or existing clones. No credential values are recorded here.

Anyone responsible for credentials that were stored in that file should verify whether they were real and rotate or revoke affected API signing keys, database passwords, device credentials, and SMTP credentials in the systems that issued them. Repository changes cannot perform those external rotations. Review access logs where available. Avoid posting suspected values in issues or pull requests; contact a repository maintainer privately.

CI scans newly introduced commits for secrets. It does not rescan the entire history on every pull request because the historical findings above would block unrelated changes. A redacted scan of the new commits through 2026-10-25 found no additional candidates.

## Dependency and runtime checks

CI runs `npm audit --audit-level=high` and `govulncheck ./...` alongside build and test checks. Keep the Go runtime and lockfiles current, and use the ignored `.env` files created from the examples for local credentials.
