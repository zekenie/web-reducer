#!/bin/sh

# Abort on any error (including if wait-for-it fails).
set -e
while [ ! -f /tmp/shared/migration-server ]; do sleep 1; done
while [ ! -f /tmp/shared/migration-secrets ]; do sleep 1; done

yarn get-safe-dependency-order
cat safe-dependency-order.json

exec "$@"