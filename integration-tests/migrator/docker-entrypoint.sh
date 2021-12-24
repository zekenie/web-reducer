#!/bin/sh

# Abort on any error (including if wait-for-it fails).
set -e

/usr/src/app/wait-for.sh --host=db --port=5432 --timeout=36

exec "$@" > /tmp/shared/migration-output
