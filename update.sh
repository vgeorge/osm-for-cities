#!/usr/bin/env bash
set -x
echo 'Start updating...'

# yarn cli list-contexts | grep cities-of

if [ -f "${TMP_DIR}/history-latest.osh.pbf" ]; then
    yarn cli update-presets-history --recursive
    yarn cli context cities-of-brazil update
fi
