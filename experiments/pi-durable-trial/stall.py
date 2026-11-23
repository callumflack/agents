"""Deliberate local fault: a repair command waits for a real child to finish."""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

folder = Path(__file__).resolve().parent / ".trial-runtime"
folder.mkdir(exist_ok=True)
child = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(600)"])
marker = {"pid": os.getpid(), "ppid": os.getppid(), "pgid": os.getpgid(0),
          "child_pid": child.pid, "child_pgid": os.getpgid(child.pid), "started_at_ms": int(time.time() * 1000)}
temporary = folder / "stall.tmp"
temporary.write_text(json.dumps(marker, indent=2) + "\n")
temporary.replace(folder / "stall.json")
print(json.dumps({"deliberate_stall": marker}), flush=True)
child.wait()
