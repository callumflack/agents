"""External acceptance for Homebase's existing config-path error."""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

source = Path(sys.argv[1])
cases = []
for command in ("check", "setup"):
    for kind in ("directory", "missing", "malformed", "valid"):
        with tempfile.TemporaryDirectory(prefix="homebase-config-acceptance-") as temporary:
            base = Path(temporary)
            root, owners = base / "homebase", base / "owners"
            (root / "scripts").mkdir(parents=True)
            owners.mkdir()
            for name in ("_homebase.py", "check", "setup"):
                shutil.copyfile(source / "scripts" / name, root / "scripts" / name)
            (root / "workspace.toml").write_text(f'''version = 1
[locations]
projects = {str(owners)!r}
[agents]
repository = "agents"
[[links]]
name = "optional"
workspace = "Personal/optional"
location = "projects"
path = "optional"
[[repositories]]
name = "agents"
location = "projects"
path = "agents"
url = "https://example.invalid/agents.git"
''')
            config = base / "local.toml"
            if kind == "directory":
                config.mkdir()
            elif kind == "malformed":
                config.write_text("[locations\n")
            elif kind == "valid":
                config.write_text(f"[locations]\nprojects = {str(owners)!r}\n")

            def files():
                return {str(path.relative_to(base)): hashlib.sha256(path.read_bytes()).hexdigest()
                        for path in base.rglob("*") if path.is_file()}

            before = files()
            result = subprocess.run([sys.executable, "-B", str(root / "scripts" / command),
                                     "--config", str(config)], cwd=root, capture_output=True,
                                    text=True, timeout=15,
                                    env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"})
            expected = 0 if kind == "valid" else 2
            diagnostic = ("MISSING" in result.stdout if kind == "valid" else
                          "ERROR" in result.stderr and str(config) in result.stderr)
            if kind == "missing":
                diagnostic = diagnostic and "config does not exist" in result.stderr
            if kind == "malformed":
                diagnostic = diagnostic and "invalid TOML" in result.stderr
            passed = (result.returncode == expected and diagnostic
                      and "Traceback" not in result.stdout + result.stderr and files() == before)
            cases.append({"command": command, "config_kind": kind, "expected_exit": expected,
                          "actual_exit": result.returncode, "stdout": result.stdout,
                          "stderr": result.stderr, "files_unchanged": files() == before,
                          "passed": passed})
print(json.dumps({"passed": all(case["passed"] for case in cases), "cases": cases}, indent=2))
raise SystemExit(0 if all(case["passed"] for case in cases) else 1)
