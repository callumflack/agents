"""Visible native Pi messages. Never convert a host into Codex."""
import hashlib
import itertools
import copy


def text_content(content):
    if isinstance(content, str):
        return content
    return "\n".join(p.get("text", "") for p in content or [] if p.get("type") == "text")


def other_transcript(path, read_rows):
    rows = iter(read_rows(path))
    first = next(rows, None)
    if first is None:
        return None
    _, header = first
    if header.get("type") == "learning_archive":
        meta = header["payload"]
        harness = meta["harness"]
    elif header.get("type") == "session":
        harness = "pi"
        meta = {k: header[k] for k in ("id", "cwd", "timestamp") if k in header}
    else:
        return None
    if harness != "pi":
        raise ValueError("Unsupported native learning source")
    meta = {**meta, "harness": harness}
    messages, turns = [], {}
    current = None
    for line, row in itertools.chain([first], rows):
        if row.get("type") != "message":
            continue
        message = row["message"]
        identity, parent = row["id"], row.get("parentId")
        role = message.get("role")
        if role == "assistant" and message.get("stopReason") not in ("stop", "length"):
            continue
        text = text_content(message.get("content", []))
        if role not in ("user", "assistant") or not text.strip():
            turns[identity] = turns.get(parent, current)
            continue
        if text.startswith(("<system-reminder>", "# AGENTS.md instructions")):
            continue
        if role == "user":
            current = identity
        else:
            current = turns.get(parent, current)
        turns[identity] = current
        messages.append({"line": row.get("native_line", line), "message_id": identity,
                         "turn_id": row.get("native_turn_id", current), "role": role,
                         "timestamp": row.get("timestamp"), "text": text,
                         "text_sha256": hashlib.sha256(text.encode()).hexdigest()})
    if not meta.get("id") or not meta.get("cwd"):
        raise ValueError("Native source lacks session identity or working directory")
    return meta, messages


def source_header(meta):
    if meta.get("harness", "codex") == "codex":
        return {"type": "session_meta", "payload": {k: meta[k] for k in ("id", "session_id", "cwd", "timestamp") if k in meta}}
    return {"type": "learning_archive", "payload": {k: meta[k] for k in ("harness", "id", "cwd", "timestamp") if k in meta}}


def visible_row(row, harness):
    if harness == "codex":
        return row
    result = copy.deepcopy(row)
    message = row["message"]
    result["message"] = {k: message[k] for k in ("role", "stopReason", "stop_reason") if k in message}
    content = message.get("content", [])
    result["message"]["content"] = content if isinstance(content, str) else [p for p in content if p.get("type") == "text"]
    return result
