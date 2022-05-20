#!/bin/sh

# Abort on any error (including if wait-for-it fails).
set -e

/usr/src/app/wait-for.sh --host=$DATABASE_HOST --port=$DATABASE_PORT --timeout=36

exec "$@" > "/tmp/shared/migration-$MIGRATOR_NAME"
