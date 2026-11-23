#!/usr/bin/env python3
"""Retired lifecycle compatibility endpoint for cached Codex hooks."""
import json
from pathlib import Path
import sys


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else ''
    if command == 'install':
        print('Continuous Homebase learning was retired at Callum’s request; do not reinstall it.', file=sys.stderr)
        return 1
    if command == 'status':
        homebase = Path.home() / 'Repos/callumflack/homebase'
        corpus = Path(sys.argv[sys.argv.index('--data-dir') + 1]) if '--data-dir' in sys.argv else homebase / 'Learning'
        jobs = [json.loads(p.read_text()) for p in sorted((corpus / '.runtime/inbox').glob('auto-*.json'))]
        print(json.dumps({'status': 'retired', 'jobs': [{k: job[k] for k in ('session_id', 'turn_id', 'status', 'attempts', 'case_keys', 'error', 'retirement') if k in job} for job in jobs]}))
    else:
        print('{}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
