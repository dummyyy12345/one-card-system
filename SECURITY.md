# Security

## Historical credential exposure

On 2026-10-25, the complete Git history was scanned with Gitleaks v8.30.1 using redacted output. The scan reported **six candidate `generic-api-key` findings**, all in historical versions of `backend/.env`. The file is no longer tracked, but removing it from the current tree did not remove it from older commits or existing clones. No credential values are recorded here.

Anyone responsible for credentials that were stored in that file should verify whether they were real and rotate or revoke affected API signing keys, database passwords, device credentials, and SMTP credentials in the systems that issued them. Repository changes cannot perform those external rotations. Review access logs where available. Avoid posting suspected values in issues or pull requests; contact a repository maintainer privately.

The historical file contains these credential variable names. This inventory identifies fields that need owner review; the six scanner findings do not establish that every field held a live secret. No rotation has been verified in this repository.

| Historical variable | System to check | Rotation status |
| --- | --- | --- |
| `API_SECRET` | API signing keys and existing sessions | Unverified |
| `DB_PASSWORD`, `AIVEN_PASSWORD` | Database users and hosted database account | Unverified |
| `DEVICE_PASSWORD` | Physical access devices | Unverified |
| `SMTP_PASS` | Mail service account | Unverified |
| `PGADMIN_DEFAULT_PASSWORD` | pgAdmin account, if used | Unverified |

Record completed rotations and revocations in a private operational log, including the date and owner. Do not record replacement values in Git history. Historical commits and existing clones still contain the old file until a coordinated history cleanup is performed.

### Manual remediation checklist

1. Inventory the current owners of the API, database, device, SMTP, and pgAdmin accounts.
2. Rotate `API_SECRET` first and invalidate existing sessions or signing keys.
3. Rotate database passwords, device passwords, SMTP credentials, and any affected service tokens.
4. Update the private deployment secret store and verify the backend can start without committing `.env` files.
5. Review authentication, database, device, and SMTP access logs for unauthorized use.
6. Record the owner, completion date, and affected system in a private operational log. Never record replacement values here.

### History cleanup procedure

History rewriting is intentionally not performed automatically. Coordinate a maintenance window, notify all contributors, and create a verified backup before proceeding:

```sh
git clone --mirror <repository-url> one-card-system.git
cd one-card-system.git
git filter-repo --path backend/.env --invert-paths
git fsck --full
git push --force --mirror <repository-url>
```

After the force-push, all contributors must reclone or hard-reset local branches to the cleaned remote. Run a full-history Gitleaks scan on the rewritten mirror, record the cleanup date and commit range in `CHANGELOG.md`, and revoke the old clone credentials if the repository was public.

CI scans newly introduced commits for secrets. It does not rescan the entire history on every pull request because the historical findings above would block unrelated changes. A redacted scan of the new commits through 2026-10-25 found no additional candidates.

## Dependency and runtime checks

CI runs `npm audit --audit-level=high` and `govulncheck ./...` alongside build and test checks. Keep the Go runtime and lockfiles current, and use the ignored `.env` files created from the examples for local credentials.
