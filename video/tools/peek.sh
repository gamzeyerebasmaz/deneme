#!/bin/bash
# tools/peek.sh <frame...>  -> /tmp/claude-0/shots/sheet.jpg
source /tmp/claude-0/env.sh
rm -rf /tmp/claude-0/shots && mkdir -p /tmp/claude-0/shots
node tools/stills.mjs /tmp/claude-0/shots "$@" > /tmp/claude-0/shots/log.txt 2>&1 || tail -20 /tmp/claude-0/shots/log.txt
python3 tools/sheet.py /tmp/claude-0/shots ${COLS:-3}
