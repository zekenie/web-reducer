#!/bin/sh

rm -rf ./postgres-data

rm -rf ./migrator/migrations

cp -R ../server/migrations ./migrator/migrations

docker-compose build && \
docker-compose up \
--abort-on-container-exit \
--exit-code-from http_tests && \
docker-compose down --volumes