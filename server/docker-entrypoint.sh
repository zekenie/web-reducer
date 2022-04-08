#!/bin/sh

exec dumb-init "$@" | yarn roarr pretty-print