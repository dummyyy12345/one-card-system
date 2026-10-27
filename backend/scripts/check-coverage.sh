#!/bin/sh
set -eu

: "${INTEGRATION_DB_DSN:?Set INTEGRATION_DB_DSN to a disposable PostgreSQL database before checking registrar coverage}"

coverage_file="$(mktemp)"
trap 'rm -f "$coverage_file"' EXIT HUP INT TERM

go test -tags=integration -coverprofile="$coverage_file" ./controllers/registrarcontrollers
coverage="$(go tool cover -func="$coverage_file" | awk '$1 == "total:" { gsub(/%/, "", $3); print $3 }')"

if [ -z "$coverage" ]; then
  echo 'Could not read registrar controller coverage' >&2
  exit 1
fi

awk -v coverage="$coverage" 'BEGIN { exit !(coverage + 0 >= 50) }' || {
  echo "Registrar controller statement coverage is ${coverage}%; minimum is 50%" >&2
  exit 1
}

echo "Registrar controller statement coverage: ${coverage}% (minimum 50%)"
