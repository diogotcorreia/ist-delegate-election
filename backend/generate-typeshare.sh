#!/usr/bin/env sh

SCRIPT_DIR=$(dirname -- "$0")

if ! command -v typeshare &>/dev/null; then
	echo 'FATAL ERROR: A "typeshare" binary must be available.'
	echo 'Use `cargo install typeshare-cli` or equivalent, and then re-run this script.'
	exit 1
fi

typeshare --lang typescript --output-file $SCRIPT_DIR/../frontend/src/@types/api.ts --config-file $SCRIPT_DIR/typeshare.toml $SCRIPT_DIR

pushd $SCRIPT_DIR/../frontend
npm run format:typeshare
popd
