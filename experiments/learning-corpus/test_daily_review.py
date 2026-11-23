"""Daily input coverage and live-source integrity at the real CLI/file boundary."""

import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

from daily_review import Snapshot

CLI = Path(__file__).with_name("learning_corpus.py")
START = "2026-10-21T00:00:00Z"
END = "2026-10-22T00:00:00Z"


def message(text, timestamp=START, role="user"):
    return {"type": "response_item", "timestamp": timestamp, "payload": {
        "type": "message", "role": role, "phase": "final_answer",
        "content": [{"type": "input_text" if role == "user" else "output_text", "text": text}]}}


def native(identity, source="vscode"):
    return {"type": "session_meta", "payload": {"id": identity, "cwd": "/work", "source": source}}


def write(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row) + "\n" for row in rows))


class DailyReviewTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.codex = self.root / "codex"
        self.pi = self.root / "pi/sessions"
        self.codex.mkdir()
        self.pi.mkdir(parents=True)

    def run_review(self, expected=0):
        result = subprocess.run([sys.executable, "-B", str(CLI), "review", "--since", START,
                                 "--until", END, "--codex-home", str(self.codex),
                                 "--pi-root", str(self.pi)], capture_output=True, text=True)
        self.assertEqual(result.returncode, expected, result.stderr + result.stdout[:2000])
        return json.loads(result.stdout)

    def index(self, rows):
        with sqlite3.connect(self.codex / "state_5.sqlite") as db:
            db.execute("CREATE TABLE threads (id TEXT, rollout_path TEXT, source TEXT, updated_at INTEGER)")
            db.executemany("INSERT INTO threads VALUES (?, ?, ?, ?)", rows)

    def test_inventory_covers_active_archive_pi_and_index_only_paths_without_sampling(self):
        active = self.codex / "sessions/a.jsonl"
        write(active, [native("a"), message("old", "2026-10-20T23:59:59Z"),
                       message("middle " + "x" * 70000), message("new", END)])
        archived = self.codex / "archived_sessions/b.jsonl"
        write(archived, [native("b"), message("archived request")])
        external = self.root / "elsewhere/c.jsonl"
        write(external, [native("c"), message("indexed request")])
        worker = self.codex / "sessions/worker.jsonl"
        write(worker, [native("worker", {"subagent": {"other": "guardian"}}),
                       message("Quoted human request is not another user chat")])
        pi = self.pi / "project/d.jsonl"
        write(pi, [{"type": "session", "id": "d", "cwd": "/work"},
                   {"type": "message", "id": "u", "parentId": None, "timestamp": START,
                    "message": {"role": "user", "content": "Pi request"}},
                   {"type": "message", "id": "a", "parentId": "u", "timestamp": START,
                    "message": {"role": "assistant", "stopReason": "stop",
                                "content": [{"type": "text", "text": "Pi answer"}]}}])
        self.index([("a", str(active), "vscode", 1792540800),
                    ("c", str(external), "vscode", 1792540800)])
        report = self.run_review()
        self.assertTrue(report["coverage_complete"])
        self.assertEqual(len(report["sources"]), 5)
        by_id = {s["session_id"]: s for s in report["sources"]}
        self.assertEqual(by_id["worker"]["status"], "excluded_worker")
        self.assertEqual([m["text"] for m in by_id["a"]["messages"]], ["middle " + "x" * 70000])
        self.assertEqual(by_id["a"]["messages"][0]["line"], 3)
        self.assertEqual([m["text"] for m in by_id["d"]["messages"]], ["Pi request", "Pi answer"])

    def test_malformed_row_and_partial_tail_keep_valid_evidence_but_fail_coverage(self):
        path = self.codex / "sessions/a.jsonl"
        write(path, [native("a"), message("before")])
        with path.open("a") as stream:
            stream.write('{broken}\n' + json.dumps(message("after")) + '\n{"type":')
        report = self.run_review(expected=2)
        source = report["sources"][0]
        self.assertFalse(report["coverage_complete"])
        self.assertEqual(source["status"], "partial")
        self.assertEqual([m["text"] for m in source["messages"]], ["before", "after"])
        self.assertEqual([d["line"] for d in source["diagnostics"]], [3, 5])
        strict = subprocess.run([sys.executable, "-B", str(CLI), "inspect", "--transcript", str(path)],
                                capture_output=True, text=True)
        self.assertEqual(strict.returncode, 1)
        self.assertIn("Malformed JSON", strict.stderr)

    def test_unfinished_write_is_recovered_by_retrying_the_same_interval(self):
        path = self.codex / "sessions/a.jsonl"
        write(path, [native("a"), message("first")])
        tail = json.dumps(message("completed later"))
        with path.open("a") as stream:
            stream.write(tail[:20])
        report = self.run_review(expected=2)
        self.assertEqual(report["sources"][0]["status"], "pending")
        self.assertEqual([m["text"] for m in report["sources"][0]["messages"]], ["first"])
        with path.open("a") as stream:
            stream.write(tail[20:] + "\n")
        report = self.run_review()
        self.assertTrue(report["coverage_complete"])
        self.assertEqual([m["text"] for m in report["sources"][0]["messages"]],
                         ["first", "completed later"])

    def test_missing_indexed_source_and_unsupported_header_cannot_look_complete(self):
        missing = self.root / "missing.jsonl"
        self.index([("missing", str(missing), "vscode", 1792540800)])
        write(self.codex / "sessions/unknown.jsonl", [{"type": "unknown"}])
        report = self.run_review(expected=2)
        self.assertEqual(report["counts"], {"unreadable": 1, "missing": 1})
        self.assertEqual(len(report["sources"]), 2)

    def test_fixed_snapshot_defers_appends_and_rejects_rewrites_and_replacements(self):
        path = self.root / "live.jsonl"
        write(path, [native("a"), message("original")])
        snapshot = Snapshot(path)
        try:
            with path.open("a") as stream:
                stream.write(json.dumps(message("later")) + "\n")
            self.assertEqual(snapshot.verify(), (True, True))
            self.assertNotIn("later", str(list(snapshot.rows(path))))
            original = path.read_text()
            path.write_text(original.replace("original", "modified"))
            self.assertFalse(snapshot.verify()[0])
            replacement = self.root / "replacement"
            replacement.write_text(original)
            replacement.replace(path)
            self.assertFalse(snapshot.verify()[0])
        finally:
            snapshot.close()


if __name__ == "__main__":
    unittest.main()
