#!/bin/bash
# ===========================================================================
# Shuanglu Backgammon - stop background server (macOS)
# Double-click this .command file, or run from terminal.
# ===========================================================================
cd "$(dirname "$0")" || exit 1
node scripts/stop.mjs
read -r -p "Press Enter to close..." </dev/tty