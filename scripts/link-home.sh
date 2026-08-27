#!/usr/bin/env bash
# Job: link the canonical .agents payload and runtime instruction adapters.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
agents_home="${AGENTS_HOME:-$HOME/.agents}"
payload_dir="$repo_root/.agents"
codex_agents_file="${CODEX_AGENTS_FILE:-$HOME/.codex/AGENTS.md}"
claude_agents_file="${CLAUDE_AGENTS_FILE:-$HOME/.claude/CLAUDE.md}"

if [ ! -d "$payload_dir" ]; then
  echo "error: expected agents payload at: $payload_dir" >&2
  exit 1
fi

if [ -e "$agents_home" ] && [ ! -L "$agents_home" ]; then
  backup_path="${agents_home}.backup.$(date +%Y%m%d%H%M%S)"
  mv "$agents_home" "$backup_path"
  echo "moved existing canonical home to backup: $backup_path"
fi

ln -sfn "$payload_dir" "$agents_home"
echo "linked: $agents_home -> $payload_dir"

link_instruction_adapter() {
  local target_path="$1"
  local target_dir
  local backup_path

  target_dir="$(dirname "$target_path")"
  mkdir -p "$target_dir"

  if [ -d "$target_path" ] && [ ! -L "$target_path" ]; then
    echo "error: instruction adapter target is a directory: $target_path" >&2
    return 1
  fi

  if [ -e "$target_path" ] && [ ! -L "$target_path" ]; then
    backup_path="${target_path}.backup.$(date +%Y%m%d%H%M%S)"
    mv "$target_path" "$backup_path"
    echo "moved existing instruction file to backup: $backup_path"
  fi

  ln -sfn "$agents_home/AGENTS.md" "$target_path"
  echo "linked: $target_path -> $agents_home/AGENTS.md"
}

link_instruction_adapter "$codex_agents_file"
link_instruction_adapter "$claude_agents_file"
