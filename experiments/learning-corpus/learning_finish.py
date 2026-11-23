#!/usr/bin/env python3
"""Compatibility for the retired visible learning-finish hook and old review commands."""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import sys
import tempfile

from learning_corpus import HOMEBASE_ROOT, audit, digest, latest, native_source, now, transcript

PREFIX = 'HOMEBASE_LEARNING_FINISH:'


def current_task(path):
    metadata, messages = transcript(path)
    users = [m for m in messages if m['role'] == 'user'
             and not m['text'].startswith((PREFIX, '<external_codex_apps_open_page>', '<skill>'))]
    if not users:
        raise ValueError('No native user request found for the learning review')
    return metadata.get('session_id') or metadata['id'], users[-1]


def receipt_path(homebase, session, task):
    identity = digest([session, task['line'], task['text_sha256']])
    return Path(homebase) / 'Learning' / '.runtime' / 'inbox' / f'review-{identity}.json'


def matching_cases(homebase, keys):
    path = Path(homebase) / 'Learning' / 'cases.jsonl'
    records = latest(path) if path.exists() else []
    found = [r for r in records if r['case_key'] in keys]
    if {r['case_key'] for r in found} != set(keys):
        raise ValueError('Review references a case key absent from the corpus')
    if not found:
        raise ValueError('Supply at least one saved case key')
    audit(path)
    readable = (path.parent / 'cases.md').read_text()
    for record in found:
        if f"Case key: `{record['case_key']}`." not in readable:
            raise ValueError(f"Readable case missing: {record['case_key']}")
    return found


def validate_review(value, session, task, homebase):
    if value.get('session_id') != session or value.get('user_hash') != task['text_sha256'] or value.get('user_line') != task['line']:
        raise ValueError('Learning review belongs to a different task')
    disposition = value.get('disposition')
    if disposition in ('captured', 'already-covered'):
        records = matching_cases(homebase, value.get('case_keys', []))
        if disposition == 'captured':
            for record in records:
                same_task = record['source']['session_id'] == session and any(
                    e['line'] >= task['line'] for e in record['evidence'].values()
                )
                named_source = record['source']['session_id'] in task['text']
                fresh = task.get('timestamp') and datetime.fromisoformat(
                    record['created_at'].replace('Z', '+00:00')
                ) >= datetime.fromisoformat(task['timestamp'].replace('Z', '+00:00'))
                if not same_task and not (named_source and fresh):
                    raise ValueError('Captured case does not preserve evidence from this task or its named source')
    elif disposition != 'no-learning':
        raise ValueError('Unknown learning review disposition')
    if disposition != 'captured' and not value.get('reason', '').strip():
        raise ValueError('A skipped capture needs its concrete reason')


def review(path, homebase, disposition, keys, reason):
    session, task = current_task(path)
    value = {'event': 'learning-review', 'session_id': session, 'user_line': task['line'],
             'user_hash': task['text_sha256'], 'disposition': disposition,
             'case_keys': keys, 'reason': reason, 'reviewed_at': now()}
    validate_review(value, session, task, homebase)
    target = receipt_path(homebase, session, task)
    target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor, temporary = tempfile.mkstemp(dir=target.parent)
    try:
        with os.fdopen(descriptor, 'w') as stream:
            json.dump(value, stream, ensure_ascii=False)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, target)
    finally:
        Path(temporary).unlink(missing_ok=True)
    return value


def stop(payload, homebase):
    """Retired: visible per-turn learning prompts were rejected by the user."""
    if payload.get('hook_event_name') != 'Stop':
        raise ValueError('This handler accepts only Stop events')
    return {}


def install(path, homebase):
    raise ValueError('The visible per-turn learning hook was retired at the user’s request; do not reinstall it.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subs = parser.add_subparsers(dest='command', required=True)
    for name in ('stop', 'review', 'install'):
        sub = subs.add_parser(name)
        sub.add_argument('--homebase', type=Path, default=HOMEBASE_ROOT)
        if name == 'review':
            source = sub.add_mutually_exclusive_group()
            source.add_argument('--thread')
            source.add_argument('--transcript', type=Path)
            sub.add_argument('--disposition', choices=['captured', 'already-covered', 'no-learning'], required=True)
            sub.add_argument('--case-key', action='append', default=[])
            sub.add_argument('--reason', default='')
        if name == 'install':
            sub.add_argument('--hooks-file', type=Path, default=Path(os.environ.get('CODEX_HOME', Path.home()/'.codex'))/'hooks.json')
    args = parser.parse_args()
    try:
        if args.command == 'stop':
            result = stop(json.load(sys.stdin), args.homebase)
        elif args.command == 'review':
            result = review(native_source(args.thread, args.transcript), args.homebase, args.disposition, args.case_key, args.reason)
        else:
            result = install(args.hooks_file, args.homebase)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, TypeError) as error:
        if args.command == 'stop':
            print(json.dumps({'systemMessage': f'Homebase learning finish check failed: {error}. Capture is not verified.'}))
        else:
            print(str(error), file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
