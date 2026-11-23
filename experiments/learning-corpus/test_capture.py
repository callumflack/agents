"""Exercise the public capture CLI and its persisted evidence boundary."""

import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


CLI = Path(__file__).with_name("learning_corpus.py")
SESSION = "00000000-0000-4000-8000-000000000001"


class CaptureTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.corpus = self.root / "Learning"
        self.native = self.root / "native.jsonl"
        rows = [
            {"type": "session_meta", "payload": {"id": SESSION, "cwd": "/work/unity-surfaces"}},
            {"type": "event_msg", "payload": {"type": "task_started", "turn_id": "turn-one"}},
            self.message("user", "Keep upload completion separate from a saved local file.", "u1"),
            self.message("assistant", "Private reasoning must stay out of the archive.", "a0", "analysis"),
            {"type": "response_item", "payload": {"type": "function_call", "arguments": "tool output"}},
            self.message("assistant", "The file was saved locally; upload completion remains unverified.", "a1"),
            {"type": "event_msg", "payload": {"type": "task_started", "turn_id": "turn-two"}},
            self.message("user", "Do not let the old account's late result update the new account.", "u2"),
            self.message("assistant", "The late result was ignored after the account changed.", "a2"),
        ]
        self.native.write_text("".join(json.dumps(row) + "\n" for row in rows))
        self.first = self.selection(
            "saved-before-uploaded", rows[2]["payload"]["content"][0]["text"],
            rows[5]["payload"]["content"][0]["text"],
        )
        self.second = self.selection(
            "late-results-belong-to-the-old-account", rows[7]["payload"]["content"][0]["text"],
            rows[8]["payload"]["content"][0]["text"],
        )

    @staticmethod
    def message(role, text, identity, phase="final_answer"):
        return {"type": "response_item", "timestamp": "2026-10-14T12:00:00Z", "payload": {
            "type": "message", "id": identity, "role": role, "phase": phase,
            "content": [{"type": "input_text" if role == "user" else "output_text", "text": text}],
        }}

    @staticmethod
    def selection(key, correction, result):
        return {
            "case_key": key,
            "evidence": {"correction": {"role": "user", "quote": correction},
                         "result": {"role": "assistant", "quote": result}},
            "story": {"goal": "Understand the actual result", "situation": None,
                      "needed_next_step": None, "cues": [correction]},
            "learning": {"summary": "Keep distinct outcomes visible", "applies_when": "The states differ",
                         "does_not_apply_when": [], "owners": ["unity-surfaces"], "signal": "correction"},
            "outcome": {"status": "partial", "basis": "assistant_report", "summary": result,
                        "evidence_keys": ["result"]},
        }

    def run_cli(self, *arguments, expected=0):
        result = subprocess.run([sys.executable, str(CLI), *map(str, arguments)],
                                cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, expected, result.stderr + result.stdout)
        return result

    def capture(self, selection, expected=0):
        draft = self.root / "selection.jsonl"
        draft.write_text(json.dumps(selection) + "\n")
        return self.run_cli("capture", "--transcript", self.native, "--spec", draft,
                            "--data-dir", self.corpus, expected=expected)

    def test_capture_is_portable_source_grounded_and_repeat_safe(self):
        inspection = json.loads(self.run_cli("inspect", "--transcript", self.native, "--limit", 1).stdout)
        self.assertEqual(inspection["messages"][0]["line"], 3)
        self.assertEqual(inspection["messages"][0]["turn_id"], "turn-one")
        self.assertTrue(inspection["more_messages"])
        report = json.loads(self.capture(self.first).stdout)
        self.assertEqual(report["added"], 1)
        self.assertTrue(report["readable_update_required"])
        archive = self.corpus / "sources" / f"{SESSION}.jsonl"
        archived = [json.loads(line) for line in archive.read_text().splitlines()]
        self.assertEqual([row["native_line"] for row in archived[1:]], [3, 6])
        self.assertNotIn("Private reasoning", archive.read_text())
        self.assertNotIn("function_call", archive.read_text())
        record = json.loads((self.corpus / "cases.jsonl").read_text())
        self.assertEqual(record["source"]["cwd"], "/work/unity-surfaces")
        self.assertEqual(record["evidence"]["correction"]["quote"], self.first["evidence"]["correction"]["quote"])
        self.assertEqual(json.loads(self.capture(self.first).stdout)["added"], 0)
        self.assertEqual(len((self.corpus / "extractions.jsonl").read_text().splitlines()), 1)
        moved = self.root / "moved-corpus"
        shutil.copytree(self.corpus, moved)
        self.native.unlink()
        verified = json.loads(self.run_cli("audit", "--cases", moved / "cases.jsonl").stdout)
        self.assertEqual(verified["verified_revisions"], 1)

    def test_legacy_absolute_source_uses_preserved_witness_without_rewriting_history(self):
        from learning_corpus import audit, digest
        self.capture(self.first)
        cases = self.corpus / "cases.jsonl"
        record = json.loads(cases.read_text())
        record["source"]["transcript_path"] = str(self.native)
        record["revision"] = digest({k: v for k, v in record.items() if k not in ("revision", "created_at")})
        cases.write_text(json.dumps(record) + "\n")
        historical = cases.read_bytes()
        self.native.unlink()
        self.assertEqual(audit(cases)["verified_revisions"], 1)
        self.assertEqual(cases.read_bytes(), historical)
        archive = self.corpus / "sources" / f"{SESSION}.jsonl"
        archive.write_text(archive.read_text().replace("Keep upload completion", "Fabricated upload completion"))
        with self.assertRaisesRegex(ValueError, "Invented quote"):
            audit(cases)

    def test_search_prefers_topic_words_over_substrings_and_common_recovery_language(self):
        from learning_corpus import search
        cases = self.root / "search.jsonl"
        records = [
            {"id": "backup", "case_key": "offline-backup", "story": {"goal": "Verify the KB backup disk and its linked attachments."},
             "learning": {"summary": "Read actual backup bytes and restore offline with originals unavailable."}},
            {"id": "runner", "case_key": "controller-recovery", "story": {"goal": "What should we verify before trusting recovery? Keep it brief."},
             "learning": {"summary": "Recovery keeps the original deadline. A diskless runner can retry but has no time to list every task."}},
        ]
        cases.write_text("".join(json.dumps(r) + "\n" for r in records))
        prompt = "My backup disk lists every KB attachment, but I haven't tried opening them without the internet or the original folders. What should I verify before trusting it for recovery? Keep it brief."
        self.assertEqual(search(cases, prompt, 1)[0]["case_key"], "offline-backup")
        self.assertEqual(search(cases, "diskless", 3)[0]["case_key"], "controller-recovery")
        self.assertEqual(search(cases, "unrelatedword", 3), [])

    def test_another_case_preserves_prior_witnesses_and_revision_history(self):
        self.capture(self.first)
        self.capture(self.second)
        amended = copy.deepcopy(self.first)
        amended["learning"]["summary"] = "Retain saved data when upload completion is unknown"
        self.capture(amended)
        report = json.loads(self.run_cli("audit", "--cases", self.corpus / "cases.jsonl").stdout)
        self.assertEqual(report, {"verified_revisions": 3, "sessions": 1})
        records = [json.loads(line) for line in (self.corpus / "cases.jsonl").read_text().splitlines()]
        self.assertEqual(records[0]["id"], records[2]["id"])
        self.assertNotEqual(records[0]["revision"], records[2]["revision"])
        archive = self.corpus / "sources" / f"{SESSION}.jsonl"
        self.assertEqual([row["native_line"] for row in map(json.loads, archive.read_text().splitlines()[1:])], [3, 6, 8, 9])

    def test_finish_hook_continuation_is_not_human_learning_evidence(self):
        with self.native.open("a") as stream:
            stream.write(json.dumps(self.message(
                "user", '<hook_prompt hook_run_id="stop:3:test">HOMEBASE_LEARNING_FINISH: complete the capture review.</hook_prompt>', "hook"
            )) + "\n")
        inspection = json.loads(self.run_cli("inspect", "--transcript", self.native, "--limit", 20).stdout)
        self.assertEqual(inspection["message_count"], 4)
        self.assertNotIn("HOMEBASE_LEARNING_FINISH:", json.dumps(inspection))

    def test_invalid_evidence_or_shape_writes_no_durable_case(self):
        fabricated = copy.deepcopy(self.first)
        fabricated["evidence"]["correction"]["quote"] = "This statement never occurred."
        malformed = copy.deepcopy(self.first)
        malformed["story"]["goal"] = 42
        for selection, reason in [(fabricated, "quote matched 0 messages"), (malformed, "case.story.goal: expected")]:
            with self.subTest(reason=reason):
                failure = self.capture(selection, expected=1)
                self.assertIn(reason, failure.stderr)
                self.assertFalse((self.corpus / "cases.jsonl").exists())
                self.assertFalse((self.corpus / "extractions.jsonl").exists())
                self.assertFalse((self.corpus / "sources").exists())


if __name__ == "__main__":
    unittest.main()
