#!/usr/bin/env bash
# Launch Chrome with the remote-debugging port so post.js can attach via CDP.
#
# Chrome 136+ refuses remote debugging on the DEFAULT profile, so we use a
# dedicated profile dir instead. Your normal Chrome can stay open alongside this.
#
# First run: log into Facebook once in the window that opens. The login is saved
# in this profile dir and persists for every later run.

set -euo pipefail

PORT="${1:-9222}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE_DIR="$HOME/.multi-post-chrome"

mkdir -p "$PROFILE_DIR"

echo "Launching Chrome — debug port $PORT, profile $PROFILE_DIR"
echo "(First time: log into Facebook in this window. It's remembered next time.)"
exec "$CHROME" \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "https://www.facebook.com/login"
