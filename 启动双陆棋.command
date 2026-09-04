#!/bin/bash
# ===========================================================================
# Shuanglu Backgammon - one-click launcher (macOS)
# Double-click this .command file (Finder, or chmod +x then run).
# Uses the script's own directory so it works wherever the folder lives.
# ===========================================================================
cd "$(dirname "$0")" || exit 1
# Launch in background so the Terminal window closes immediately
node scripts/launch.mjs &
exit 0