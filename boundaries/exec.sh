#!/usr/bin/env bash

IMAGE_DOCKER="docker run --rm -v ${PWD}:/mnt osm-git-history/boundary"

data_path=data

mkdir -p ${data_path}

$IMAGE_DOCKER python scripts/admin_boundaries.py \
        --iso_countries=USA \
        --iso_countries=PER \
        --data_path=${data_path}