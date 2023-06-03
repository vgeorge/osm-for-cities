#!/usr/bin/env bash
set -x
echo 'Start setting up...'
# Remove folder to reset
rm -rf /home/runner/app/app-data/*
yarn cli fetch-full-history
yarn cli update-presets-history --recursive
yarn cli context cities-of-brazil setup
