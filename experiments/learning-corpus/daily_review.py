"""On-demand daily review inputs. No retained state; strict capture stays unchanged."""

from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import tempfile

from learning_corpus import transcript


CHUNK = 1024 * 1024
MAX_ROW = 32 * CHUNK
BAD_STATUSES = {"partial", "pending", "missing", "unreadable", "unstable"}


def instant(value):
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("Review timestamps must include a timezone")
    return result.astimezone(timezone.utc)


def roots(codex_homes, pi_roots):
    home = Path.home()
    if codex_homes is None:
        codex_homes = [home / ".codex"]
        if os.environ.get("CODEX_HOME"):
            codex_homes.append(Path(os.environ["CODEX_HOME"]))
    if pi_roots is None:
        pi_roots = [home / ".pi/agent/sessions"]
        if os.environ.get("PI_CODING_AGENT_DIR"):
            pi_roots.append(Path(os.environ["PI_CODING_AGENT_DIR"]) / "sessions")
    return ([p.expanduser().resolve() for p in dict.fromkeys(codex_homes)],
            [p.expanduser().resolve() for p in dict.fromkeys(pi_roots)])


def discover(codex_homes, pi_roots):
    candidates, errors, scanned_roots = {}, [], []

    def add(path, harness, index=None):
        path = Path(path).expanduser().resolve()
        record = candidates.setdefault(str(path), {"path": str(path), "harness": harness})
        if index:
            record["index"] = index

    def walk(root, harness):
        scanned_roots.append({"path": str(root), "present": root.exists(), "harness": harness})
        if not root.exists():
            return
        def failed(error):
            errors.append({"path": str(root), "error": str(error)})
        for folder, _, names in os.walk(root, onerror=failed):
            for name in names:
                if name.endswith(".jsonl"):
                    add(Path(folder) / name, harness)

    for home in codex_homes:
        walk(home / "sessions", "codex")
        walk(home / "archived_sessions", "codex")
        indexes = sorted(home.glob("state_*.sqlite"), key=lambda p: int(p.stem.split("_")[-1]))
        if not indexes:
            continue
        database = indexes[-1]
        try:
            with sqlite3.connect(database.as_uri() + "?mode=ro", uri=True) as connection:
                connection.row_factory = sqlite3.Row
                for row in connection.execute("SELECT id, rollout_path, source, updated_at FROM threads"):
                    if row["rollout_path"]:
                        add(row["rollout_path"], "codex", dict(row))
                    else:
                        errors.append({"path": str(database), "session_id": row["id"],
                                       "error": "Indexed thread has no transcript path"})
        except (sqlite3.Error, OSError) as error:
            errors.append({"path": str(database), "error": str(error)})
    for root in pi_roots:
        walk(root, "pi")
    return list(candidates.values()), scanned_roots, errors


def is_worker(source):
    if isinstance(source, str):
        try:
            source = json.loads(source)
        except ValueError:
            return False
    return isinstance(source, dict) and "subagent" in source


class Snapshot:
    """Copy one initial byte boundary, then verify the original prefix before accepting it."""

    def __init__(self, path):
        self.path = Path(path)
        self.file = tempfile.TemporaryFile()
        self.diagnostics = {}
        self.pending = False
        try:
            with self.path.open("rb") as source:
                self.initial = os.fstat(source.fileno())
                remaining = self.initial.st_size
                digest = hashlib.sha256()
                while remaining:
                    block = source.read(min(CHUNK, remaining))
                    if not block:
                        raise OSError("Source truncated while taking snapshot")
                    self.file.write(block)
                    digest.update(block)
                    remaining -= len(block)
                self.digest = digest.hexdigest()
        except Exception:
            self.file.close()
            raise

    def close(self):
        self.file.close()

    def rows(self, _path):
        self.file.seek(0)
        number = 0
        while True:
            raw = self.file.readline(MAX_ROW + 1)
            if not raw:
                break
            number += 1
            if len(raw) > MAX_ROW:
                while raw and not raw.endswith(b"\n"):
                    raw = self.file.readline(MAX_ROW + 1)
                self.diagnostics[number] = "Row exceeds 32 MiB; omitted"
                continue
            if not raw.endswith(b"\n"):
                self.pending = True
                self.diagnostics[number] = "Unfinished final row; retry next pass"
                break
            if not raw.strip():
                continue
            try:
                row = json.loads(raw)
                if not isinstance(row, dict) or not isinstance(row.get("type"), str):
                    raise ValueError("Expected a native record object")
                payload = row.get("payload", {})
                if not isinstance(payload, dict):
                    raise ValueError("Invalid native payload")
                message = row.get("message", payload)
                if row["type"] in ("message", "response_item"):
                    if not isinstance(message, dict):
                        raise ValueError("Invalid native message")
                    content = message.get("content", [])
                    if row["type"] == "response_item" and message.get("type") == "message":
                        if not isinstance(content, list):
                            raise ValueError("Codex message content must be a list")
                    if not isinstance(content, (list, str)) or (
                        isinstance(content, list) and any(not isinstance(p, dict) for p in content)
                    ):
                        raise ValueError("Invalid native message content")
                yield number, row
            except (ValueError, UnicodeError) as error:
                self.diagnostics[number] = str(error)

    def verify(self):
        digest = hashlib.sha256()
        with self.path.open("rb") as source:
            before = os.fstat(source.fileno())
            if (before.st_dev, before.st_ino) != (self.initial.st_dev, self.initial.st_ino):
                return False, False
            remaining = self.initial.st_size
            while remaining:
                block = source.read(min(CHUNK, remaining))
                if not block:
                    return False, False
                digest.update(block)
                remaining -= len(block)
            after = os.fstat(source.fileno())
        current = self.path.stat()
        stable = (digest.hexdigest() == self.digest and
                  before.st_mtime_ns == after.st_mtime_ns and
                  (current.st_dev, current.st_ino) == (after.st_dev, after.st_ino))
        return stable, after.st_size > self.initial.st_size


def read_source(candidate, since, until):
    result = {k: v for k, v in candidate.items() if k != "index"}
    result.update(status="unreadable", messages=[])
    path = Path(candidate["path"])
    index = candidate.get("index", {})
    snapshot = None
    if is_worker(index.get("source")):
        result.update(session_id=index.get("id"), status="excluded_worker",
                      reason="Indexed internal agent/approval session, not a user chat")
        return result
    try:
        # Read the first native header only; copied parent headers cannot replace identity.
        with path.open("rb") as stream:
            header = json.loads(stream.readline(MAX_ROW + 1))
        if not isinstance(header, dict):
            raise ValueError("Invalid session header")
        metadata = header.get("payload") if header.get("type") == "session_meta" else header
        if not isinstance(metadata, dict):
            raise ValueError("Invalid session metadata")
        result["session_id"] = metadata.get("id") or metadata.get("session_id")
        if is_worker(metadata.get("source")) or is_worker(index.get("source")):
            result.update(status="excluded_worker", reason="Internal agent/approval session, not a user chat")
            return result
        if index.get("id") and result["session_id"] != index["id"]:
            raise ValueError("Index and native session identities disagree")
        snapshot = Snapshot(path)
        metadata, messages = transcript(path, snapshot.rows)
        if (metadata.get("id") or metadata.get("session_id")) != result["session_id"]:
            result.update(status="unstable", reason="Session identity changed while taking snapshot")
            return result
        if metadata.get("harness", "codex") != candidate["harness"]:
            raise ValueError("Native harness disagrees with discovery root")
        result.update(cwd=metadata.get("cwd"), snapshot_bytes=snapshot.initial.st_size,
                      snapshot_sha256=snapshot.digest)
        selected = []
        for message in messages:
            if message["text"].lstrip().startswith(("<external_codex_apps_open_page>",
                                                    "<permissions instructions>")):
                continue
            try:
                timestamp = instant(message.get("timestamp") or "")
            except (ValueError, AttributeError):
                snapshot.diagnostics[message["line"]] = "Visible message lacks a valid timestamp"
                continue
            if since <= timestamp < until:
                selected.append(message)
        stable, appended = snapshot.verify()
        if not stable:
            result.update(status="unstable", reason="Source changed/replaced; discard snapshot and retry")
            return result
        diagnostics = [{"line": line, "reason": reason}
                       for line, reason in sorted(snapshot.diagnostics.items())]
        status = "read" if selected else "outside_window"
        if appended:
            diagnostics.append({"line": None, "reason": "Source appended after snapshot; retry interval before advancing cutoff"})
            status = "pending"
        if snapshot.diagnostics:
            status = "pending" if snapshot.pending and len(diagnostics) == 1 else "partial"
        result.update(status=status, messages=selected, diagnostics=diagnostics,
                      appended_after_snapshot=appended)
    except FileNotFoundError:
        updated = index.get("updated_at")
        if updated and datetime.fromtimestamp(updated, timezone.utc) < since:
            result.update(status="outside_window_missing", reason="Old indexed source missing; not reviewed")
        else:
            result.update(status="missing", reason="Transcript path does not exist")
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as error:
        result.update(status="unreadable", reason=str(error))
    finally:
        if snapshot is not None:
            snapshot.close()
    return result


def review_history(since, until, codex_homes=None, pi_roots=None):
    since, until = instant(since), instant(until)
    if since >= until:
        raise ValueError("Review start must precede its end")
    codex_homes, pi_roots = roots(codex_homes, pi_roots)
    candidates, source_roots, errors = discover(codex_homes, pi_roots)
    sources = [read_source(c, since, until) for c in sorted(candidates, key=lambda c: c["path"])]
    counts = Counter(s["status"] for s in sources)
    return {"since": since.isoformat(), "until": until.isoformat(),
            "coverage_complete": not errors and not any(counts[s] for s in BAD_STATUSES),
            "scope": "Local native Codex (including archives/indexed paths) and Pi; workers excluded explicitly",
            "roots": source_roots, "discovery_errors": errors,
            "counts": dict(counts), "sources": sources}
