#!/usr/bin/env bash
# Job: verify the canonical global instruction adapters are current.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
agents_home="${AGENTS_HOME:-$HOME/.agents}"
payload_dir="$repo_root/.agents"
codex_agents_file="${CODEX_AGENTS_FILE:-$HOME/.codex/AGENTS.md}"
claude_agents_file="${CLAUDE_AGENTS_FILE:-$HOME/.claude/CLAUDE.md}"
cursor_agents_rule="${CURSOR_AGENTS_RULE:-$HOME/.cursor/rules/callum-agents.mdc}"

fail() {
  echo "error: $1" >&2
  exit 1
}

[ -L "$agents_home" ] || fail "canonical agents home is not a symlink: $agents_home"
[ "$(readlink "$agents_home")" = "$payload_dir" ] || fail "wrong canonical agents home target: $agents_home"

for adapter in "$codex_agents_file" "$claude_agents_file"; do
  [ -L "$adapter" ] || fail "instruction adapter is not a symlink: $adapter"
  [ "$(readlink "$adapter")" = "$agents_home/AGENTS.md" ] || fail "wrong instruction adapter target: $adapter"
done

[ -f "$cursor_agents_rule" ] || fail "missing generated Cursor rule: $cursor_agents_rule"
expected_cursor_rule() {
  printf '%s\n' '---'
  printf '%s\n' 'description: Callum global agent instructions (from ~/.agents/AGENTS.md)'
  printf '%s\n' 'alwaysApply: true'
  printf '%s\n' '---'
  printf '\n'
  cat "$agents_home/AGENTS.md"
}

cmp -s <(expected_cursor_rule) "$cursor_agents_rule" || fail "stale generated Cursor rule: $cursor_agents_rule"

echo "ok: Codex, Claude, and Cursor use the current global instructions"
