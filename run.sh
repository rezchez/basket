#!/usr/bin/env bash

# If launched outside a terminal (e.g. double-clicked from file manager), open in terminal
if [ "$1" != "--in-terminal" ] && { [ ! -t 0 ] || [ ! -t 1 ]; }; then
    if command -v xfce4-terminal >/dev/null 2>&1; then
        exec xfce4-terminal --title="Basketball Project" -e "bash \"$0\" --in-terminal"
    elif command -v x-terminal-emulator >/dev/null 2>&1; then
        exec x-terminal-emulator -e "bash \"$0\" --in-terminal"
    elif command -v gnome-terminal >/dev/null 2>&1; then
        exec gnome-terminal -- bash "$0" --in-terminal
    fi
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
export PATH="$HOME/.bun/bin:$PATH"

exec bun "$ROOT_DIR/run.ts"
