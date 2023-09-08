#!/usr/bin/env sh

SCRIPT_DIR=$(dirname -- "$0")
typeshare --lang typescript --output-file $SCRIPT_DIR/../frontend/src/@types/api.d.ts $SCRIPT_DIR

pushd $SCRIPT_DIR/../frontend
yarn format:typeshare
popd
