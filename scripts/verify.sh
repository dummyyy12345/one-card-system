#!/bin/sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"

command -v npm >/dev/null || { echo "Node.js and npm are required" >&2; exit 1; }
command -v go >/dev/null || { echo "Go is required; use the version in backend/go.mod" >&2; exit 1; }

npm --prefix frontend ci --ignore-scripts
npm --prefix frontend run lint
npm --prefix frontend run format:check
npm --prefix frontend run typecheck
npm --prefix frontend test -- --coverage
npm --prefix frontend run test:core-coverage
npm --prefix frontend run build

(
  cd backend
  go vet ./...
  go build ./...
  go test ./...
)
