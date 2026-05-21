#!/bin/bash
# Launch the dedicated automation Chromium — separate app, separate profile,
# separate Space from Danny's live Comet browser. Prevents focus-steal during
# extractions while still allowing authenticated sessions (log in once, cookies
# persist in the profile dir).
#
# Usage:
#   ./launch-automation-browser.sh              # launch + wait for CDP ready
#   ./launch-automation-browser.sh check        # is it running?
#   ./launch-automation-browser.sh stop         # kill the automation browser only
#
# After first launch: drag the Chromium window to Desktop 2, right-click its
# dock icon → Options → Assign To → This Desktop. Subsequent launches land on
# Desktop 2 automatically.

set -e

PORT=9334
PROFILE_DIR="$HOME/.extract-flow/automation-profile"
# Window position hints macOS to place it off Desktop 1's primary viewport.
# If the user assigned Chromium to Desktop 2 via dock context menu, this
# position is ignored and macOS honours the space assignment instead.
WINDOW_X=2000
WINDOW_Y=100
WINDOW_W=1440
WINDOW_H=900

mkdir -p "$PROFILE_DIR"

# Resolve Playwright's bundled Chromium path (installed via extract-flow/npm install).
CHROMIUM_BIN="$(node -e "console.log(require('/Users/dannymcmillan/Claude-Code-Projects-Restored/extract-flow/node_modules/playwright').chromium.executablePath())" 2>/dev/null)"

if [ -z "$CHROMIUM_BIN" ] || [ ! -f "$CHROMIUM_BIN" ]; then
  echo "error: Playwright Chromium not found. Run: cd extract-flow && npm install"
  exit 1
fi

case "${1:-launch}" in
  check)
    if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
      echo "Automation browser running on port $PORT"
      curl -s "http://localhost:$PORT/json/version" | python3 -m json.tool
    else
      echo "Automation browser NOT running. Launch with: $0"
      exit 1
    fi
    ;;
  stop)
    if lsof -ti:$PORT > /dev/null 2>&1; then
      echo "Stopping automation browser (port $PORT)..."
      lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
      echo "stopped"
    else
      echo "Automation browser already stopped"
    fi
    ;;
  launch|*)
    if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
      echo "Automation browser already running on port $PORT"
      exit 0
    fi

    echo "Launching automation Chromium → CDP $PORT, profile $PROFILE_DIR"
    # nohup + background + disown so it outlives this shell
    nohup "$CHROMIUM_BIN" \
      --remote-debugging-port=$PORT \
      --user-data-dir="$PROFILE_DIR" \
      --window-position=$WINDOW_X,$WINDOW_Y \
      --window-size=$WINDOW_W,$WINDOW_H \
      --no-first-run \
      --no-default-browser-check \
      --disable-background-timer-throttling \
      --disable-backgrounding-occluded-windows \
      about:blank \
      > /dev/null 2>&1 &
    disown

    echo "Waiting for CDP..."
    for i in {1..20}; do
      sleep 0.5
      if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
        echo "Automation browser ready on port $PORT"
        echo ""
        echo "Next steps (first launch only):"
        echo "  1. Drag the Chromium window to Desktop 2"
        echo "  2. Right-click its dock icon → Options → Assign To → This Desktop"
        echo "  3. Log into claude.ai, Gmail, WordPress, etc. — cookies persist"
        echo ""
        echo "Use in extractions: --connect http://localhost:$PORT"
        exit 0
      fi
    done
    echo "error: Chromium started but CDP not responding on port $PORT"
    exit 1
    ;;
esac
