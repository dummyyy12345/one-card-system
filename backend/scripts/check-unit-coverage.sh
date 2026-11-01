#!/bin/sh
set -eu

check_coverage() {
  packages="$1"
  test_package="$2"
  minimum="$3"

  output="$(go test "-coverpkg=./$packages" "./$test_package")" || {
    printf '%s\n' "$output" >&2
    exit 1
  }
  printf '%s\n' "$output"
  coverage="$(printf '%s\n' "$output" | sed -n 's/.*coverage: \([0-9][0-9.]*\)% of statements.*/\1/p' | tail -n 1)"
  if [ -z "$coverage" ]; then
    echo "Could not read coverage for $packages" >&2
    exit 1
  fi
  awk -v actual="$coverage" -v minimum="$minimum" 'BEGIN { exit !(actual + 0 >= minimum + 0) }' || {
    echo "$packages coverage is ${coverage}%; minimum is ${minimum}%" >&2
    exit 1
  }
}

check_coverage middlewares middlewares 40
check_coverage server server 75
check_coverage 'routes/...' server 50
