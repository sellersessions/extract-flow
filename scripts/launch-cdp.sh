#!/bin/bash
# Launch Comet (or Chrome) with CDP debugging enabled on port 9222.
# This allows dev-browser to connect to your live browser sessions.
#
# Usage:
#   ./launch-cdp.sh          # Launch Comet (default)
#   ./launch-cdp.sh chrome   # Launch Chrome instead
#   ./launch-cdp.sh check    # Check if CDP is already running

PORT=9222

case "${1:-comet}" in
  check)
    if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
      echo "CDP is running on port $PORT"
      curl -s "http://localhost:$PORT/json/version" | python3 -m json.tool
    else
      echo "CDP is NOT running. Launch with: ./launch-cdp.sh"
    fi
    ;;
  chrome)
    echo "Launching Chrome with CDP on port $PORT..."
    open -a "Google Chrome" --args --remote-debugging-port=$PORT
    echo "Waiting for CDP..."
    for i in {1..10}; do
      sleep 1
      if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
        echo "Chrome CDP ready on port $PORT"
        exit 0
      fi
    done
    echo "Warning: Chrome started but CDP not responding. Check if another instance is already running."
    ;;
  comet|*)
    echo "Launching Comet with CDP on port $PORT..."
    open -a "Comet" --args --remote-debugging-port=$PORT
    echo "Waiting for CDP..."
    for i in {1..10}; do
      sleep 1
      if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
        echo "Comet CDP ready on port $PORT"
        exit 0
      fi
    done
    echo "Warning: Comet started but CDP not responding."
    echo "Comet may need to be fully quit first (Cmd+Q), then relaunched with this script."
    echo "Try: killall Comet && sleep 2 && ./launch-cdp.sh"
    ;;
esac
