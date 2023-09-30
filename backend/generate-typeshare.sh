#!/usr/bin/env sh

SCRIPT_DIR=$(dirname -- "$0")
typeshare --lang typescript --output-file $SCRIPT_DIR/../frontend/src/@types/api.ts --config-file $SCRIPT_DIR/typeshare.toml $SCRIPT_DIR

pushd $SCRIPT_DIR/../frontend
npm run format:typeshare
popd
