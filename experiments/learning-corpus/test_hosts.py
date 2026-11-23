"""Manual capture preserves native Pi identity and portable visible evidence."""

import json
import os
from pathlib import Path
import sys
import tempfile
import unittest


OWNER = Path(__file__).resolve().parent
sys.path.insert(0, str(OWNER))

from learning_corpus import audit, capture, latest, search, transcript
import test_capture as fixtures


class HostSourceTests(unittest.TestCase):
    def test_manual_pi_capture_preserves_native_evidence_and_remains_portable(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            corpus = root / "Learning"
            source = root / "native.jsonl"
            request = "A local backup is incomplete until its linked diagrams can be read offline."
            answer = "Check the actual diagram bytes offline, not only names or cloud metadata."
            rows = [
                {"type": "session", "id": fixtures.SESSION, "version": 3,
                 "cwd": str(root), "timestamp": "2026-10-20T00:00:00Z"},
                {"type": "message", "id": "u1", "parentId": None,
                 "timestamp": "2026-10-20T00:01:00Z", "message": {
                     "role": "user", "content": [{"type": "text", "text": request}]}},
                {"type": "message", "id": "a0", "parentId": "u1",
                 "timestamp": "2026-10-20T00:02:00Z", "message": {
                     "role": "assistant", "stopReason": "toolUse", "content": [
                         {"type": "thinking", "thinking": "Private reasoning."},
                         {"type": "toolCall", "name": "read"}]}},
                {"type": "message", "id": "a1", "parentId": "a0",
                 "timestamp": "2026-10-20T00:03:00Z", "message": {
                     "role": "assistant", "stopReason": "stop", "content": [
                         {"type": "thinking", "thinking": "Private reasoning."},
                         {"type": "text", "text": answer}]}},
            ]
            source.write_text("".join(json.dumps(row) + "\n" for row in rows))
            metadata, messages = transcript(source)
            self.assertEqual(metadata["harness"], "pi")
            self.assertEqual([message["text"] for message in messages], [request, answer])
            self.assertEqual([message["message_id"] for message in messages], ["u1", "a1"])
            self.assertEqual([message["turn_id"] for message in messages], ["u1", "u1"])
            selection = fixtures.CaptureTests.selection("pi-offline-assets", request, answer)
            selection["evidence"]["correction"]["line"] = 2
            selection["evidence"]["result"]["line"] = 4
            spec = root / "selection.jsonl"
            spec.write_text(json.dumps(selection) + "\n")
            self.assertEqual(capture(spec, source, corpus)["added"], 1)
            record = latest(corpus / "cases.jsonl")[0]
            self.assertEqual(record["source"]["harness"], "pi")
            self.assertEqual(record["source"]["transcript_path"],
                             f"sources/pi-{fixtures.SESSION}.jsonl")
            self.assertNotIn("codex://", record["source"]["thread_url"])
            archive = corpus / record["source"]["transcript_path"]
            self.assertNotIn("Private reasoning", archive.read_text())
            self.assertNotIn("toolCall", archive.read_text())
            self.assertEqual(capture(spec, source, corpus)["added"], 0)
            source.unlink()
            self.assertEqual(audit(corpus / "cases.jsonl")["verified_revisions"], 1)
            self.assertEqual(search(corpus / "cases.jsonl", "offline backup diagram bytes", 1)[0]["case_key"],
                             "pi-offline-assets")


if __name__ == "__main__":
    unittest.main()
