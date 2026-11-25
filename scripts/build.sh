#!/bin/sh

SCRIPTDIR=$(dirname "$0")
BASEDIR=$(dirname "$SCRIPTDIR")

DOWHAT=""
if [ -z "$1" ] || [ "$1" = "all" ]; then
  DOWHAT="all"
elif [ "$1" = "chrome" ] || [ "$1" = "firefox" ] || [ "$1" = "safari" ]; then
  DOWHAT="$1"
else
  echo "unknown browser: $1"
  exit 1
fi

cd "$BASEDIR" || exit 1
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@10.12.4 --activate
fi
pnpm install --frozen-lockfile
pnpm build

if [ "$DOWHAT" = "all" ]; then
  set -- chrome firefox safari
else
  set -- "$DOWHAT"
fi
for BROWSER in "$@"; do
  if [ ! -f "$BASEDIR/dist/$BROWSER/manifest.json" ]; then
    echo "Directory for $BROWSER not found"
    exit 1
  fi
done
