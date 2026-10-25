#!/usr/bin/env bash
# PostToolUse (Write|Edit): format the edited file with the project's prettier.
# Only touches files inside this project; prettier skips unknown types.
f=$(jq -r '.tool_input.file_path // empty')
[ -n "$f" ] || exit 0
case "$f" in
  "$CLAUDE_PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
node_modules/.bin/prettier --write --ignore-unknown --log-level warn "$f"
