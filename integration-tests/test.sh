#!/bin/sh

# rm -rf ./migrator/migrations

# cp -R ../server/migrations ./migrator/migrations

docker-compose build
JEST_ARGS=$1 docker-compose up \
--abort-on-container-exit \
--exit-code-from http_tests && \
docker-compose down --volumes