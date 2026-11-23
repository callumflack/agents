"""Acceptance checks through the real Homebase CLI, outside the coding sandbox."""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def verify(workspace):
    results = []
    scenarios = [
        ("optional absent", False, "absent", 0, "MISSING"),
        ("required absent", True, "absent", 1, "MISSING"),
        ("optional dangling", False, "dangling", 0, "MISSING"),
        ("required dangling", True, "dangling", 1, "MISSING"),
        ("correct link", True, "correct", 0, "OK"),
        ("wrong link", False, "wrong", 1, "WRONG"),
        ("directory conflict", False, "directory", 1, "CONFLICT"),
        ("connection missing to existing target", False, "unlinked", 1, "MISSING"),
    ]
    for name, required, shape, expected, status in scenarios:
        with tempfile.TemporaryDirectory(prefix="pi-acceptance-") as temporary:
            root = Path(temporary) / "homebase"
            root.mkdir()
            (root / "scripts").mkdir()
            for filename in ("check", "_homebase.py"):
                shutil.copyfile(workspace / "scripts" / filename, root / "scripts" / filename)
            targets = Path(temporary) / "targets"
            targets.mkdir()
            target = targets / "project"
            destination = root / "Personal" / "project"
            destination.parent.mkdir()
            if shape in ("correct", "wrong", "directory", "unlinked"):
                target.mkdir()
            if shape in ("correct", "dangling"):
                destination.symlink_to(target)
            elif shape == "wrong":
                other = targets / "other"
                other.mkdir()
                destination.symlink_to(other)
            elif shape == "directory":
                destination.mkdir()
            (root / "workspace.toml").write_text(
                f'version = 1\n[locations]\npersonal = {json.dumps(str(targets))}\n'
                f'[[links]]\nname = "project"\nworkspace = "Personal/project"\n'
                f'location = "personal"\npath = "project"\nrequired = {str(required).lower()}\n'
                '[agents]\nrepository = "agents"\n[[repositories]]\nname = "agents"\n'
                'location = "personal"\npath = "agents"\nurl = "https://example.invalid/agents.git"\n'
            )
            command = [sys.executable, str(root / "scripts" / "check")]
            run = subprocess.run(command, capture_output=True, text=True, timeout=20)
            results.append({"case": name, "expected_exit": expected,
                            "actual_exit": run.returncode, "expected_status": status,
                            "stdout": run.stdout, "stderr": run.stderr,
                            "passed": run.returncode == expected and run.stdout.startswith(status)})
    return {"passed": all(item["passed"] for item in results), "cases": results}


if __name__ == "__main__":
    report = verify(Path(sys.argv[1]).resolve())
    print(json.dumps(report, indent=2))
    sys.exit(0 if report["passed"] else 1)
