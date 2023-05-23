#!/usr/bin/env bash
set -x
echo 'Start setting up...'
yarn cli fetch-full-history
yarn cli update-presets-history --recursive
yarn cli context cities-of-brazil setup
