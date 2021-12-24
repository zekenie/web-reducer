#!/bin/sh

# Abort on any error (including if wait-for-it fails).
set -e
while [ ! -f /tmp/shared/migration-output ]; do sleep 1; done

exec "$@"