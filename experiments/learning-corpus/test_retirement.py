"""Retirement preserves cached callers without capture, context injection or alerts."""

import json
import os
from pathlib import Path
import selectors
import shutil
import subprocess
import sys
import tarfile
import tempfile
import unittest


OWNER = Path(__file__).resolve().parent
NODE = Path("/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node")
sys.path.insert(0, str(OWNER))


def original_source(name):
    archive = OWNER / "history/2026-10-21-runtime.tar.gz"
    if archive.exists():
        with tarfile.open(archive) as bundle:
            matches = [m for m in bundle.getmembers() if m.isfile() and Path(m.name).name == name]
            if len(matches) != 1:
                raise AssertionError(f"Expected one archived {name}, found {len(matches)}")
            return bundle.extractfile(matches[0]).read()
    return (OWNER / name).read_bytes()


class RetirementTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.homebase = self.root / "absent-homebase"
        self.environment = {**os.environ, "CALLUM_HOMEBASE": str(self.homebase),
                            "PYTHONDONTWRITEBYTECODE": "1"}
        self.environment.pop("CALLUM_LEARNING_WORKER", None)

    def invoke(self, name, *arguments, payload="{}"):
        return subprocess.run([sys.executable, "-B", str(OWNER / name), *map(str, arguments)],
                              input=payload, text=True, capture_output=True,
                              env=self.environment, timeout=10)

    def test_cached_entrypoints_ignore_payload_without_accessing_runtime(self):
        corpus = self.homebase / "Learning"
        state = self.root / "absent-checker-state"
        payloads = [json.dumps({"session_id": "existing-chat", "turn_id": "old-turn",
                               "transcript_path": str(self.root / "absent-native.jsonl"),
                               "hook_event_name": "UserPromptSubmit",
                               "prompt": "Explain upload completion and a saved local file."}),
                    "{malformed", "", "null"]
        endpoints = [
            ("learning_auto.py", ["entry", "--data-dir", corpus], {}),
            ("learning_auto.py", ["stop", "--data-dir", corpus], {}),
            ("learning_auto.py", ["drain", "--data-dir", corpus,
                                  "--job", corpus / ".runtime/inbox/auto-old.json"], {}),
            ("learning_entry.py", ["prepare"], None),
            ("learning_entry.py", ["ack"], None),
            ("learning_entry.py", ["error"], None),
            ("learning_hosts.py", ["entry", "pi", "--data-dir", corpus], {}),
            ("learning_hosts.py", ["stop", "pi", "--data-dir", corpus], {}),
            ("learning_watch.py", ["--state-dir", state], {}),
        ]
        for name, arguments, expected in endpoints:
            for payload in payloads:
                with self.subTest(endpoint=name, arguments=arguments, payload=payload):
                    shutil.rmtree(self.homebase, ignore_errors=True)
                    shutil.rmtree(state, ignore_errors=True)
                    result = self.invoke(name, *arguments, payload=payload)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(result.stderr, "")
                    self.assertEqual(json.loads(result.stdout), expected)
                    self.assertFalse(self.homebase.exists(), "Retired caller touched Homebase")
                    self.assertFalse(state.exists(), "Retired checker recreated its state")

    def test_reinstallation_is_refused_without_changing_unrelated_hooks(self):
        hooks = self.root / "hooks.json"
        original = b'{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"unrelated"}]}]}}\n'
        hooks.write_bytes(original)
        result = self.invoke("learning_auto.py", "install", "--hooks-file", hooks,
                             "--data-dir", self.homebase / "Learning")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(hooks.read_bytes(), original)
        self.assertFalse(self.homebase.exists())
        self.assertIn("retir", (result.stdout + result.stderr).lower())

    def test_cached_shell_runner_does_not_invoke_python_or_create_state(self):
        marker = self.root / "interpreter-called"
        interpreter = self.root / "interpreter"
        interpreter.write_text("#!/bin/sh\n: > '" + str(marker) + "'\nexit 0\n")
        interpreter.chmod(0o755)
        state = self.root / "absent-state"
        result = subprocess.run(["/bin/sh", str(OWNER / "learning_watch.sh"), str(state),
                                 str(interpreter)], capture_output=True, text=True,
                                env=self.environment, timeout=10)
        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, "", ""))
        self.assertFalse(marker.exists(), "Retired shell invoked an interpreter")
        self.assertFalse(state.exists(), "Retired shell recreated checker state")

    @unittest.skipUnless(NODE.exists(), "The original installed proxy requires the signed app runtime")
    def test_already_loaded_proxy_uses_retired_helper_and_forwards_without_injection(self):
        import test_capture as fixtures
        fixture = fixtures.CaptureTests()
        fixture.setUp()
        self.addCleanup(fixture.doCleanups)
        fixture.capture(fixture.first)
        before = {str(p.relative_to(fixture.corpus)): p.read_bytes()
                  for p in fixture.corpus.rglob("*") if p.is_file()}
        old = self.root / "cached-proxy"
        old.mkdir()
        proxy = old / "learning_proxy.mjs"
        helper = old / "learning_entry.py"
        proxy.write_bytes(original_source("learning_proxy.mjs"))
        helper.write_bytes(original_source("learning_entry.py"))
        for name in ("learning_auto.py", "learning_corpus.py", "learning_sources.py"):
            shutil.copyfile(OWNER / name, old / name)
        received = self.root / "backend-input"
        backend = self.root / "backend.py"
        backend.write_text("#!" + sys.executable + "\n" +
                          "import json,sys\n"
                          "print(json.dumps({'method':'fixture-ready'}),flush=True)\n"
                          "for line in sys.stdin:\n"
                          "    with open(" + repr(str(received)) + ", 'a') as saved: saved.write(line)\n"
                          "    request=json.loads(line)\n"
                          "    print(json.dumps({'id':request['id'],'result':{}}),flush=True)\n")
        backend.chmod(0o755)
        harness = "import {run} from " + json.dumps(proxy.as_uri()) + "; process.exitCode=await run(JSON.parse(process.argv[1]));"
        environment = {**self.environment, "CALLUM_HOMEBASE": str(fixture.root)}
        process = subprocess.Popen([str(NODE), "--input-type=module", "-e", harness,
                                    json.dumps([str(backend), "app-server"])],
                                   stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, text=True, env=environment)
        try:
            with selectors.DefaultSelector() as ready:
                ready.register(process.stdout, selectors.EVENT_READ)
                self.assertTrue(ready.select(10), "Cached proxy did not start its backend")
            self.assertEqual(json.loads(process.stdout.readline()), {"method": "fixture-ready"})
            # The JavaScript proxy is already loaded; only its per-request helper changes.
            helper.write_bytes((OWNER / "learning_entry.py").read_bytes())
            delegated = {"id": 71, "method": "turn/start", "params": {
                "threadId": "existing-chat", "input": [], "toolOutput": {
                    "namespace": "codex_app", "name": "send_message_to_thread",
                    "output": "<codex_delegation>\n<input>Explain upload completion and a saved local file.</input>\n</codex_delegation>"}}}
            ordinary = {"id": 72, "method": "turn/start", "params": {
                "threadId": "existing-chat", "input": [], "toolOutput": None}}
            requests = " " + json.dumps(delegated) + "  \n" + json.dumps(ordinary) + "\n"
            output, error = process.communicate(requests, timeout=20)
            self.assertEqual(process.returncode, 0, error)
            self.assertEqual(error, "")
            self.assertEqual(received.read_text(), requests)
            self.assertEqual([json.loads(line) for line in output.splitlines()],
                             [{"id": 71, "result": {}}, {"id": 72, "result": {}}])
            after = {str(p.relative_to(fixture.corpus)): p.read_bytes()
                     for p in fixture.corpus.rglob("*") if p.is_file()}
            self.assertEqual(after, before)
        finally:
            if process.poll() is None:
                process.kill()
                process.communicate(timeout=5)

    @unittest.skipUnless(NODE.exists(), "The installed proxy uses the signed app runtime")
    def test_future_proxy_preserves_bytes_arguments_stderr_and_exit_status(self):
        backend = self.root / "byte-backend.py"
        backend.write_text("#!" + sys.executable + "\n"
                           "import json,sys\n"
                           "sys.stderr.write(json.dumps(sys.argv[1:]))\n"
                           "sys.stdout.buffer.write(sys.stdin.buffer.read())\n"
                           "sys.exit(17)\n")
        backend.chmod(0o755)
        arguments = ["-c", "feature=true", "app-server", "--listen", "stdio://"]
        harness = "import {run} from " + json.dumps((OWNER / "learning_proxy.mjs").as_uri()) + "; process.exitCode=await run(JSON.parse(process.argv[1]));"
        payload = b'\x00not-json\n{"id":1}\n\xff'
        result = subprocess.run([str(NODE), "--input-type=module", "-e", harness,
                                 json.dumps([str(backend), *arguments])], input=payload,
                                capture_output=True, env=self.environment, timeout=10)
        self.assertEqual(result.returncode, 17)
        self.assertEqual(result.stdout, payload)
        self.assertEqual(json.loads(result.stderr), arguments)


if __name__ == "__main__":
    unittest.main()
